// ---------------------------------------------------------------------------
// 🎓 GET /api/lms/student/classes/[classId] — فضای کار کلاس از دید دانش‌پذیر
//
// فقط برای ثبت‌نام‌شدهٔ همان کلاس (ClassEnrollment) — دیگران 404 می‌گیرند.
// شامل: مشخصات کلاس/استاد، مواد منتشرشده، تکالیف فعال + پاسخ خودم (نمره/بازخورد
// فقط بعد از release)، جلسات، اطلاعیه‌ها + وضعیت خوانده‌شده.
// POST = علامت‌گذاری همهٔ اطلاعیه‌ها به‌عنوان خوانده‌شده.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/user-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, ctx: { params: Promise<{ classId: string }> }) {
  const user = await getUserFromRequest(req).catch(() => null)
  if (!user) {
    return NextResponse.json({ error: 'Please sign in', code: 'AUTH_REQUIRED' }, { status: 401 })
  }
  const { classId } = await ctx.params
  try {
    const enrollment = await db.classEnrollment.findUnique({
      where: { classId_userId: { classId, userId: user.id } },
      select: { id: true },
    })
    if (!enrollment) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    const klass = await db.courseClass.findUnique({
      where: { id: classId },
      select: {
        id: true, slug: true, title: true, level: true, classType: true,
        fullDescription: true, image: true, sessionDurationMin: true, startDate: true,
        teacher: { select: { firstName: true, lastName: true, email: true } },
      },
    })
    if (!klass) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    const now = new Date()
    const [materials, assignments, sessions, announcements] = await Promise.all([
      db.learningMaterial.findMany({
        where: {
          classId,
          published: true,
          OR: [{ visibleFrom: null }, { visibleFrom: { lte: now } }],
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        include: { files: { orderBy: { createdAt: 'asc' } } },
      }),
      db.homework.findMany({
        where: { classId, archived: false },
        orderBy: { createdAt: 'desc' },
        include: {
          files: { orderBy: { createdAt: 'asc' } },
          submissions: {
            where: { userId: user.id },
            take: 1,
            include: { files: { orderBy: { createdAt: 'asc' } } },
          },
        },
      }),
      db.onlineSession.findMany({
        where: { classId, status: { in: ['scheduled', 'live'] } },
        orderBy: { startsAt: 'asc' },
      }),
      db.classAnnouncement.findMany({
        where: { classId },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          author: { select: { firstName: true, lastName: true } },
          reads: { where: { userId: user.id }, select: { id: true } },
        },
      }),
    ])

    return NextResponse.json({
      class: {
        ...klass,
        startDate: klass.startDate?.toISOString() ?? null,
        teacherName: klass.teacher
          ? [klass.teacher.firstName, klass.teacher.lastName].map((s) => s.trim()).filter(Boolean).join(' ') || klass.teacher.email.split('@')[0]
          : null,
      },
      materials: materials.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        moduleLabel: m.moduleLabel,
        createdAt: m.createdAt.toISOString(),
        files: m.files.map((f) => ({ id: f.id, name: f.name, mime: f.mime, size: f.size })),
      })),
      assignments: assignments.map((a) => {
        const sub = a.submissions[0] ?? null
        return {
          id: a.id,
          title: a.title,
          description: a.description,
          dueAt: a.dueAt?.toISOString() ?? null,
          maxScore: a.maxScore,
          createdAt: a.createdAt.toISOString(),
          files: a.files.map((f) => ({ id: f.id, name: f.name, mime: f.mime, size: f.size })),
          mySubmission: sub
            ? {
                id: sub.id,
                note: sub.note,
                submittedAt: sub.updatedAt.toISOString(),
                // 🎓 نمره/بازخورد فقط بعد از release استاد پیدا است
                released: sub.releasedAt != null,
                score: sub.releasedAt ? sub.score : null,
                status: sub.status,
                feedback: sub.releasedAt ? sub.feedback : null,
                files: sub.files.map((f) => ({ id: f.id, name: f.name, mime: f.mime, size: f.size })),
              }
            : null,
        }
      }),
      sessions: sessions.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        startsAt: s.startsAt.toISOString(),
        durationMin: s.durationMin,
        provider: s.provider,
        status: s.status,
        // 🔗 لینک جلسه فقط برای ثبت‌نام‌شدهٔ همان کلاس برمی‌گردد
        meetingUrl: s.meetingUrl,
      })),
      announcements: announcements.map((a) => ({
        id: a.id,
        title: a.title,
        body: a.body,
        createdAt: a.createdAt.toISOString(),
        authorName: a.author
          ? [a.author.firstName, a.author.lastName].map((s) => s.trim()).filter(Boolean).join(' ')
          : null,
        read: a.reads.length > 0,
      })),
    })
  } catch (e) {
    console.error('[GET /api/lms/student/classes/:id] error:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** علامت‌گذاری همهٔ اطلاعیه‌های این کلاس به‌عنوان خوانده‌شده */
export async function POST(req: NextRequest, ctx: { params: Promise<{ classId: string }> }) {
  const user = await getUserFromRequest(req).catch(() => null)
  if (!user) {
    return NextResponse.json({ error: 'Please sign in', code: 'AUTH_REQUIRED' }, { status: 401 })
  }
  const { classId } = await ctx.params
  try {
    const enrollment = await db.classEnrollment.findUnique({
      where: { classId_userId: { classId, userId: user.id } },
      select: { id: true },
    })
    if (!enrollment) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }
    const unread = await db.classAnnouncement.findMany({
      where: { classId, reads: { none: { userId: user.id } } },
      select: { id: true },
    })
    if (unread.length > 0) {
      await db.announcementRead.createMany({
        data: unread.map((a) => ({ announcementId: a.id, userId: user.id })),
        skipDuplicates: true,
      })
    }
    return NextResponse.json({ ok: true, marked: unread.length })
  } catch (e) {
    console.error('[POST /api/lms/student/classes/:id] error:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
