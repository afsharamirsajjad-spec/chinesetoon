// ---------------------------------------------------------------------------
// 🎓 /api/teacher/classes/[classId] — فضای کار کامل کلاس از دید استاد
//
//   GET  — دانش‌پذیران + مواد + تکالیف (+ پاسخ‌ها) + جلسات + اطلاعیه‌ها
//   POST — مدیریت ثبت‌نام: { action: 'enroll' | 'unenroll', userId, userEmail }
//          (جست‌وجو با ایمیل — دانش‌پذیر باید حساب داشته باشد)
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getLmsViewer, isTeacher, teacherClassGuard } from '@/lib/lms'
import { notifyUser } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, ctx: { params: Promise<{ classId: string }> }) {
  const viewer = await getLmsViewer(req)
  if (!isTeacher(viewer) || !viewer.user) {
    return NextResponse.json({ error: 'Teacher access required', code: 'FORBIDDEN' }, { status: 403 })
  }
  const { classId } = await ctx.params
  const guarded = await teacherClassGuard(viewer, classId)
  if (!guarded) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 })
  }
  try {
    const klass = await db.courseClass.findUnique({
      where: { id: classId },
      select: {
        id: true, slug: true, title: true, level: true, classType: true,
        fullDescription: true, image: true, maxStudents: true,
        teacher: { select: { firstName: true, lastName: true } },
      },
    })
    if (!klass) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    const [students, materials, assignments, sessions, announcements] = await Promise.all([
      db.classEnrollment.findMany({
        where: { classId },
        orderBy: { createdAt: 'asc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, uniqueCode: true } },
        },
      }),
      db.learningMaterial.findMany({
        where: { classId },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        include: { files: { orderBy: { createdAt: 'asc' } } },
      }),
      db.homework.findMany({
        where: { classId },
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { submissions: true } },
          submissions: { where: { releasedAt: null, status: 'SUBMITTED' }, select: { id: true } },
        },
      }),
      db.onlineSession.findMany({
        where: { classId },
        orderBy: { startsAt: 'asc' },
      }),
      db.classAnnouncement.findMany({
        where: { classId },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: { author: { select: { firstName: true, lastName: true } } },
      }),
    ])

    return NextResponse.json({
      class: klass,
      students: students.map((e) => ({
        enrollmentId: e.id,
        userId: e.user.id,
        name: [e.user.firstName, e.user.lastName].map((s) => s.trim()).filter(Boolean).join(' '),
        email: e.user.email,
        uniqueCode: e.user.uniqueCode,
        enrolledAt: e.createdAt.toISOString(),
      })),
      materials: materials.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        moduleLabel: m.moduleLabel,
        sortOrder: m.sortOrder,
        published: m.published,
        visibleFrom: m.visibleFrom?.toISOString() ?? null,
        createdAt: m.createdAt.toISOString(),
        files: m.files.map((f) => ({ id: f.id, name: f.name, mime: f.mime, size: f.size })),
      })),
      assignments: assignments.map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        dueAt: a.dueAt?.toISOString() ?? null,
        maxScore: a.maxScore,
        archived: a.archived,
        createdAt: a.createdAt.toISOString(),
        submissionCount: a._count.submissions,
        pendingReview: a.submissions.length,
      })),
      sessions: sessions.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        startsAt: s.startsAt.toISOString(),
        durationMin: s.durationMin,
        provider: s.provider,
        meetingUrl: s.meetingUrl,
        status: s.status,
      })),
      announcements: announcements.map((a) => ({
        id: a.id,
        title: a.title,
        body: a.body,
        createdAt: a.createdAt.toISOString(),
        authorName: a.author
          ? [a.author.firstName, a.author.lastName].map((s) => s.trim()).filter(Boolean).join(' ')
          : null,
      })),
    })
  } catch (e) {
    console.error('[GET /api/teacher/classes/:id] error:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
  try {
    const body = (await req.json()) as { action?: unknown; userId?: unknown; userEmail?: unknown }
    const action = body.action === 'unenroll' ? 'unenroll' : 'enroll'

    if (action === 'enroll') {
      // مقصد: کاربر واقعی DB — با ایمیل یا id، هرگز از ادعای کلاینت بدون بررسی
      let target = null as { id: string; firstName: string; role: string } | null
      if (typeof body.userEmail === 'string' && body.userEmail.trim()) {
        target = await db.user.findUnique({
          where: { email: body.userEmail.trim().toLowerCase().slice(0, 200) },
          select: { id: true, firstName: true, role: true },
        })
      } else if (typeof body.userId === 'string' && body.userId.trim()) {
        target = await db.user.findUnique({
          where: { id: body.userId.trim().slice(0, 64) },
          select: { id: true, firstName: true, role: true },
        })
      }
      if (!target) {
        return NextResponse.json({ error: 'No account found with this email — the student must register first.' }, { status: 404 })
      }
      // ظرفیت کلاس
      const klass = await db.courseClass.findUnique({
        where: { id: classId },
        select: { title: true, maxStudents: true, _count: { select: { enrollments: true } } },
      })
      if (!klass) return NextResponse.json({ error: 'Class not found' }, { status: 404 })
      if (klass.maxStudents && klass._count.enrollments >= klass.maxStudents) {
        return NextResponse.json({ error: 'The class is full.' }, { status: 409 })
      }
      const enrollment = await db.classEnrollment.upsert({
        where: { classId_userId: { classId, userId: target.id } },
        create: { classId, userId: target.id, enrolledById: viewer.user.id },
        update: {},
      })
      notifyUser({
        userId: target.id,
        category: 'lms',
        kind: 'LMS_ENROLLED',
        title: 'You are enrolled in a class',
        body: `You now have access to "${klass.title}" — check your student dashboard for materials and assignments.`,
      })
      return NextResponse.json({ ok: true, enrollmentId: enrollment.id, already: false }, { status: 201 })
    }

    // unenroll
    const uid = typeof body.userId === 'string' ? body.userId.trim().slice(0, 64) : ''
    if (!uid) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }
    await db.classEnrollment.deleteMany({ where: { classId, userId: uid } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[POST /api/teacher/classes/:id] error:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Could not update enrollment' }, { status: 500 })
  }
}
