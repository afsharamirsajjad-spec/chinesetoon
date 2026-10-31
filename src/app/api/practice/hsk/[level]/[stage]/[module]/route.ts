// ---------------------------------------------------------------------------
// 📚 /api/practice/hsk/[level]/[stage]/[module] — exercises + grading
//
// GET  → the module's 10 exercises WITHOUT answer keys (deterministic set —
//        same questions on every call, so refresh-safe and gradeable later).
// POST { answers } → server-side grading (same trust model as /api/exams):
//   • signed-in + stage unlocked → grade, persist progress, return summary
//   • signed-in + stage locked   → 403 (no bypassing the learning flow)
//   • guest                      → graded result only (nothing persisted;
//                                  the browser keeps temporary local progress)
//
// Completion rule: a module counts as completed only when a graded attempt
// reaches ≥ 80% — never merely by opening the page. Stage N+1 unlocks only
// after every module of stage N is completed.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimit, tooManyRequests } from '@/lib/rate-limit'
import { getUserFromRequest } from '@/lib/user-auth'
import { guardResponse } from '@/lib/http-guard'
import { db } from '@/lib/db'
import {
  computeSummary,
  emptyProgress,
  gradeKeyed,
  isStageUnlocked,
  mergeAttempt,
  toClientExercises,
} from '@/lib/practice/hsk/builder'
import { getModuleExercisesWithKeys } from '@/lib/practice/hsk/db-questions'
import { HSK_MODULES, HSK_STAGE_COUNT, type Hsk1ProgressSummary, type HskModuleKind } from '@/lib/practice/hsk/types'

export const dynamic = 'force-dynamic'

const answerSchema = z.union([z.number().int().min(-1).max(99).nullable(), z.array(z.number().int().min(-1).max(99)).max(20)])
const submitSchema = z.object({
  answers: z.array(answerSchema).max(30),
})

function parseProgress(raw: string | null | undefined): Hsk1ProgressSummary {
  if (!raw) return emptyProgress()
  try {
    const parsed = JSON.parse(raw) as Hsk1ProgressSummary
    if (parsed && parsed.version === 1 && typeof parsed.stages === 'object' && parsed.stages) return parsed
  } catch {
    // corrupted snapshot — fall back to a fresh one rather than erroring
  }
  return emptyProgress()
}

/** Session lookup that degrades to guest instead of failing the whole grade when the DB is down */
async function getUserFromRequestSafe(req: NextRequest) {
  try {
    return await getUserFromRequest(req)
  } catch {
    return null
  }
}

function parseParams(
  level: string,
  stageParam: string,
  module: string
): { stage: number; module: HskModuleKind } | null {
  if (level !== 'hsk1') return null
  const stage = Number(stageParam)
  if (!Number.isInteger(stage) || stage < 1 || stage > HSK_STAGE_COUNT) return null
  if (!(HSK_MODULES as readonly string[]).includes(module)) return null
  return { stage, module: module as HskModuleKind }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ level: string; stage: string; module: string }> }
) {
  try {
    const { level, stage: stageParam, module } = await params
    const parsed = parseParams(level, stageParam, module)
    if (!parsed) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    // admin-authored questions win; the deterministic generated set is the fallback
    const { keyed, source } = await getModuleExercisesWithKeys(parsed.stage, parsed.module, level)
    return NextResponse.json({ exercises: toClientExercises(keyed), source })
  } catch (err) {
    console.error('[GET /api/practice/hsk] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ level: string; stage: string; module: string }> }
) {
  const guard = guardResponse(req)
  if (guard) return guard
  // 30 submissions per hour per IP — grading must not be spam-abusable
  const rl = await rateLimit('hsk-practice-submit', req, 30, 3600, 3600)
  if (!rl.ok) return tooManyRequests(rl)

  try {
    const { level, stage: stageParam, module } = await params
    const parsed = parseParams(level, stageParam, module)
    if (!parsed) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json().catch(() => null)
    const check = submitSchema.safeParse(body)
    if (!check.success) {
      return NextResponse.json({ error: 'Invalid answers payload' }, { status: 400 })
    }

    const user = await getUserFromRequestSafe(req)
    let progress: Hsk1ProgressSummary | null = null
    if (user) {
      const row = await db.hskProgress.findUnique({ where: { userId: user.id } })
      progress = parseProgress(row?.data)
      // 🔒 the learning flow cannot be bypassed: no records for locked stages
      if (!isStageUnlocked(progress, parsed.stage)) {
        return NextResponse.json({ error: 'This stage is still locked' }, { status: 403 })
      }
    }

    const { keyed } = await getModuleExercisesWithKeys(parsed.stage, parsed.module, level)
    const grade = gradeKeyed(keyed, check.data.answers)

    if (!user || !progress) {
      // guest — graded result only; the browser keeps temporary local progress
      return NextResponse.json({ authenticated: false, result: grade })
    }

    const now = new Date().toISOString()
    const merged = mergeAttempt(progress, {
      stage: parsed.stage,
      module: parsed.module,
      percent: grade.percent,
      passed: grade.passed,
      at: now,
      correctWords: grade.correctWords,
      wrongWords: grade.wrongWords,
    })
    const data = JSON.stringify(merged)
    await db.hskProgress.upsert({
      where: { userId: user.id },
      create: { userId: user.id, data },
      update: { data },
    })

    // 🔥 hub streak integration — a passed module counts as one practice activity
    if (grade.passed) {
      db.practiceEvent
        .create({ data: { userId: user.id, activityKey: 'hsk-course' } })
        .catch(() => {})
    }

    return NextResponse.json({ authenticated: true, result: grade, progress: merged, ...computeSummary(merged) })
  } catch (err) {
    console.error('[POST /api/practice/hsk] error:', err)
    return NextResponse.json({ error: 'Could not grade the attempt — try again.' }, { status: 500 })
  }
}
