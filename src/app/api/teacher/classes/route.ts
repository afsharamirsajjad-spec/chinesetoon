// ---------------------------------------------------------------------------
// 🎓 GET /api/teacher/classes — کلاس‌های استادِ واردشده (+ آمار هر کلاس)
// ادمین با x-admin-key همهٔ کلاس‌ها را می‌بیند؛ استاد فقط کلاس‌های assigned خودش.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getLmsViewer, isTeacher } from '@/lib/lms'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const viewer = await getLmsViewer(req)
  if (!isTeacher(viewer) || !viewer.user) {
    return NextResponse.json({ error: 'Teacher access required', code: 'FORBIDDEN' }, { status: 403 })
  }
  try {
    const rows = await db.courseClass.findMany({
      where: viewer.isAdmin ? {} : { teacherId: viewer.user.id },
      orderBy: { sortOrder: 'asc' },
      include: {
        teacher: { select: { firstName: true, lastName: true, email: true } },
        _count: { select: { enrollments: true, lmsMaterials: true, lmsAssignments: true, lmsSessions: true } },
      },
    })
    const classIds = rows.map((c) => c.id)
    // شمار پاسخ‌های «بررسی‌نشده» (SUBMITTED بدون release) برای همهٔ کلاس‌ها
    const pending = classIds.length
      ? await db.homeworkSubmission.groupBy({
          by: ['homeworkId'],
          where: {
            status: 'SUBMITTED',
            releasedAt: null,
            homework: { classId: { in: classIds }, archived: false },
          },
          _count: { _all: true },
        })
      : []
    const homeworkClassMap = classIds.length
      ? await db.homework.findMany({
          where: { classId: { in: classIds }, archived: false },
          select: { id: true, classId: true },
        })
      : []
    const homeworkToClass = new Map(homeworkClassMap.map((h) => [h.id, h.classId]))
    const pendingByClass = new Map<string, number>()
    for (const p of pending) {
      const cid = homeworkToClass.get(p.homeworkId)
      if (cid) pendingByClass.set(cid, (pendingByClass.get(cid) ?? 0) + p._count._all)
    }

    const classes = rows.map((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      level: c.level,
      classType: c.classType,
      image: c.image,
      status: c.status,
      teacherName: c.teacher
        ? [c.teacher.firstName, c.teacher.lastName].map((s) => s.trim()).filter(Boolean).join(' ') || c.teacher.email.split('@')[0]
        : null,
      studentCount: c._count.enrollments,
      materialCount: c._count.lmsMaterials,
      assignmentCount: c._count.lmsAssignments,
      sessionCount: c._count.lmsSessions,
      pendingReview: pendingByClass.get(c.id) ?? 0,
    }))
    return NextResponse.json({ classes })
  } catch (e) {
    console.error('[GET /api/teacher/classes] error:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
