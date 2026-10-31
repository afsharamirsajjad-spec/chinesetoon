// ---------------------------------------------------------------------------
// 📝 /api/hsk-exams/[slug]/attempt — start (or resume) an exam attempt
//
// POST → creates the immutable version snapshot + attempt row and returns the
// questions WITHOUT answer keys. A signed-in student with an unfinished,
// unexpired attempt for this exam resumes it instead (saved answers + the
// server deadline are returned). Guests can take free exams; attempts are
// then kept without a user link (analytics only, no personal records).
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, tooManyRequests } from '@/lib/rate-limit'
import { getUserFromRequest } from '@/lib/user-auth'
import { guardResponse } from '@/lib/http-guard'
import { db } from '@/lib/db'
import {
  createExamVersion,
  newAttemptSeed,
  publicAttemptView,
} from '@/lib/hsk-exam-server'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const guard = guardResponse(req)
  if (guard) return guard
  const rl = await rateLimit('hsk-exam-start', req, 20, 3600, 3600)
  if (!rl.ok) return tooManyRequests(rl)

  try {
    const { slug } = await params
    const exam = await db.hskExam.findUnique({ where: { slug } })
    if (!exam || !exam.published) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const user = await getUserFromRequest(req).catch(() => null)
    if (exam.access === 'restricted' && !user) {
      return NextResponse.json(
        { error: 'Sign in to take this exam.', code: 'SIGNIN_REQUIRED' },
        { status: 401 }
      )
    }

    // resume an unfinished attempt (signed-in students only)
    if (user) {
      const existing = await db.hskExamAttempt.findFirst({
        where: { examId: exam.id, userId: user.id, status: 'in_progress' },
        orderBy: { startedAt: 'desc' },
      })
      if (existing) {
        const expired = existing.expiresAt ? existing.expiresAt.getTime() <= Date.now() : false
        if (!expired) {
          const payload = JSON.parse((await db.hskExamVersion.findUnique({ where: { id: existing.versionId } }))?.payload ?? 'null')
          if (payload) {
            const seed = existing.id // same display order as when started
            const view = publicAttemptView(payload, JSON.parse(existing.questionOrder), exam.randomizeOptions, seed)
            return NextResponse.json({
              attemptId: existing.id,
              resumed: true,
              exam: { slug: exam.slug, title: exam.title, durationMin: exam.durationMin, passPercent: exam.passPercent, allowPause: exam.allowPause, audioReplayLimit: exam.audioReplayLimit },
              expiresAt: existing.expiresAt?.toISOString() ?? null,
              startedAt: existing.startedAt.toISOString(),
              savedAnswers: JSON.parse(existing.answers),
              ...view,
            })
          }
        }
        // expired unfinished attempt → mark it expired (the student starts fresh;
        // grading of what was saved happens below in the submit endpoint path)
        if (expired) {
          await db.hskExamAttempt.update({
            where: { id: existing.id },
            data: { status: 'expired' },
          })
        }
      }
    }

    const { versionId, payload, questionOrder } = await createExamVersion(exam.id)
    const seed = newAttemptSeed()
    const attemptSeed = seed
    const expiresAt = exam.durationMin > 0 ? new Date(Date.now() + exam.durationMin * 60_000) : null

    const attempt = await db.hskExamAttempt.create({
      data: {
        examId: exam.id,
        versionId,
        userId: user?.id ?? null,
        questionOrder: JSON.stringify(questionOrder),
        answers: JSON.stringify({}),
        status: 'in_progress',
        expiresAt,
      },
    })

    const view = publicAttemptView(payload, questionOrder, exam.randomizeOptions, attemptSeed)
    return NextResponse.json({
      attemptId: attempt.id,
      resumed: false,
      exam: { slug: exam.slug, title: exam.title, durationMin: exam.durationMin, passPercent: exam.passPercent, allowPause: exam.allowPause, audioReplayLimit: exam.audioReplayLimit },
      expiresAt: expiresAt?.toISOString() ?? null,
      startedAt: attempt.startedAt.toISOString(),
      savedAnswers: {},
      ...view,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not start the exam'
    if (message.includes('no questions') || message.includes('no published')) {
      return NextResponse.json({ error: 'This exam has no questions yet.' }, { status: 409 })
    }
    console.error('[POST /api/hsk-exams/[slug]/attempt] error:', err)
    return NextResponse.json({ error: 'Could not start the exam' }, { status: 500 })
  }
}
