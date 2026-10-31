// ---------------------------------------------------------------------------
// 📝 HSK exam engine (SERVER-ONLY, Part 3)
//
// Integrity model:
//   • When an attempt starts we snapshot the exam config + every question
//     WITH its answer key into HskExamVersion.payload. Grading, review and
//     analytics all read the SNAPSHOT — later edits to the exam or its
//     questions never change historical or in-flight results.
//   • The browser only ever sees options (optionally randomized per attempt)
//     and never the answer keys. All grading is server-side.
//   • Timed exams get a server-enforced expiresAt; the submit endpoint
//     refuses grading after the deadline (+30s grace) and an expired
//     in-progress attempt auto-submits with what was saved.
// ---------------------------------------------------------------------------

import { randomBytes } from 'crypto'
import { db } from '@/lib/db'

export interface VersionQuestion {
  id: string
  kind: string
  prompt: string
  hanzi: string
  pinyin: string
  options: string[]
  answerIndex: number | null
  matchLeft: string[]
  matchOptions: string[]
  tiles: string[]
  explanation: string
  skill: string
  points: number
  audioUrl: string | null
  imageUrl: string | null
  passageId: string | null
  passageTitle?: string
  passageLines?: Array<{ hanzi: string; pinyin: string; english: string }>
  passageNotes?: Array<{ word: string; meaning: string }>
}

export interface VersionPayload {
  examId: string
  title: string
  level: string
  examType: string
  durationMin: number
  passPercent: number
  allowReview: boolean
  showCorrectAnswers: boolean
  showExplanations: boolean
  questions: VersionQuestion[]
}

function parseArray<T>(raw: string | null | undefined): T[] {
  if (!raw) return []
  try {
    const v = JSON.parse(raw)
    return Array.isArray(v) ? (v as T[]) : []
  } catch {
    return []
  }
}

/** Shuffle with a per-attempt seed (randomized options stay stable within one attempt) */
function shuffleSeeded<T>(arr: readonly T[], seed: string): T[] {
  let h = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  const out = [...arr]
  let a = h >>> 0
  for (let i = out.length - 1; i > 0; i--) {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), a | 1)
    t = (t + Math.imul(t ^ (t >>> 7), t | 61)) ^ t
    const j = ((t ^ (t >>> 14)) >>> 0) % (i + 1)
    const tmp = out[i]
    out[i] = out[j]
    out[j] = tmp
  }
  return out
}

/**
 * Snapshot the exam for a new attempt: config + full questions (with keys)
 * + reading passages inlined. Throws when the exam has no usable questions.
 */
export async function createExamVersion(examId: string): Promise<{ versionId: string; payload: VersionPayload; questionOrder: string[] }> {
  const exam = await db.hskExam.findUnique({ where: { id: examId } })
  if (!exam) throw new Error('Exam not found')
  const questionIds = parseArray<string>(exam.questionIds)
  if (questionIds.length === 0) throw new Error('The exam has no questions')

  const questions = await db.hskQuestion.findMany({
    where: { id: { in: questionIds }, published: true },
  })
  // preserve the admin's order; skip missing/unpublished
  const byId = new Map(questions.map((q) => [q.id, q]))
  const ordered = questionIds.map((id) => byId.get(id)).filter((q): q is (typeof questions)[number] => Boolean(q))
  if (ordered.length === 0) throw new Error('The exam has no published questions')

  const passageIds = [...new Set(ordered.map((q) => q.passageId).filter((x): x is string => Boolean(x)))]
  const passages = passageIds.length
    ? await db.hskReading.findMany({ where: { id: { in: passageIds } } })
    : []
  const passageById = new Map(passages.map((p) => [p.id, p]))

  const versionQuestions: VersionQuestion[] = []
  for (const q of ordered) {
    const passage = q.passageId ? passageById.get(q.passageId) : undefined
    versionQuestions.push({
      id: q.id,
      kind: q.kind,
      prompt: q.prompt,
      hanzi: q.hanzi,
      pinyin: q.pinyin,
      options: parseArray<string>(q.options),
      answerIndex: q.answerIndex,
      matchLeft: parseArray<string>(q.matchLeft),
      matchOptions: parseArray<string>(q.matchOptions),
      tiles: parseArray<string>(q.tiles),
      explanation: q.explanation,
      skill: q.skill,
      points: q.points,
      audioUrl: q.audioFileId ? `/api/files/${q.audioFileId}` : null,
      imageUrl: q.imageFileId ? `/api/files/${q.imageFileId}` : null,
      passageId: q.passageId,
      passageTitle: passage?.title,
      passageLines: passage ? parseArray(passage.lines) : [],
      passageNotes: passage ? parseArray(passage.notes) : [],
    })
  }

  const payload: VersionPayload = {
    examId: exam.id,
    title: exam.title,
    level: exam.level,
    examType: exam.examType,
    durationMin: exam.durationMin,
    passPercent: exam.passPercent,
    allowReview: exam.allowReview,
    showCorrectAnswers: exam.showCorrectAnswers,
    showExplanations: exam.showExplanations,
    questions: versionQuestions,
  }

  const version = await db.hskExamVersion.create({
    data: { examId: exam.id, payload: JSON.stringify(payload) },
  })
  const questionOrder = versionQuestions.map((q) => q.id)
  return { versionId: version.id, payload, questionOrder }
}

export interface PublicAttemptQuestion {
  id: string
  kind: string
  prompt: string
  hanzi: string
  pinyin: string
  options: string[]
  matchLeft: string[]
  tiles: string[]
  points: number
  skill: string
  audioUrl: string | null
  imageUrl: string | null
  passageId: string | null
}

/** What the browser gets: questions WITHOUT keys, display-shuffled if configured */
export function publicAttemptView(
  payload: VersionPayload,
  questionOrder: string[],
  randomizeOptions: boolean,
  attemptSeed: string
): { questions: PublicAttemptQuestion[]; passages: Array<{ id: string; title: string; lines: Array<{ hanzi: string; pinyin: string; english: string }>; notes: Array<{ word: string; meaning: string }> }> } {
  const byId = new Map(payload.questions.map((q) => [q.id, q]))
  const ordered = questionOrder.map((id) => byId.get(id)).filter((q): q is VersionQuestion => Boolean(q))

  const optionMap = new Map<string, string[]>()
  if (randomizeOptions) {
    for (const q of ordered) {
      if (q.options.length > 1 && q.kind !== 'match') {
        optionMap.set(q.id, shuffleSeeded(q.options, `${attemptSeed}:${q.id}`))
      }
    }
  }

  const passagesMap = new Map<string, { id: string; title: string; lines: Array<{ hanzi: string; pinyin: string; english: string }>; notes: Array<{ word: string; meaning: string }> }>()
  for (const q of ordered) {
    if (q.passageId && !passagesMap.has(q.passageId)) {
      passagesMap.set(q.passageId, {
        id: q.passageId,
        title: q.passageTitle ?? 'Reading passage',
        lines: q.passageLines ?? [],
        notes: q.passageNotes ?? [],
      })
    }
  }

  return {
    questions: ordered.map((q) => ({
      id: q.id,
      kind: q.kind,
      prompt: q.prompt,
      hanzi: q.hanzi,
      pinyin: q.pinyin,
      options: optionMap.get(q.id) ?? q.options,
      matchLeft: q.kind === 'match' ? shuffleSeeded(q.matchLeft, `${attemptSeed}:L${q.id}`) : [],
      tiles: q.kind === 'order' ? (() => {
        const display = shuffleSeeded(q.tiles, `${attemptSeed}:T${q.id}`)
        const identity = display.length === q.tiles.length && display.every((t, j) => t === q.tiles[j])
        return identity ? [...display.slice(1), display[0]] : display
      })() : [],
      points: q.points,
      skill: q.skill,
      audioUrl: q.audioUrl,
      imageUrl: q.imageUrl,
      passageId: q.passageId,
    })),
    passages: [...passagesMap.values()],
  }
}

export interface AttemptScore {
  total: number
  max: number
  percent: number
  passed: boolean
  correct: number
  wrong: number
  unanswered: number
  timeSpentSec: number
  bySkill: Record<string, { score: number; max: number }>
}

/** Grade submitted answers against the SNAPSHOT (never live content) */
export function gradeAttempt(
  payload: VersionPayload,
  questionOrder: string[],
  answers: Record<string, ExamAnswer>,
  startedAt: Date,
  submittedAt: Date
): AttemptScore {
  const byId = new Map(payload.questions.map((q) => [q.id, q]))
  let total = 0
  let max = 0
  let correctCount = 0
  let wrongCount = 0
  let unansweredCount = 0
  const bySkill: Record<string, { score: number; max: number }> = {}

  for (const id of questionOrder) {
    const q = byId.get(id)
    if (!q) continue
    max += q.points
    const skillEntry = bySkill[q.skill] ?? { score: 0, max: 0 }
    skillEntry.max += q.points

    const sub = answers[id] ?? null
    const ok = isCorrect(q, sub)
    if (ok) {
      total += q.points
      correctCount++
      skillEntry.score += q.points
    } else if (sub === null || sub === undefined || (Array.isArray(sub) && sub.length === 0)) {
      unansweredCount++
    } else {
      wrongCount++
    }
    bySkill[q.skill] = skillEntry
  }

  const percent = max > 0 ? Math.round((total / max) * 100) : 0
  return {
    total,
    max,
    percent,
    passed: percent >= payload.passPercent,
    correct: correctCount,
    wrong: wrongCount,
    unanswered: unansweredCount,
    timeSpentSec: Math.max(0, Math.round((submittedAt.getTime() - startedAt.getTime()) / 1000)),
    bySkill,
  }
}

/**
 * Exam answers are submitted as TEXT (the picked option / matched pair /
 * built sentence) — display order may be randomized per attempt, and text
 * comparison makes that harmless.
 */
export type ExamAnswer = string | string[] | null

function isCorrect(q: VersionQuestion, sub: ExamAnswer): boolean {
  switch (q.kind) {
    case 'match': {
      if (!Array.isArray(sub) || sub.length !== q.matchLeft.length) return false
      return q.matchLeft.every((_, i) => sub[i] === q.matchOptions[i])
    }
    case 'order': {
      if (!Array.isArray(sub) || sub.length !== q.tiles.length) return false
      return sub.join('') === q.tiles.join('')
    }
    default: {
      if (typeof sub !== 'string') return false
      const answer = q.options[q.answerIndex ?? 0]
      return sub.length > 0 && sub === answer
    }
  }
}

/** Per-question review rows — only when the exam config allows it */
export function attemptReview(
  payload: VersionPayload,
  questionOrder: string[],
  answers: Record<string, ExamAnswer>
): Array<{
  id: string
  correct: boolean
  unanswered: boolean
  prompt: string
  hanzi: string
  pinyin: string
  options: string[]
  picked: string | string[] | null
  answer: string
  explanation: string
  skill: string
}> {
  const byId = new Map(payload.questions.map((q) => [q.id, q]))
  const rows: ReturnType<typeof attemptReview> = []
  for (const id of questionOrder) {
    const q = byId.get(id)
    if (!q) continue
    const sub = (answers[id] ?? null) as string | string[] | null
    const ok = isCorrect(q, sub)
    const unanswered = sub === null || sub === undefined || (Array.isArray(sub) && sub.length === 0)
    let answerText = ''
    if (q.kind === 'match') {
      answerText = q.matchLeft.map((l, i) => `${l} → ${q.matchOptions[i]}`).join(' · ')
    } else if (q.kind === 'order') {
      answerText = q.tiles.join('')
    } else {
      answerText = q.options[q.answerIndex ?? 0] ?? ''
    }
    rows.push({
      id: q.id,
      correct: ok,
      unanswered,
      prompt: q.prompt,
      hanzi: q.hanzi,
      pinyin: q.pinyin,
      options: q.options,
      picked: sub,
      answer: answerText,
      explanation: q.explanation,
      skill: q.skill,
    })
  }
  return rows
}

export function newAttemptSeed(): string {
  return randomBytes(12).toString('hex')
}
