// ---------------------------------------------------------------------------
// 🎓 GET /api/teacher/assignments/[id]/submissions — میزکار نمره‌دهی
// همهٔ پاسخ‌های ثبت‌شده برای تکلیف (نام/ایمیل دانش‌پذیر + فایل‌ها + یادداشت +
// نمره/بازخورد فعلی). فقط استادِ کلاسِ آن تکلیف یا ادمین.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getLmsViewer, isTeacher, teacherClassGuard } from '@/lib/lms'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const viewer = await getLmsViewer(req)
  if (!isTeacher(viewer) || !viewer.user) {
    return NextResponse.json({ error: 'Teacher access required', code: 'FORBIDDEN' }, { status: 403 })
  }
  const { id } = await ctx.params
  try {
    const homework = await db.homework.findUnique({
      where: { id },
      select: {
        id: true, title: true, description: true, dueAt: true, maxScore: true, archived: true,
        classId: true, createdAt: true,
        files: { orderBy: { createdAt: 'asc' }, select: { id: true, name: true, mime: true, size: true } },
      },
    })
    if (!homework || !(await teacherClassGuard(viewer, homework.classId ?? ''))) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // 🔒 تسک «تکالیفِ بدون کلاس» فقط ادمین می‌بیند (استادِ کلاس‌محور فقط کلاسِ خودش)
    const submissions = await db.homeworkSubmission.findMany({
      where: { homeworkId: id },
      orderBy: { updatedAt: 'desc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, uniqueCode: true } },
        files: { orderBy: { createdAt: 'asc' } },
      },
    })

    return NextResponse.json({
      assignment: {
        id: homework.id,
        title: homework.title,
        description: homework.description,
        dueAt: homework.dueAt?.toISOString() ?? null,
        maxScore: homework.maxScore,
        archived: homework.archived,
        createdAt: homework.createdAt.toISOString(),
        files: homework.files,
      },
      submissions: submissions.map((s) => ({
        id: s.id,
        note: s.note,
        status: s.status,
        score: s.score,
        feedback: s.feedback,
        releasedAt: s.releasedAt?.toISOString() ?? null,
        submittedAt: s.updatedAt.toISOString(),
        student: {
          userId: s.user.id,
          name: [s.user.firstName, s.user.lastName].map((x) => x.trim()).filter(Boolean).join(' '),
          email: s.user.email,
          uniqueCode: s.user.uniqueCode,
        },
        files: s.files.map((f) => ({ id: f.id, name: f.name, mime: f.mime, size: f.size })),
      })),
    })
  } catch (e) {
    console.error('[GET /api/teacher/assignments/:id/submissions] error:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
