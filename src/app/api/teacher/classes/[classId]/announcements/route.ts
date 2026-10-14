// ---------------------------------------------------------------------------
// 🎓 POST /api/teacher/classes/[classId]/announcements — اطلاعیهٔ کلاس
// body JSON: { title, body } — برای همهٔ ثبت‌نام‌شده‌های کلاس اعلان می‌رود.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getLmsViewer, isTeacher, teacherClassGuard } from '@/lib/lms'
import { isSameOrigin } from '@/lib/http-guard'
import { rateLimit, tooManyRequests } from '@/lib/rate-limit'
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
  const rl = await rateLimit('lms-announcement', req, 20, 600, 600)
  if (!rl.ok) return tooManyRequests(rl)
  try {
    const body = (await req.json()) as { title?: unknown; body?: unknown }
    const title = typeof body.title === 'string' ? body.title.trim().slice(0, 160) : ''
    const text = typeof body.body === 'string' ? body.body.trim().slice(0, 4000) : ''
    if (title.length < 2 || !text) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 })
    }
    const announcement = await db.classAnnouncement.create({
      data: { classId, authorId: viewer.user.id, title, body: text },
    })
    await notifyEnrolledStudents(classId, {
      kind: 'LMS_ANNOUNCEMENT',
      title: 'New announcement',
      body: `${title} — open your dashboard to read it.`,
    })
    return NextResponse.json({ ok: true, announcementId: announcement.id }, { status: 201 })
  } catch (e) {
    console.error('[POST /api/teacher/classes/:id/announcements] error:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Could not publish the announcement' }, { status: 500 })
  }
}
