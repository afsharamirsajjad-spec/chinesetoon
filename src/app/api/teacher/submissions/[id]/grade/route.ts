// ---------------------------------------------------------------------------
// 🎓 POST /api/teacher/submissions/[id]/grade — نمره‌دهی/برگشت برای اصلاح
//
// body: { score, feedback, action: 'grade' | 'return' | 'release' }
//   • grade   → ثبت نمره/بازخورد + release همزمان (status=GRADED، releasedAt=اکنون)
//   • return  → برگشت برای اصلاح (status=RETURNED، بدون release)
//   • release → آزادسازی نمره/بازخوردِ ذخیره‌شده برای دانش‌پذیر
// نمره از سقف maxScore تکلیف عبور نمی‌کند؛ همه‌چیز سمت سرور اعتبارسنجی می‌شود.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getLmsViewer, isTeacher, teacherClassGuard } from '@/lib/lms'
import { isSameOrigin } from '@/lib/http-guard'
import { notifyUser } from '@/lib/notifications'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const viewer = await getLmsViewer(req)
  if (!isTeacher(viewer) || !viewer.user) {
    return NextResponse.json({ error: 'Teacher access required', code: 'FORBIDDEN' }, { status: 403 })
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await ctx.params
  try {
    const submission = await db.homeworkSubmission.findUnique({
      where: { id },
      select: {
        id: true, userId: true, status: true, feedback: true, score: true,
        homework: { select: { id: true, title: true, maxScore: true, classId: true } },
      },
    })
    if (!submission || !(await teacherClassGuard(viewer, submission.homework.classId ?? ''))) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    const body = (await req.json()) as { score?: unknown; feedback?: unknown; action?: unknown }
    const action = body.action === 'return' ? 'return' : body.action === 'release' ? 'release' : 'grade'
    const feedback = typeof body.feedback === 'string' ? body.feedback.trim().slice(0, 4000) : ''

    if (action === 'grade' || action === 'return') {
      let score: number | null = null
      if (body.score !== null && body.score !== undefined && body.score !== '') {
        const n = Number(body.score)
        if (!Number.isFinite(n) || n < 0 || n > submission.homework.maxScore) {
          return NextResponse.json(
            { error: `Score must be between 0 and ${submission.homework.maxScore}` },
            { status: 400 }
          )
        }
        score = Math.round(n)
      }
      if (action === 'return' && !feedback) {
        return NextResponse.json({ error: 'Please write feedback when returning work for revision.' }, { status: 400 })
      }
      const updated = await db.homeworkSubmission.update({
        where: { id },
        data: {
          ...(score !== null ? { score } : {}),
          ...(feedback ? { feedback, feedbackAt: new Date() } : {}),
          status: action === 'return' ? 'RETURNED' : 'GRADED',
          // 🔓 grade = ثبت و آزادسازی همزمان؛ return = بدون release
          ...(action === 'grade' ? { releasedAt: new Date() } : {}),
        },
      })
      notifyUser({
        userId: submission.userId,
        category: 'lms',
        kind: action === 'return' ? 'LMS_RETURNED' : 'LMS_GRADED',
        title: action === 'return' ? 'Assignment returned for revision' : 'Assignment graded',
        body:
          action === 'return'
            ? `Your submission for "${submission.homework.title}" was returned — read the teacher's note and resubmit.`
            : score !== null
              ? `Your work on "${submission.homework.title}" received ${updated.score ?? 0}/${submission.homework.maxScore}.`
              : `Your teacher reviewed "${submission.homework.title}" — feedback is ready.`,
      })
      return NextResponse.json({ ok: true, status: updated.status, score: updated.score })
    }

    // release — آزادسازی آنچه قبلاً ثبت شده (بدون تغییر نمره/متن)
    if (submission.feedback == null && submission.score == null) {
      return NextResponse.json({ error: 'Nothing to release yet — grade the submission first.' }, { status: 409 })
    }
    await db.homeworkSubmission.update({
      where: { id },
      data: { releasedAt: new Date(), status: submission.status === 'RETURNED' ? 'GRADED' : submission.status },
    })
    notifyUser({
      userId: submission.userId,
      category: 'lms',
      kind: 'LMS_GRADED',
      title: 'Feedback released',
      body: `Your teacher released the grade/feedback for "${submission.homework.title}" — open your dashboard.`,
    })
    return NextResponse.json({ ok: true, status: 'GRADED' })
  } catch (e) {
    const notFound = e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025'
    if (notFound) return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    console.error('[POST /api/teacher/submissions/:id/grade] error:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Could not save the grade' }, { status: 500 })
  }
}
