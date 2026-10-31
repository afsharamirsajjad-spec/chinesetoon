// ---------------------------------------------------------------------------
// 📝 /api/admin/hsk-exams — HSK Exam Management (admin only, Part 3.6)
// GET → all exams (incl. drafts) with question counts · POST → create/update
// rules. Questions are referenced by ID from the shared bank; the list view
// shows how many questions each exam has and whether they all have keys.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isAuthorized, getAdminActor } from '@/lib/admin-auth'
import { isSameOrigin } from '@/lib/http-guard'
import { logAdminAction } from '@/lib/audit'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const examSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, 'Slug: lowercase letters, numbers and dashes only'),
  title: z.string().trim().min(1).max(160),
  description: z.string().max(1500).default(''),
  level: z.enum(['hsk1', 'hsk2', 'hsk3']).default('hsk1'),
  examType: z.enum(['mock', 'listening', 'reading', 'vocabulary', 'grammar', 'timed', 'untimed']).default('mock'),
  durationMin: z.number().int().min(0).max(300).default(0),
  passPercent: z.number().int().min(1).max(100).default(60),
  questionIds: z.array(z.string().max(40)).max(200).default([]),
  randomizeQuestions: z.boolean().default(false),
  randomizeOptions: z.boolean().default(false),
  allowPause: z.boolean().default(true),
  allowReview: z.boolean().default(true),
  showCorrectAnswers: z.boolean().default(true),
  showExplanations: z.boolean().default(false),
  audioReplayLimit: z.number().int().min(0).max(20).default(0),
  access: z.enum(['free', 'restricted']).default('free'),
  published: z.boolean().default(false),
  sortOrder: z.number().int().min(0).max(9999).default(0),
})

export async function GET(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const rows = await db.hskExam.findMany({
      orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    })
    const allIds = [...new Set(rows.flatMap((r) => (JSON.parse(r.questionIds) as string[])))]
    const questions = allIds.length
      ? await db.hskQuestion.findMany({
          where: { id: { in: allIds } },
          select: { id: true, kind: true, answerIndex: true, matchLeft: true, matchOptions: true, tiles: true },
        })
      : []
    const keyed = new Set(
      questions
        .filter((q) =>
          q.kind === 'match'
            ? q.matchLeft.length > 0 && q.matchLeft.length === q.matchOptions.length
            : q.kind === 'order'
              ? (JSON.parse(q.tiles) as string[]).length > 1
              : q.answerIndex !== null
        )
        .map((q) => q.id)
    )
    return NextResponse.json({
      exams: rows.map((r) => {
        const ids = JSON.parse(r.questionIds) as string[]
        return {
          id: r.id,
          slug: r.slug,
          title: r.title,
          description: r.description,
          level: r.level,
          examType: r.examType,
          durationMin: r.durationMin,
          passPercent: r.passPercent,
          questionIds: ids,
          questionCount: ids.length,
          questionsKeyed: ids.filter((id) => keyed.has(id)).length,
          randomizeQuestions: r.randomizeQuestions,
          randomizeOptions: r.randomizeOptions,
          allowPause: r.allowPause,
          allowReview: r.allowReview,
          showCorrectAnswers: r.showCorrectAnswers,
          showExplanations: r.showExplanations,
          audioReplayLimit: r.audioReplayLimit,
          access: r.access,
          published: r.published,
          sortOrder: r.sortOrder,
          attemptCount: undefined,
        }
      }),
    })
  } catch (err) {
    console.error('[GET /api/admin/hsk-exams] error:', err)
    return NextResponse.json({ error: 'Could not load exams' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const body = await req.json().catch(() => null)
    const parsed = examSchema.safeParse(body)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return NextResponse.json(
        { error: first ? `${first.path.join('.') || 'field'}: ${first.message}` : 'Invalid exam data' },
        { status: 400 }
      )
    }
    const data = { ...parsed.data, questionIds: JSON.stringify(parsed.data.questionIds) } as unknown as Parameters<typeof db.hskExam.create>[0]['data']
    const row = await db.hskExam.create({ data })
    const actor = await getAdminActor(req)
    logAdminAction({
      actor,
      action: 'hskExam.create',
      targetType: 'hskExam',
      targetId: row.id,
      meta: { slug: row.slug, title: row.title },
    })
    return NextResponse.json({ ok: true, id: row.id })
  } catch (err) {
    if (err instanceof Error && err.message.includes('Unique constraint')) {
      return NextResponse.json({ error: 'That slug is already in use.' }, { status: 409 })
    }
    console.error('[POST /api/admin/hsk-exams] error:', err)
    return NextResponse.json({ error: 'Could not create the exam' }, { status: 500 })
  }
}
