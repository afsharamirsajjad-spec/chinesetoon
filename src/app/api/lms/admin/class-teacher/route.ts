// ---------------------------------------------------------------------------
// 🎓 POST /api/lms/admin/class-teacher — تعیین/برداشتن استادِ یک کلاس (فقط ادمین)
// body: { classId, teacherId | null } — teacherId باید کاربرِ role=teacher باشد.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAuthorized, getAdminActor } from '@/lib/admin-auth'
import { isSameOrigin } from '@/lib/http-guard'
import { logAdminAction } from '@/lib/audit'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const body = (await req.json()) as { classId?: unknown; teacherId?: unknown }
    const classId = typeof body.classId === 'string' ? body.classId.trim().slice(0, 64) : ''
    if (!classId) {
      return NextResponse.json({ error: 'classId is required' }, { status: 400 })
    }
    // null = برداشتن استاد
    if (body.teacherId === null) {
      await db.courseClass.update({ where: { id: classId }, data: { teacherId: null } })
      logAdminAction({ actor: getAdminActor(req), action: 'lms.teacher.unassign', targetType: 'COURSE_CLASS', targetId: classId })
      return NextResponse.json({ ok: true, teacherId: null })
    }
    const teacherId = typeof body.teacherId === 'string' ? body.teacherId.trim().slice(0, 64) : ''
    if (!teacherId) {
      return NextResponse.json({ error: 'teacherId is required (or null)' }, { status: 400 })
    }
    const teacher = await db.user.findUnique({
      where: { id: teacherId },
      select: { id: true, role: true },
    })
    if (!teacher || teacher.role !== 'teacher') {
      return NextResponse.json({ error: 'This user does not have the teacher role' }, { status: 400 })
    }
    await db.courseClass.update({ where: { id: classId }, data: { teacherId } })
    logAdminAction({
      actor: getAdminActor(req),
      action: 'lms.teacher.assign',
      targetType: 'COURSE_CLASS',
      targetId: classId,
      meta: { teacherId },
    })
    return NextResponse.json({ ok: true, teacherId })
  } catch (e) {
    const notFound = e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025'
    if (notFound) return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    console.error('[POST /api/lms/admin/class-teacher] error:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Could not update the class teacher' }, { status: 500 })
  }
}
