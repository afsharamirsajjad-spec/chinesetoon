// ---------------------------------------------------------------------------
// 🎓 GET /api/lms/student/classes — کلاس‌های ثبت‌نام‌شدهٔ دانش‌پذیرِ واردشده
// خروجی هر کلاس: نام/استاد/سطح + شمار مواد، تکالیف باز، جلسهٔ بعدی، اطلاعیهٔ
// جدید. دسترسی: فقط رکوردهای ClassEnrollment خود کاربر (ضد IDOR).
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/user-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req).catch(() => null)
  if (!user) {
    return NextResponse.json({ error: 'Please sign in', code: 'AUTH_REQUIRED' }, { status: 401 })
  }
  try {
    const enrollments = await db.classEnrollment.findMany({
      where: { userId: user.id },
      include: {
        class: {
          include: {
            teacher: { select: { firstName: true, lastName: true, email: true } },
            _count: { select: { lmsMaterials: true, lmsAssignments: true } },
            lmsSessions: {
              where: { status: { in: ['scheduled', 'live'] }, startsAt: { gte: new Date(Date.now() - 3600_000) } },
              orderBy: { startsAt: 'asc' },
              take: 1,
            },
            lmsAssignments: {
              where: { archived: false },
              select: { id: true, dueAt: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    const classIds = enrollments.map((e) => e.classId)
    const mySubs = await db.homeworkSubmission.findMany({
      where: { userId: user.id, homework: { classId: { in: classIds } } },
      select: { homeworkId: true },
    })
    const submittedSet = new Set(mySubs.map((s) => s.homeworkId))

    const classes = enrollments.map((e) => {
      const c = e.class
      const openAssignments = c.lmsAssignments.filter((a) => !submittedSet.has(a.id)).length
      return {
        id: c.id,
        slug: c.slug,
        title: c.title,
        level: c.level,
        classType: c.classType,
        image: c.image,
        sessionDurationMin: c.sessionDurationMin,
        teacherName: c.teacher
          ? [c.teacher.firstName, c.teacher.lastName].map((s) => s.trim()).filter(Boolean).join(' ') || c.teacher.email.split('@')[0]
          : null,
        materialCount: c._count.lmsMaterials,
        assignmentCount: c._count.lmsAssignments,
        openAssignments,
        nextSessionAt: c.lmsSessions[0]?.startsAt.toISOString() ?? null,
        nextSessionTitle: c.lmsSessions[0]?.title ?? null,
        unreadAnnouncements: null as number | null, // در ادامه محاسبهٔ دقیق هر کلاس
        enrolledAt: e.createdAt.toISOString(),
      }
    })

    // اطلاعیه‌های نخواندهٔ هر کلاس — دقیق
    const perClassAnnouncements = await db.classAnnouncement.findMany({
      where: { classId: { in: classIds } },
      select: { id: true, classId: true, reads: { where: { userId: user.id }, select: { id: true } } },
    })
    const readSet = new Set(
      perClassAnnouncements.filter((a) => a.reads.length > 0).map((a) => a.id)
    )
    const unreadByClass = new Map<string, number>()
    for (const a of perClassAnnouncements) {
      if (!readSet.has(a.id)) unreadByClass.set(a.classId, (unreadByClass.get(a.classId) ?? 0) + 1)
    }
    for (const cls of classes) {
      cls.unreadAnnouncements = unreadByClass.get(cls.id) ?? 0
    }

    return NextResponse.json({
      classes,
      totalUnreadAnnouncements: perClassAnnouncements.filter((a) => !readSet.has(a.id)).length,
    })
  } catch (e) {
    console.error('[GET /api/lms/student/classes] error:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
