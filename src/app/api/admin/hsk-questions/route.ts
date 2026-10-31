// ---------------------------------------------------------------------------
// 🧩 /api/admin/hsk-questions — shared question bank (admin only, Parts 3b+4)
//
// One bank for Practice module tests (stageNumber+skill) and HSK exams
// (referenced by HskExam.questionIds). Answer keys (answerIndex / matchOptions
// alignment / correct tile order) are stored here and NEVER returned — the
// list endpoint answers with `hasKey` only, and public serving strips keys.
//
// Conventions the grader relies on:
//   • mcq/truefalse/fill/listen → options[] + answerIndex (0-based)
//   • match → matchLeft[i] paired with matchOptions[i] (shuffled for display)
//   • order → tiles[] stored in the CORRECT order (shuffled for display)
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isAuthorized, getAdminActor } from '@/lib/admin-auth'
import { isSameOrigin } from '@/lib/http-guard'
import { logAdminAction } from '@/lib/audit'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const KINDS = ['mcq', 'truefalse', 'fill', 'match', 'order', 'listen'] as const
const SKILLS = ['vocabulary', 'grammar', 'pronunciation', 'reading', 'listening'] as const

const baseSchema = {
  kind: z.enum(KINDS),
  prompt: z.string().trim().min(1).max(600),
  hanzi: z.string().max(600).default(''),
  pinyin: z.string().max(600).default(''),
  options: z.array(z.string().max(300)).max(8).default([]),
  answerIndex: z.number().int().min(0).max(7).nullable().default(null),
  matchLeft: z.array(z.string().max(300)).max(8).default([]),
  matchOptions: z.array(z.string().max(300)).max(8).default([]),
  tiles: z.array(z.string().max(120)).max(14).default([]),
  explanation: z.string().max(1000).default(''),
  level: z.enum(['hsk1', 'hsk2', 'hsk3']).default('hsk1'),
  skill: z.enum(SKILLS),
  stageNumber: z.number().int().min(1).max(50).nullable().default(null),
  points: z.number().int().min(1).max(100).default(1),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('easy'),
  audioFileId: z.string().max(40).nullable().default(null),
  imageFileId: z.string().max(40).nullable().default(null),
  passageId: z.string().max(40).nullable().default(null),
  published: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(9999).default(0),
}

const createSchema = z.object(baseSchema).superRefine((q, ctx) => {
  if (q.kind === 'match') {
    if (q.matchLeft.length < 2 || q.matchLeft.length !== q.matchOptions.length) {
      ctx.addIssue({ code: 'custom', message: 'Match questions need equal-length matchLeft and matchOptions (2+ pairs).', path: ['matchLeft'] })
    }
    return
  }
  if (q.kind === 'order') {
    if (q.tiles.length < 2) {
      ctx.addIssue({ code: 'custom', message: 'Order questions need at least 2 tiles (stored in the correct order).', path: ['tiles'] })
    }
    return
  }
  if (q.options.length < 2) {
    ctx.addIssue({ code: 'custom', message: 'At least two options are required.', path: ['options'] })
    return
  }
  if (q.answerIndex === undefined || q.answerIndex === null || q.answerIndex < 0 || q.answerIndex >= q.options.length) {
    ctx.addIssue({ code: 'custom', message: 'Pick which option is correct.', path: ['answerIndex'] })
  }
  if (q.kind === 'listen' && !q.audioFileId && !q.hanzi) {
    ctx.addIssue({ code: 'custom', message: 'Listening questions need an audio file (or hanzi for text-to-speech).', path: ['audioFileId'] })
  }
})

export async function GET(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { searchParams } = new URL(req.url)
    const level = searchParams.get('level') ?? ''
    const skill = searchParams.get('skill') ?? ''
    const stage = searchParams.get('stage') ?? ''
    const query = (searchParams.get('query') ?? '').trim().toLowerCase().slice(0, 80)

    const rows = await db.hskQuestion.findMany({
      where: {
        ...(level && ['hsk1', 'hsk2', 'hsk3'].includes(level) ? { level } : {}),
        ...(skill && (SKILLS as readonly string[]).includes(skill) ? { skill } : {}),
        ...(stage && Number.isInteger(Number(stage)) ? { stageNumber: Number(stage) } : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      take: 400,
    })

    const questions = rows
      .filter((r) => (query ? r.prompt.toLowerCase().includes(query) || r.hanzi.includes(query) : true))
      .map((r) => ({
        id: r.id,
        kind: r.kind,
        prompt: r.prompt,
        hanzi: r.hanzi,
        pinyin: r.pinyin,
        // 🔒 answers are never listed — only how many options and whether a key exists
        optionCount: (JSON.parse(r.options) as string[]).length,
        matchCount: (JSON.parse(r.matchLeft) as string[]).length,
        tileCount: (JSON.parse(r.tiles) as string[]).length,
        hasKey:
          r.kind === 'match'
            ? r.matchLeft.length === r.matchOptions.length && r.matchLeft.length > 0
            : r.kind === 'order'
              ? (JSON.parse(r.tiles) as string[]).length > 1
              : r.answerIndex !== null,
        explanation: r.explanation,
        level: r.level,
        skill: r.skill,
        stageNumber: r.stageNumber,
        points: r.points,
        difficulty: r.difficulty,
        audioFileId: r.audioFileId,
        imageFileId: r.imageFileId,
        passageId: r.passageId,
        published: r.published,
        sortOrder: r.sortOrder,
        createdAt: r.createdAt.toISOString(),
      }))
    return NextResponse.json({ questions })
  } catch (err) {
    console.error('[GET /api/admin/hsk-questions] error:', err)
    return NextResponse.json({ error: 'Could not load questions' }, { status: 500 })
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
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return NextResponse.json(
        { error: first ? `${first.path.join('.') || 'field'}: ${first.message}` : 'Invalid question' },
        { status: 400 }
      )
    }
    const q = parsed.data
    if (q.kind === 'match' || q.kind === 'order') {
      q.answerIndex = null
    }
    if (q.kind !== 'match' && q.kind !== 'order') {
      if (q.answerIndex === null || q.answerIndex < 0 || q.answerIndex >= q.options.length) {
        return NextResponse.json({ error: 'Pick which option is correct.' }, { status: 400 })
      }
    }
    if (q.passageId && q.passageId.length > 40) {
      return NextResponse.json({ error: 'Invalid passage reference' }, { status: 400 })
    }
    const row = await db.hskQuestion.create({
      data: {
        kind: q.kind,
        prompt: q.prompt,
        hanzi: q.hanzi,
        pinyin: q.pinyin,
        options: JSON.stringify(q.options),
        answerIndex: q.answerIndex,
        matchLeft: JSON.stringify(q.matchLeft),
        matchOptions: JSON.stringify(q.matchOptions),
        tiles: JSON.stringify(q.tiles),
        explanation: q.explanation,
        level: q.level,
        skill: q.skill,
        stageNumber: q.stageNumber,
        points: q.points,
        difficulty: q.difficulty,
        audioFileId: q.audioFileId,
        imageFileId: q.imageFileId,
        passageId: q.passageId,
        published: q.published,
        sortOrder: q.sortOrder,
      },
    })
    const actor = await getAdminActor(req)
    logAdminAction({
      actor,
      action: 'hskQuestion.create',
      targetType: 'hskQuestion',
      targetId: row.id,
      meta: { kind: q.kind, skill: q.skill, level: q.level },
    })
    return NextResponse.json({ ok: true, id: row.id })
  } catch (err) {
    console.error('[POST /api/admin/hsk-questions] error:', err)
    return NextResponse.json({ error: 'Could not create the question' }, { status: 500 })
  }
}
