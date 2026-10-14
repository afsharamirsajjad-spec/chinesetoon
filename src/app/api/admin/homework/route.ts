// ---------------------------------------------------------------------------
// 📚 /api/admin/homework — مدیریت تکالیف (استاد/ادمین)
//
//   GET  — فهرست تکالیف + شمار پاسخ‌ها و شمار «بررسی‌نشده» (feedback خالی)
//   POST — ساخت تکلیف جدید (FormData: title, description, className, dueAt, files)
//
// امنیت: فقط ادمین (x-admin-key) + same-origin + سقف حجم/تعداد فایل.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAuthorized, getAdminActor } from '@/lib/admin-auth'
import { isSameOrigin } from '@/lib/http-guard'
import { rateLimit, tooManyRequests } from '@/lib/rate-limit'
import { logAdminAction } from '@/lib/audit'
import {
  MAX_HOMEWORK_FILE_BYTES,
  MAX_HOMEWORK_FILES_PER_UPLOAD,
  homeworkExtFor,
  generateHomeworkFileId,
  saveHomeworkFile,
  sanitizeHomeworkFileName,
  HOMEWORK_MIME_BY_EXT,
  HomeworkStorageUnavailableError,
} from '@/lib/homework-files'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const includeArchived = new URL(req.url).searchParams.get('archived') === '1'
    const rows = await db.homework.findMany({
      where: includeArchived ? {} : { archived: false },
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: {
        _count: { select: { submissions: true, files: true } },
        submissions: { select: { feedback: true } },
      },
    })
    const items = rows.map((h) => ({
      id: h.id,
      title: h.title,
      description: h.description,
      className: h.className,
      dueAt: h.dueAt?.toISOString() ?? null,
      archived: h.archived,
      createdAt: h.createdAt.toISOString(),
      attachmentCount: h._count.files,
      submissionCount: h._count.submissions,
      // پاسخ‌هایی که استاد هنوز بازخورد نداده
      pendingReview: h.submissions.filter((s) => s.feedback == null).length,
    }))
    return NextResponse.json({ homework: items })
  } catch (e) {
    console.error('[GET /api/admin/homework] error:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  // ۲۰ ساخت تکلیف در ۱۰ دقیقه — بیش از نیاز واقعی استاد
  const rl = await rateLimit('hw-create', req, 20, 600, 600)
  if (!rl.ok) return tooManyRequests(rl)

  const contentLength = Number(req.headers.get('content-length') || '0')
  if (contentLength > MAX_HOMEWORK_FILE_BYTES * MAX_HOMEWORK_FILES_PER_UPLOAD + 256 * 1024) {
    return NextResponse.json(
      { error: `Too much data — max ${MAX_HOMEWORK_FILES_PER_UPLOAD} files, ${MAX_HOMEWORK_FILE_BYTES / 1024 / 1024} MB each` },
      { status: 413 }
    )
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const title = String(form.get('title') ?? '').trim().slice(0, 160)
  const description = String(form.get('description') ?? '').trim().slice(0, 4000)
  const className = String(form.get('className') ?? '').trim().slice(0, 120)
  const dueAtRaw = String(form.get('dueAt') ?? '').trim()
  if (title.length < 2) {
    return NextResponse.json({ error: 'Title is required (at least 2 characters)' }, { status: 400 })
  }
  let dueAt: Date | null = null
  if (dueAtRaw) {
    const t = Date.parse(dueAtRaw)
    if (!Number.isFinite(t)) {
      return NextResponse.json({ error: 'Invalid due date' }, { status: 400 })
    }
    dueAt = new Date(t)
  }

  // فایل‌های پیوست تکلیف — فیلد «files» (چندتایی)
  const incoming = form.getAll('files').filter((f): f is File => f instanceof File && f.size > 0)
  if (incoming.length > MAX_HOMEWORK_FILES_PER_UPLOAD) {
    return NextResponse.json(
      { error: `Max ${MAX_HOMEWORK_FILES_PER_UPLOAD} files per assignment` },
      { status: 400 }
    )
  }
  const prepared: { id: string; ext: string; mime: string; name: string; size: number; data: Buffer }[] = []
  for (const f of incoming) {
    if (f.size > MAX_HOMEWORK_FILE_BYTES) {
      return NextResponse.json(
        { error: `"${f.name}" is too large (max ${MAX_HOMEWORK_FILE_BYTES / 1024 / 1024} MB)` },
        { status: 413 }
      )
    }
    const ext = homeworkExtFor({ name: f.name, type: f.type })
    if (!ext) {
      return NextResponse.json(
        { error: `"${f.name}" has an unsupported file type` },
        { status: 415 }
      )
    }
    prepared.push({
      id: generateHomeworkFileId(),
      ext,
      mime: HOMEWORK_MIME_BY_EXT[ext],
      name: sanitizeHomeworkFileName(f.name),
      size: f.size,
      data: Buffer.from(await f.arrayBuffer()),
    })
  }

  try {
    // فایل‌ها اول ذخیره می‌شوند؛ اگر DB شکست خورد فایل‌های مضاعف بهترین‌تلاش پاک می‌شوند
    const saved: { id: string; ext: string; url: string | null }[] = []
    try {
      for (const p of prepared) {
        const { url } = await saveHomeworkFile(p.id, p.ext, p.data)
        saved.push({ id: p.id, ext: p.ext, url })
      }
    } catch (e) {
      if (e instanceof HomeworkStorageUnavailableError) {
        return NextResponse.json({ error: e.message }, { status: 503 })
      }
      throw e
    }

    try {
      const homework = await db.homework.create({
        data: {
          title,
          description,
          className,
          dueAt,
          files: {
            create: saved.map((s, i) => ({
              id: s.id,
              kind: 'ASSIGNMENT',
              name: prepared[i].name,
              mime: prepared[i].mime,
              size: prepared[i].size,
              url: s.url,
            })),
          },
        },
        include: { files: true },
      })
      logAdminAction({
        actor: getAdminActor(req),
        action: 'homework.create',
        targetType: 'HOMEWORK',
        targetId: homework.id,
        meta: { title: homework.title, files: saved.length },
      })
      return NextResponse.json({ ok: true, homework }, { status: 201 })
    } catch (e) {
      const { deleteHomeworkFile } = await import('@/lib/homework-files')
      await Promise.all(saved.map((s) => deleteHomeworkFile(s.id, s.ext, s.url)))
      throw e
    }
  } catch (e) {
    console.error('[POST /api/admin/homework] error:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Could not create the assignment. Please try again.' }, { status: 500 })
  }
}
