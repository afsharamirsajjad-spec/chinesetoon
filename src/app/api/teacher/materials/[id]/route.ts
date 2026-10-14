// ---------------------------------------------------------------------------
// 🎓 PATCH/DELETE /api/teacher/materials/[id] — ویرایش/حذف مادهٔ آموزشی
// PATCH body: { title?, description?, moduleLabel?, published?, visibleFrom? }
// حذف = کامل (رکوردها cascade، فایل‌های فیزیکی بهترین‌تلاش)
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getLmsViewer, isTeacher, teacherClassGuard } from '@/lib/lms'
import { isSameOrigin } from '@/lib/http-guard'
import { deleteHomeworkFile, HOMEWORK_FILE_EXT_BY_MIME } from '@/lib/homework-files'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const viewer = await getLmsViewer(req)
  if (!isTeacher(viewer) || !viewer.user) {
    return NextResponse.json({ error: 'Teacher access required', code: 'FORBIDDEN' }, { status: 403 })
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await ctx.params
  try {
    const material = await db.learningMaterial.findUnique({
      where: { id },
      select: { classId: true },
    })
    if (!material || !(await teacherClassGuard(viewer, material.classId))) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }
    const body = (await req.json()) as {
      title?: unknown
      description?: unknown
      moduleLabel?: unknown
      published?: unknown
      visibleFrom?: unknown
    }
    const data: Prisma.LearningMaterialUpdateInput = {}
    if (typeof body.title === 'string') {
      const t = body.title.trim().slice(0, 160)
      if (t.length < 2) return NextResponse.json({ error: 'Title is too short' }, { status: 400 })
      data.title = t
    }
    if (typeof body.description === 'string') data.description = body.description.trim().slice(0, 4000)
    if (typeof body.moduleLabel === 'string') data.moduleLabel = body.moduleLabel.trim().slice(0, 80)
    if (typeof body.published === 'boolean') data.published = body.published
    if (body.visibleFrom === null) data.visibleFrom = null
    else if (typeof body.visibleFrom === 'string') {
      const t = Date.parse(body.visibleFrom)
      if (!Number.isFinite(t)) return NextResponse.json({ error: 'Invalid publish date' }, { status: 400 })
      data.visibleFrom = new Date(t)
    }
    await db.learningMaterial.update({ where: { id }, data })
    return NextResponse.json({ ok: true })
  } catch (e) {
    const notFound = e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025'
    if (notFound) return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    console.error('[PATCH /api/teacher/materials/:id] error:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Could not update the material' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const viewer = await getLmsViewer(req)
  if (!isTeacher(viewer) || !viewer.user) {
    return NextResponse.json({ error: 'Teacher access required', code: 'FORBIDDEN' }, { status: 403 })
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await ctx.params
  try {
    const material = await db.learningMaterial.findUnique({
      where: { id },
      select: { classId: true, files: true },
    })
    if (!material || !(await teacherClassGuard(viewer, material.classId))) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }
    await db.learningMaterial.delete({ where: { id } })
    await Promise.all(
      material.files.map((f) => deleteHomeworkFile(f.id, HOMEWORK_FILE_EXT_BY_MIME[f.mime] ?? '', f.url))
    )
    return NextResponse.json({ ok: true })
  } catch (e) {
    const notFound = e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025'
    if (notFound) return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    console.error('[DELETE /api/teacher/materials/:id] error:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Could not delete the material' }, { status: 500 })
  }
}
