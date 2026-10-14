// ---------------------------------------------------------------------------
// 🎓 DELETE /api/teacher/announcements/[id] — حذف اطلاعیهٔ کلاس
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getLmsViewer, isTeacher, teacherClassGuard } from '@/lib/lms'
import { isSameOrigin } from '@/lib/http-guard'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

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
    const announcement = await db.classAnnouncement.findUnique({
      where: { id },
      select: { classId: true },
    })
    if (!announcement || !(await teacherClassGuard(viewer, announcement.classId))) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }
    await db.classAnnouncement.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    const notFound = e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025'
    if (notFound) return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    console.error('[DELETE /api/teacher/announcements/:id] error:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Could not delete the announcement' }, { status: 500 })
  }
}
