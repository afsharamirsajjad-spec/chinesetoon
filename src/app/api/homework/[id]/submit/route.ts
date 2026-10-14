// ---------------------------------------------------------------------------
// 📚 POST /api/homework/[id]/submit — ارسال/به‌روزرسانی پاسخ دانش‌پذیر
//
// FormData: note (اختیاری) + files (۰ تا ۵ فایل). هر دانش‌پذیر برای هر تکلیف
// فقط یک رکورد پاسخ دارد (upsert روی @@unique) — ارسال دوباره همان رکورد را
// با فایل‌ها/یادداشت تازه جایگزین می‌کند (فایل‌های قبلی حذف فیزیکی می‌شوند).
// بازخورد استاد با ارسال دوباره پاک نمی‌شود (استاد صاحب بازخورد است).
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/user-auth'
import { isSameOrigin } from '@/lib/http-guard'
import { rateLimit, tooManyRequests } from '@/lib/rate-limit'
import {
  MAX_HOMEWORK_FILE_BYTES,
  MAX_HOMEWORK_FILES_PER_UPLOAD,
  homeworkExtFor,
  generateHomeworkFileId,
  saveHomeworkFile,
  deleteHomeworkFile,
  sanitizeHomeworkFileName,
  HOMEWORK_MIME_BY_EXT,
  HOMEWORK_FILE_EXT_BY_MIME,
  HomeworkStorageUnavailableError,
} from '@/lib/homework-files'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req).catch(() => null)
  if (!user) {
    return NextResponse.json({ error: 'Please sign in to submit homework', code: 'AUTH_REQUIRED' }, { status: 401 })
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  // ۱۲ ارسال پاسخ در ۱۰ دقیقه — جلوگیری از اسپم آپلود
  const rl = await rateLimit('hw-submit', req, 12, 600, 600)
  if (!rl.ok) return tooManyRequests(rl)

  const { id: homeworkId } = await ctx.params
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

  const note = String(form.get('note') ?? '').trim().slice(0, 2000)
  const incoming = form.getAll('files').filter((f): f is File => f instanceof File && f.size > 0)
  if (incoming.length > MAX_HOMEWORK_FILES_PER_UPLOAD) {
    return NextResponse.json(
      { error: `Max ${MAX_HOMEWORK_FILES_PER_UPLOAD} files per submission` },
      { status: 400 }
    )
  }
  if (!note && incoming.length === 0) {
    return NextResponse.json({ error: 'Add a note or at least one file' }, { status: 400 })
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
    const homework = await db.homework.findUnique({ where: { id: homeworkId }, select: { id: true, archived: true } })
    if (!homework || homework.archived) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // فایل‌های جدید اول ذخیره می‌شوند
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

    // upsert: رکورد قبلی همین کاربر برای همین تکلیف — فایل‌های قبلی جایگزین می‌شوند
    const existing = await db.homeworkSubmission.findUnique({
      where: { homeworkId_userId: { homeworkId, userId: user.id } },
      include: { files: true },
    })

    const submission = await db.homeworkSubmission.upsert({
      where: { homeworkId_userId: { homeworkId, userId: user.id } },
      create: { homeworkId, userId: user.id, note },
      update: { note },
    })

    // فایل‌ها در سطح خودِ جدول — deleteMany قدیمی‌ها + createMany تازه‌ها
    await db.homeworkFile.deleteMany({ where: { submissionId: submission.id } })
    await db.homeworkFile.createMany({
      data: saved.map((s, i) => ({
        id: s.id,
        kind: 'SUBMISSION',
        homeworkId,
        submissionId: submission.id,
        name: prepared[i].name,
        mime: prepared[i].mime,
        size: prepared[i].size,
        url: s.url,
      })),
    })

    // حذف فیزیکی فایل‌های قدیمی (بعد از جایگزینی موفق رکوردها)
    if (existing) {
      await Promise.all(
        existing.files.map((f) =>
          deleteHomeworkFile(f.id, HOMEWORK_FILE_EXT_BY_MIME[f.mime] ?? '', f.url)
        )
      )
    }

    return NextResponse.json({ ok: true, submissionId: submission.id }, { status: 201 })
  } catch (e) {
    console.error('[POST /api/homework/:id/submit] error:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Could not submit your homework. Please try again.' }, { status: 500 })
  }
}
