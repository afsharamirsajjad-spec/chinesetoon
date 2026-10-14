// ---------------------------------------------------------------------------
// 🎓 PATCH/DELETE /api/teacher/sessions/[id] — ویرایش/لغو/حذف جلسهٔ آنلاین
// PATCH body: { title?, description?, startsAt?, durationMin?, meetingUrl?, status? }
// status: scheduled | live | completed | cancelled (لغو = status cancelled)
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getLmsViewer, isTeacher, teacherClassGuard } from '@/lib/lms'
import { isSameOrigin } from '@/lib/http-guard'
import { notifyEnrolledStudents } from '@/lib/lms-notify'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

const MEETING_URL_RE = /^https:\/\/[^\s"'<>]{8,600}$/i
const SESSION_STATUSES = ['scheduled', 'live', 'completed', 'cancelled']

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
    const session = await db.onlineSession.findUnique({
      where: { id },
      select: { classId: true, status: true, startsAt: true, title: true },
    })
    if (!session || !(await teacherClassGuard(viewer, session.classId))) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    const body = (await req.json()) as {
      title?: unknown
      description?: unknown
      startsAt?: unknown
      durationMin?: unknown
      meetingUrl?: unknown
      status?: unknown
    }
    const data: Prisma.OnlineSessionUpdateInput = {}
    if (typeof body.title === 'string') {
      const t = body.title.trim().slice(0, 160)
      if (t.length < 2) return NextResponse.json({ error: 'Title is too short' }, { status: 400 })
      data.title = t
    }
    if (typeof body.description === 'string') data.description = body.description.trim().slice(0, 2000)
    if (typeof body.startsAt === 'string') {
      const t = Date.parse(body.startsAt)
      if (!Number.isFinite(t)) return NextResponse.json({ error: 'Invalid start time' }, { status: 400 })
      data.startsAt = new Date(t)
    }
    if (body.durationMin !== undefined) {
      const n = Number(body.durationMin)
      if (!Number.isFinite(n) || n < 10 || n > 480) {
        return NextResponse.json({ error: 'Duration must be 10–480 minutes' }, { status: 400 })
      }
      data.durationMin = Math.round(n)
    }
    if (body.meetingUrl !== undefined) {
      const u = typeof body.meetingUrl === 'string' ? body.meetingUrl.trim().slice(0, 600) : ''
      if (u && !MEETING_URL_RE.test(u)) {
        return NextResponse.json({ error: 'Meeting link must be a valid https:// URL' }, { status: 400 })
      }
      data.meetingUrl = u
    }
    if (typeof body.status === 'string' && SESSION_STATUSES.includes(body.status)) {
      data.status = body.status
    }

    const wasCancelled = session.status === 'cancelled'
    await db.onlineSession.update({ where: { id }, data })
    // لغوی که همین الان رخ داد → اعلان لغو
    if (data.status === 'cancelled' && !wasCancelled) {
      await notifyEnrolledStudents(session.classId, {
        kind: 'LMS_SESSION_CANCELLED',
        title: 'Session cancelled',
        body: `"${session.title}" scheduled for ${session.startsAt.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })} was cancelled.`,
      })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    const notFound = e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025'
    if (notFound) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    console.error('[PATCH /api/teacher/sessions/:id] error:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Could not update the session' }, { status: 500 })
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
    const session = await db.onlineSession.findUnique({
      where: { id },
      select: { classId: true },
    })
    if (!session || !(await teacherClassGuard(viewer, session.classId))) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    await db.onlineSession.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    const notFound = e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025'
    if (notFound) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    console.error('[DELETE /api/teacher/sessions/:id] error:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Could not delete the session' }, { status: 500 })
  }
}
