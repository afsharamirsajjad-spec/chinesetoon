// ---------------------------------------------------------------------------
// 🎓 POST /api/teacher/classes/[classId]/materials — آپلود مادهٔ آموزشی
//
// FormData: title, description, moduleLabel, published, visibleFrom, files
// فایل‌ها با همان زیرساخت امن تکالیف ذخیره می‌شوند (پسوند مجاز + 48hex +
// Blob/FS). فقط استادِ همان کلاس یا ادمین.
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
  const rl = await rateLimit('lms-material', req, 20, 600, 600)
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
  const moduleLabel = String(form.get('moduleLabel') ?? '').trim().slice(0, 80)
  const published = String(form.get('published') ?? 'true').trim() !== 'false'
  const visibleFromRaw = String(form.get('visibleFrom') ?? '').trim()
  if (title.length < 2) {
    return NextResponse.json({ error: 'Title is required (at least 2 characters)' }, { status: 400 })
  }
  let visibleFrom: Date | null = null
  if (visibleFromRaw) {
    const t = Date.parse(visibleFromRaw)
    if (!Number.isFinite(t)) {
      return NextResponse.json({ error: 'Invalid publish date' }, { status: 400 })
    }
    visibleFrom = new Date(t)
  }

  const incoming = form.getAll('files').filter((f): f is File => f instanceof File && f.size > 0)
  if (incoming.length > MAX_HOMEWORK_FILES_PER_UPLOAD) {
    return NextResponse.json({ error: `Max ${MAX_HOMEWORK_FILES_PER_UPLOAD} files per material` }, { status: 400 })
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
      const material = await db.learningMaterial.create({
        data: {
          classId,
          title,
          description,
          moduleLabel,
          published,
          visibleFrom,
          files: {
            create: saved.map((s, i) => ({
              id: s.id,
              name: prepared[i].name,
              mime: prepared[i].mime,
              size: prepared[i].size,
              url: s.url,
            })),
          },
        },
      })
      // 🔔 اعلان برای دانش‌پذیرهای ثبت‌نام‌شده — فقط برای مادهٔ منتشرشده
      if (published) {
        await notifyEnrolledStudents(classId, {
          kind: 'LMS_MATERIAL',
          title: 'New course material',
          body: `"${title}" was just added to your class — check your student dashboard.`,
        })
      }
      return NextResponse.json({ ok: true, materialId: material.id }, { status: 201 })
    } catch (e) {
      const { deleteHomeworkFile } = await import('@/lib/homework-files')
      await Promise.all(saved.map((s) => deleteHomeworkFile(s.id, s.ext, s.url)))
      throw e
    }
  } catch (e) {
    console.error('[POST /api/teacher/classes/:id/materials] error:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Could not upload the material. Please try again.' }, { status: 500 })
  }
}
