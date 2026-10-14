// ---------------------------------------------------------------------------
// 🎓 POST /api/teacher/classes/[classId]/assignments — ساخت تکلیف برای کلاس
// FormData: title, description, dueAt, maxScore, files
// تکلیف به کلاس وصل می‌شود و فقط برای ثبت‌نام‌شده‌های همان کلاس پیدا است.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getLmsViewer, isTeacher, teacherClassGuard } from '@/lib/lms'
import { isSameOrigin } from '@/lib/http-guard'
import { rateLimit, tooManyRequests } from '@/lib/rate-limit'
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
import { notifyEnrolledStudents } from '@/lib/lms-notify'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, ctx: { params: Promise<{ classId: string }> }) {
  const viewer = await getLmsViewer(req)
  if (!isTeacher(viewer) || !viewer.user) {
    return NextResponse.json({ error: 'Teacher access required', code: 'FORBIDDEN' }, { status: 403 })
  }
  const { classId } = await ctx.params
  const guarded = await teacherClassGuard(viewer, classId)
  if (!guarded) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 })
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const rl = await rateLimit('lms-assignment', req, 20, 600, 600)
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
  const dueAtRaw = String(form.get('dueAt') ?? '').trim()
  const maxScoreRaw = Number(form.get('maxScore') ?? 100)
  if (title.length < 2) {
    return NextResponse.json({ error: 'Title is required (at least 2 characters)' }, { status: 400 })
  }
  const maxScore = Number.isFinite(maxScoreRaw) && maxScoreRaw > 0 && maxScoreRaw <= 1000 ? Math.round(maxScoreRaw) : 100
  let dueAt: Date | null = null
  if (dueAtRaw) {
    const t = Date.parse(dueAtRaw)
    if (!Number.isFinite(t)) {
      return NextResponse.json({ error: 'Invalid due date' }, { status: 400 })
    }
    dueAt = new Date(t)
  }

  const incoming = form.getAll('files').filter((f): f is File => f instanceof File && f.size > 0)
  if (incoming.length > MAX_HOMEWORK_FILES_PER_UPLOAD) {
    return NextResponse.json({ error: `Max ${MAX_HOMEWORK_FILES_PER_UPLOAD} files per assignment` }, { status: 400 })
  }
  const prepared: { id: string; ext: string; mime: string; name: string; size: number; data: Buffer }[] = []
  for (const f of incoming) {
    if (f.size > MAX_HOMEWORK_FILE_BYTES) {
      return NextResponse.json({ error: `"${f.name}" is too large (max ${MAX_HOMEWORK_FILE_BYTES / 1024 / 1024} MB)` }, { status: 413 })
    }
    const ext = homeworkExtFor({ name: f.name, type: f.type })
    if (!ext) {
      return NextResponse.json({ error: `"${f.name}" has an unsupported file type` }, { status: 415 })
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
          classId,
          maxScore,
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
      })
      await notifyEnrolledStudents(classId, {
        kind: 'LMS_ASSIGNMENT',
        title: 'New assignment',
        body: `"${title}" was posted in your class${dueAt ? ` — due ${dueAt.toDateString()}` : ''}.`,
      })
      return NextResponse.json({ ok: true, homeworkId: homework.id }, { status: 201 })
    } catch (e) {
      const { deleteHomeworkFile } = await import('@/lib/homework-files')
      await Promise.all(saved.map((s) => deleteHomeworkFile(s.id, s.ext, s.url)))
      throw e
    }
  } catch (e) {
    console.error('[POST /api/teacher/classes/:id/assignments] error:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Could not create the assignment. Please try again.' }, { status: 500 })
  }
}
