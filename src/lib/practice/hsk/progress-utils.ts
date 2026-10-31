// ---------------------------------------------------------------------------
// 📈 HSK progress helpers — CLIENT-SAFE
//
// Pure functions over the progress summary shape. Used by the API (via
// builder.ts re-exports) AND by client components for guests' temporary
// local (localStorage) progress. Contains NO answer keys and NO content.
// ---------------------------------------------------------------------------

import {
  HSK_MODULES,
  HSK_STAGE_COUNT,
  type AttemptInput,
  type Hsk1ProgressSummary,
  type ProgressSummary,
} from './types'

// re-exported for convenience of client importers
export type { AttemptInput, Hsk1ProgressSummary, ProgressSummary } from './types'

export function emptyProgress(): Hsk1ProgressSummary {
  return { version: 1, stages: {}, lastStage: null, lastModule: null, lastVisitAt: null, vocabStats: {} }
}

/** Defensive parse of a stored/local progress JSON — never throws */
export function parseProgressJson(raw: string | null | undefined): Hsk1ProgressSummary {
  if (!raw) return emptyProgress()
  try {
    const parsed = JSON.parse(raw) as Hsk1ProgressSummary
    if (parsed && parsed.version === 1 && typeof parsed.stages === 'object' && parsed.stages) {
      return parsed
    }
  } catch {
    // corrupted snapshot — fall back to a fresh one rather than erroring
  }
  return emptyProgress()
}

/** Stage 1 is always unlocked; stage N unlocks when every module of N−1 is completed */
export function isStageUnlocked(progress: Hsk1ProgressSummary, stage: number): boolean {
  if (!Number.isInteger(stage) || stage < 1 || stage > HSK_STAGE_COUNT) return false
  if (stage === 1) return true
  const prev = progress.stages[stage - 1]
  if (!prev) return false
  return HSK_MODULES.every((m) => prev.modules[m]?.completed === true)
}

export function computeSummary(progress: Hsk1ProgressSummary): ProgressSummary {
  let completedModules = 0
  let completedStages = 0
  for (let s = 1; s <= HSK_STAGE_COUNT; s++) {
    const sp = progress.stages[s]
    const done = HSK_MODULES.filter((m) => sp?.modules[m]?.completed).length
    completedModules += done
    if (done === HSK_MODULES.length) completedStages++
  }
  let unlockedUpTo = 1
  while (unlockedUpTo < HSK_STAGE_COUNT && isStageUnlocked(progress, unlockedUpTo + 1)) unlockedUpTo++
  let currentStage = HSK_STAGE_COUNT
  for (let s = 1; s <= HSK_STAGE_COUNT; s++) {
    const sp = progress.stages[s]
    const allDone = HSK_MODULES.every((m) => sp?.modules[m]?.completed)
    if (!allDone) {
      currentStage = s
      break
    }
  }
  return {
    overallPercent: Math.round((completedModules / (HSK_STAGE_COUNT * HSK_MODULES.length)) * 100),
    completedModules,
    completedStages,
    currentStage,
    unlockedUpTo,
  }
}

/** Immutable merge — returns a NEW progress object (never mutates the input) */
export function mergeAttempt(progress: Hsk1ProgressSummary, attempt: AttemptInput): Hsk1ProgressSummary {
  const next: Hsk1ProgressSummary = {
    ...progress,
    stages: { ...progress.stages },
    vocabStats: { ...progress.vocabStats },
  }
  const stageKey = String(attempt.stage)
  const stageProgress = { ...(next.stages[stageKey] ?? { modules: {} }) }
  stageProgress.modules = { ...stageProgress.modules }
  const existing = stageProgress.modules[attempt.module]
  const bestPercent = Math.max(existing?.bestPercent ?? 0, attempt.percent)
  const completed = (existing?.completed ?? false) || attempt.passed
  stageProgress.modules[attempt.module] = {
    bestPercent,
    attempts: (existing?.attempts ?? 0) + 1,
    completed,
    completedAt: existing?.completedAt ?? (attempt.passed ? attempt.at : null),
    lastAttemptAt: attempt.at,
  }
  next.stages[stageKey] = stageProgress
  next.lastStage = attempt.stage
  next.lastModule = attempt.module
  next.lastVisitAt = attempt.at

  const stats = { ...next.vocabStats }
  for (const w of attempt.correctWords ?? []) {
    const cur = stats[w] ?? { seen: 0, correct: 0 }
    stats[w] = { seen: cur.seen + 1, correct: cur.correct + 1 }
  }
  for (const w of attempt.wrongWords ?? []) {
    const cur = stats[w] ?? { seen: 0, correct: 0 }
    stats[w] = { seen: cur.seen + 1, correct: cur.correct }
  }
  next.vocabStats = stats
  return next
}
