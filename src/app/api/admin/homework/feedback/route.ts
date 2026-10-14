// ---------------------------------------------------------------------------
// 📚 POST /api/admin/homework/feedback — ثبت بازخورد متنی استاد روی پاسخ دانش‌پذیر
// body: { submissionId: string, feedback: string } — بازخورد خالی = «بررسی‌نشده»
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
    const body = (await req.json()) as { submissionId?: unknown; feedback?: unknown }
    const submissionId = typeof body.submissionId === 'string' ? body.submissionId.trim().slice(0, 64) : ''
    const feedback = typeof body.feedback === 'string' ? body.feedback.trim().slice(0, 4000) : ''
    if (!submissionId) {
      return NextResponse.json({ error: 'submissionId is required' }, { status: 400 })
    }
    // بازخورد خالی مجاز است (پاک‌کردن بازخورد → دوباره «بررسی‌نشده»)
    const submission = await db.homeworkSubmission.update({
      where: { id: submissionId },
      data: { feedback: feedback || null, feedbackAt: feedback ? new Date() : null },
    })
    logAdminAction({
      actor: getAdminActor(req),
      action: feedback ? 'homework.feedback' : 'homework.feedback.clear',
      targetType: 'HOMEWORK_SUBMISSION',
      targetId: submissionId,
      meta: { homeworkId: submission.homeworkId },
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    const notFound = e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025'
    if (notFound) return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    console.error('[POST /api/admin/homework/feedback] error:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Could not save the feedback' }, { status: 500 })
  }
}
