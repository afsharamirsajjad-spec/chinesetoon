// ---------------------------------------------------------------------------
// 📝 /api/hsk-exams/attempts/[id] — autosave (PATCH) + submit (POST)
//
// PATCH { answers }  → save progress during the exam (recover after refresh).
//   Only while in_progress and before the server deadline.
// POST { answers? }  → grade against the SNAPSHOT and persist the result.
//   • after the deadline (+30s grace) the saved answers are graded as an
//     auto-submission — the timer is enforced by the server, not the browser
//   • the result payload (score/sections/review) respects the exam's
//     allowReview / showCorrectAnswers / showExplanations settings
//   • idempotent: submitting an already-submitted attempt returns its result
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimit, tooManyRequests } from '@/lib/rate-limit'
import { guardResponse } from '@/lib/http-guard'
import { db } from '@/lib/db'
import {
  gradeAttempt,
  attemptReview,
  type VersionPayload,
  type ExamAnswer,
} from '@/lib/hsk-exam-server'

export const dynamic = 'force-dynamic'

const GRACE_MS = 30_000

const saveSchema = z.object({
  answers: z.record(z.string().max(40), z.union([z.string().max(2000), z.array(z.string().max(2000)).max(12), z.null()])),
})

const answerSchema = z.union([z.string().max(2000), z.array(z.string().max(2000)).max(12), z.null()])
const submitSchema = z.object({
  answers: z.record(z.string().max(40), answerSchema).optional(),
})

function parseScore(scoreJson: string | null) {
  if (!scoreJson) return null
  try {
    return JSON.parse(scoreJson)
  } catch {
    return null
  }
}

function resultResponse(
  payload: VersionPayload,
  attempt: { id: string; status: string; scoreJson: string | null; startedAt: Date; submittedAt: Date | null; questionOrder: string; answers: string; autoSubmitted: boolean },
  examConfig: { allowReview: boolean; showCorrectAnswers: boolean; showExplanations: boolean }
) {
  const score = parseScore(attempt.scoreJson)
  const answers = JSON.parse(attempt.answers || '{}') as Record<string, ExamAnswer>
  const order = JSON.parse(attempt.questionOrder || '[]') as string[]
  const review =
    attempt.status !== 'in_progress' && examConfig.allowReview
      ? attemptReview(payload, order, answers).map((r) => ({
          ...r,
          // hide the correct answer / explanation when the admin said so
          answer: examConfig.showCorrectAnswers ? r.answer : '',
          explanation: examConfig.showExplanations ? r.explanation : '',
          options: examConfig.showCorrectAnswers ? r.options : [],
        }))
      : []
  return {
    ok: true,
    attemptId: attempt.id,
    status: attempt.status,
    autoSubmitted: attempt.autoSubmitted,
    score,
    review,
  }
}

async function loadAttemptContext(attemptId: string) {
  const attempt = await db.hskExamAttempt.findUnique({
    where: { id: attemptId },
    include: { version: true, exam: true },
  })
  if (!attempt) return null
  let payload: VersionPayload | null = null
  try {
    payload = JSON.parse(attempt.version.payload) as VersionPayload
  } catch {
    payload = null
  }
  if (!payload) return null
  return { attempt, payload, exam: attempt.exam }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = guardResponse(req)
  if (guard) return guard
  try {
    const { id } = await params
    const ctx = await loadAttemptContext(id)
    if (!ctx) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (ctx.attempt.status !== 'in_progress') {
      return NextResponse.json({ ok: true, status: ctx.attempt.status })
    }
    if (ctx.attempt.expiresAt && ctx.attempt.expiresAt.getTime() + GRACE_MS < Date.now()) {
      return NextResponse.json({ ok: false, expired: true, error: 'Time is up — submit the exam.' }, { status: 409 })
    }
    const body = await req.json().catch(() => null)
    const parsed = saveSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid answers payload' }, { status: 400 })
    }
    await db.hskExamAttempt.update({
      where: { id },
      data: { answers: JSON.stringify(parsed.data.answers), updatedAt: new Date() },
    })
    return NextResponse.json({ ok: true, savedAt: new Date().toISOString() })
  } catch (err) {
    console.error('[PATCH /api/hsk-exams/attempts/[id]] error:', err)
    return NextResponse.json({ error: 'Could not save progress' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = guardResponse(req)
  if (guard) return guard
  const rl = await rateLimit('hsk-exam-submit', req, 30, 3600, 3600)
  if (!rl.ok) return tooManyRequests(rl)
  try {
    const { id } = await params
    const ctx = await loadAttemptContext(id)
    if (!ctx) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const { attempt, payload, exam } = ctx

    if (attempt.status !== 'in_progress') {
      // idempotent — return the stored result
      return NextResponse.json(
        resultResponse(payload, { ...attempt, autoSubmitted: attempt.status === 'expired' }, exam)
      )
    }

    const body = await req.json().catch(() => ({}))
    const parsed = submitSchema.safeParse(body)
    const submittedAnswers: Record<string, ExamAnswer> = parsed.success && parsed.data.answers
      ? parsed.data.answers
      : (JSON.parse(attempt.answers || '{}') as Record<string, ExamAnswer>)

    const now = new Date()
    const autoSubmitted = Boolean(attempt.expiresAt && attempt.expiresAt.getTime() + GRACE_MS < now.getTime())
    const score = gradeAttempt(payload, JSON.parse(attempt.questionOrder), submittedAnswers, attempt.startedAt, now)

    const scoreJson = JSON.stringify({
      total: score.total,
      max: score.max,
      correct: score.correct,
      wrong: score.wrong,
      unanswered: score.unanswered,
      timeSpentSec: score.timeSpentSec,
      bySkill: score.bySkill,
    })

    const updated = await db.hskExamAttempt.update({
      where: { id },
      data: {
        answers: JSON.stringify(submittedAnswers),
        status: autoSubmitted ? 'expired' : 'submitted',
        submittedAt: now,
        scorePercent: score.percent,
        passed: score.passed,
        scoreJson,
      },
    })

    return NextResponse.json(
      resultResponse(
        payload,
        { ...updated, autoSubmitted },
        { allowReview: exam.allowReview, showCorrectAnswers: exam.showCorrectAnswers, showExplanations: exam.showExplanations }
      )
    )
  } catch (err) {
    console.error('[POST /api/hsk-exams/attempts/[id]] error:', err)
    return NextResponse.json({ error: 'Could not grade the exam — try again.' }, { status: 500 })
  }
}
