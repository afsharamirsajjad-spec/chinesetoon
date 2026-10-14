// ---------------------------------------------------------------------------
// 🎓 POST /api/teacher/classes/[classId]/sessions — جلسهٔ آنلاین جدید
// body JSON: { title, description, startsAt, durationMin, provider, meetingUrl }
// provider فعلاً 'external' است (لینک Zoom/Meet/Jitsi) — ادغام API واقعی
// بعداً اضافه می‌شود و هیچ جلسهٔ جعلی‌ای ساخته نمی‌شود.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getLmsViewer, isTeacher, teacherClassGuard } from '@/lib/lms'
import { isSameOrigin } from '@/lib/http-guard'
import { notifyEnrolledStudents } from '@/lib/lms-notify'

export const dynamic = 'force-dynamic'

const MEETING_URL_RE = /^https:\/\/[^\s"'<>]{8,600}$/i

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
  try {
    const body = (await req.json()) as {
      title?: unknown
      description?: unknown
      startsAt?: unknown
      durationMin?: unknown
      meetingUrl?: unknown
    }
    const title = typeof body.title === 'string' ? body.title.trim().slice(0, 160) : ''
    const description = typeof body.description === 'string' ? body.description.trim().slice(0, 2000) : ''
    const meetingUrl = typeof body.meetingUrl === 'string' ? body.meetingUrl.trim().slice(0, 600) : ''
    if (title.length < 2) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    if (!body.startsAt || typeof body.startsAt !== 'string' || !Number.isFinite(Date.parse(body.startsAt))) {
      return NextResponse.json({ error: 'A valid start time is required' }, { status: 400 })
    }
    if (meetingUrl && !MEETING_URL_RE.test(meetingUrl)) {
      return NextResponse.json({ error: 'Meeting link must be a valid https:// URL' }, { status: 400 })
    }
    const durationRaw = Number(body.durationMin ?? 60)
    const durationMin = Number.isFinite(durationRaw) && durationRaw >= 10 && durationRaw <= 480 ? Math.round(durationRaw) : 60

    const session = await db.onlineSession.create({
      data: {
        classId,
        title,
        description,
        startsAt: new Date(Date.parse(body.startsAt)),
        durationMin,
        provider: 'external',
        meetingUrl,
        createdById: viewer.user.id,
      },
    })
    await notifyEnrolledStudents(classId, {
      kind: 'LMS_SESSION',
      title: 'Online session scheduled',
      body: `"${title}" on ${session.startsAt.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })} — the Join button is in your dashboard.`,
    })
    return NextResponse.json({ ok: true, sessionId: session.id }, { status: 201 })
  } catch (e) {
    console.error('[POST /api/teacher/classes/:id/sessions] error:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Could not schedule the session' }, { status: 500 })
  }
}
