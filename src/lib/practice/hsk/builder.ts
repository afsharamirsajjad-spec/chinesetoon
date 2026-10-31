// ---------------------------------------------------------------------------
// 🔒 HSK 1 exercise builder + grader — SERVER-ONLY
//
// Generates the fixed 10-question exercise set for every (stage, module)
// deterministically from the curriculum: the same set is produced on every
// call (no session state), which lets the API serve questions without answer
// keys and grade submissions against the same generated set.
//
// Every answer key is DERIVED, never hand-maintained:
//   • authored mcq/fill/truefalse — correct option is authored first, the
//     builder shuffles per question id and remembers its new index
//   • match — authored pairing order, builder shuffles the pool
//   • order (arrange words) — generated from a known-correct sentence
//   • generated vocabulary/pronunciation items — built from the data itself
//
// NEVER import this file (or exercises.ts) from client code.
// ---------------------------------------------------------------------------

import { HSK1_STAGES, getHsk1Stage } from './content'
import { STAGE_GRAMMAR_EXERCISES, STAGE_READING_QUESTIONS } from './exercises'
import {
  HSK_PASS_PERCENT,
  type AuthoredQuestion,
  type ClientExercise,
  type GradeResult,
  type HskModuleKind,
  type ReviewRow,
  type SubmittedAnswer,
} from './types'
import {
  computeSummary,
  emptyProgress,
  isStageUnlocked,
  mergeAttempt,
  type AttemptInput,
  type ProgressSummary,
} from './progress-utils'

// 📈 progress helpers live in the CLIENT-SAFE progress-utils.ts (guests reuse
// them for local progress) — re-exported here for the server API callers.
export { computeSummary, emptyProgress, isStageUnlocked, mergeAttempt }
export type { AttemptInput, ProgressSummary }

// ---------------------------------------------------------------------------
// Deterministic PRNG (mulberry32) + string hash — same seed ⇒ same sequence
// ---------------------------------------------------------------------------

function hashString(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), a | 1)
    t = (t + Math.imul(t ^ (t >>> 7), t | 61)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seededShuffle<T>(arr: readonly T[], rng: () => number): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const t = out[i]
    out[i] = out[j]
    out[j] = t
  }
  return out
}

/** Options are authored/generated correct-first → shuffle and derive the key */
function shuffleMcq(options: string[], seed: string): { options: string[]; key: number } {
  const shuffled = seededShuffle(options, mulberry32(hashString(seed)))
  const correct = options[0]
  const key = shuffled.indexOf(correct)
  return { options: shuffled, key }
}

// ---------------------------------------------------------------------------
// Answer keys + grading
// ---------------------------------------------------------------------------

export type AnswerKey =
  | { t: 'index'; value: number }
  | { t: 'match'; value: number[] }
  | { t: 'order'; value: number[] }

export interface KeyedExercise {
  exercise: ClientExercise
  key: AnswerKey
  /** vocabulary module only: the taught word this question is about */
  word?: string
}

const EXERCISES_PER_MODULE = 10

function isSubmissionEqual(sub: SubmittedAnswer, key: AnswerKey, ex: ClientExercise): boolean {
  if (key.t === 'index') {
    return typeof sub === 'number' && Number.isInteger(sub) && sub === key.value
  }
  if (!Array.isArray(sub)) return false
  if (sub.length !== key.value.length) return false
  if (!sub.every((v) => typeof v === 'number' && Number.isInteger(v))) return false
  if (key.t === 'order') {
    // repeated tokens make several index orders look identical — compare the
    // sentence the user actually built, not the index sequence
    const tiles = ex.tiles ?? []
    if (new Set<number>(sub as number[]).size !== sub.length) return false
    const built = (sub as number[]).map((i) => tiles[i] ?? '').join('')
    return built === answerText(key, ex)
  }
  return sub.every((v, i) => v === key.value[i])
}

function answerText(key: AnswerKey, ex: ClientExercise): string {
  if (key.t === 'index') return ex.options?.[key.value] ?? ''
  if (key.t === 'match') {
    return key.value.map((idx, i) => `${ex.matchLeft?.[i] ?? ''} → ${ex.options?.[idx] ?? ''}`).join(' · ')
  }
  return key.value.map((i) => ex.tiles?.[i] ?? '').join('')
}

// ---------------------------------------------------------------------------
// Vocabulary exercises (10) — mixed types incl. review of earlier stages
// ---------------------------------------------------------------------------

const FILL_SKIP_WORDS = new Set(['的', '了', '吗', '呢'])

function buildVocabularyExercises(stage: number): KeyedExercise[] {
  const st = getHsk1Stage(stage)
  if (!st) return []
  const rng = mulberry32(hashString(`hsk1-vocab-${stage}`))
  const pool = seededShuffle(st.words, rng)
  const prevPool = seededShuffle(
    HSK1_STAGES.slice(0, stage - 1).flatMap((s) => s.words),
    mulberry32(hashString(`hsk1-vocab-prev-${stage}`))
  )
  const out: KeyedExercise[] = []

  const mcqZhEn = (w: (typeof pool)[number], seed: string): KeyedExercise => {
    const distractors = pool.filter((d) => d.hanzi !== w.hanzi).slice(0, 40)
    const opts = [w.meaning, ...seededShuffle(distractors, mulberry32(hashString(seed))).slice(0, 3).map((d) => d.meaning)]
    const { options, key } = shuffleMcq(opts, seed)
    return {
      exercise: { id: seed, kind: 'mcq', prompt: 'What does this word mean?', hanzi: w.hanzi, pinyin: w.pinyin, options },
      key: { t: 'index', value: key },
      word: w.hanzi,
    }
  }

  const mcqEnZh = (w: (typeof pool)[number], seed: string): KeyedExercise => {
    const distractors = pool.filter((d) => d.hanzi !== w.hanzi).slice(0, 40)
    const opts = [w.hanzi, ...seededShuffle(distractors, mulberry32(hashString(seed))).slice(0, 3).map((d) => d.hanzi)]
    const { options, key } = shuffleMcq(opts, seed)
    return {
      exercise: { id: seed, kind: 'mcq', prompt: `Which word means “${w.meaning}”?`, options },
      key: { t: 'index', value: key },
      word: w.hanzi,
    }
  }

  const matchZhEn = (words: (typeof pool)[number][], seed: string): KeyedExercise => {
    const left = words.map((w) => w.hanzi)
    const correct = words.map((w) => w.meaning)
    const shuffled = seededShuffle(correct, mulberry32(hashString(seed)))
    return {
      exercise: {
        id: seed, kind: 'match', prompt: 'Match each Chinese word with its meaning.',
        matchLeft: left, options: shuffled,
      },
      key: { t: 'match', value: correct.map((m) => shuffled.indexOf(m)) },
      word: words[0]?.hanzi,
    }
  }

  const matchEnZh = (words: (typeof pool)[number][], seed: string): KeyedExercise => {
    const left = words.map((w) => w.meaning)
    const correct = words.map((w) => w.hanzi)
    const shuffled = seededShuffle(correct, mulberry32(hashString(seed)))
    return {
      exercise: {
        id: seed, kind: 'match', prompt: 'Match each meaning with the Chinese word.',
        matchLeft: left, options: shuffled,
      },
      key: { t: 'match', value: correct.map((h) => shuffled.indexOf(h)) },
      word: words[0]?.hanzi,
    }
  }

  // 1) Chinese → English
  out.push(mcqZhEn(pool[0], `v1-${stage}`))
  // 2) English → Chinese
  out.push(mcqEnZh(pool[1], `v2-${stage}`))
  // 3) matching zh → en (4 pairs)
  out.push(matchZhEn(pool.slice(2, 6), `v3-${stage}`))
  // 4) matching en → zh (4 pairs)
  out.push(matchEnZh(pool.slice(6, 10), `v4-${stage}`))
  // 5) fill the missing word in a taught example sentence
  const fillWord =
    pool.slice(10).find((w) => !FILL_SKIP_WORDS.has(w.hanzi) && w.example.includes(w.hanzi)) ??
    pool.find((w) => !FILL_SKIP_WORDS.has(w.hanzi) && w.example.includes(w.hanzi))
  if (fillWord) {
    const others = pool.filter((d) => d.hanzi !== fillWord.hanzi)
    const opts = [
      fillWord.hanzi,
      ...seededShuffle(others, mulberry32(hashString(`v5-${stage}`))).slice(0, 3).map((d) => d.hanzi),
    ]
    const { options, key } = shuffleMcq(opts, `v5-${stage}`)
    out.push({
      exercise: {
        id: `v5-${stage}`, kind: 'fill',
        prompt: 'Fill in the missing word.',
        hanzi: fillWord.example.replace(fillWord.hanzi, '＿＿＿'),
        pinyin: fillWord.examplePinyin, options,
      },
      key: { t: 'index', value: key },
      word: fillWord.hanzi,
    })
  }
  // 6) character recognition — which pinyin matches the characters
  const pinyinWord = pool[11] ?? pool[0]
  {
    const distractors = pool.filter((d) => d.hanzi !== pinyinWord.hanzi && d.pinyin !== pinyinWord.pinyin)
    const opts = [
      pinyinWord.pinyin,
      ...seededShuffle(distractors, mulberry32(hashString(`v6-${stage}`))).slice(0, 3).map((d) => d.pinyin),
    ]
    const { options, key } = shuffleMcq(opts, `v6-${stage}`)
    out.push({
      exercise: { id: `v6-${stage}`, kind: 'mcq', prompt: 'Which pinyin matches these characters?', hanzi: pinyinWord.hanzi, options },
      key: { t: 'index', value: key },
      word: pinyinWord.hanzi,
    })
  }
  // 7) + 8) more current-stage recognition
  out.push(mcqZhEn(pool[12] ?? pool[0], `v7-${stage}`))
  out.push(mcqEnZh(pool[13] ?? pool[1], `v8-${stage}`))
  // 9) + 10) review of earlier stages (stage 1: two more current-stage items)
  if (stage > 1 && prevPool.length >= 2) {
    out.push(mcqZhEn(prevPool[0], `v9-${stage}`))
    out.push(mcqEnZh(prevPool[1] ?? prevPool[0], `v10-${stage}`))
  } else {
    out.push(mcqZhEn(pool[14] ?? pool[0], `v9-${stage}`))
    out.push(mcqEnZh(pool[2] ?? pool[1], `v10-${stage}`))
  }
  return out.slice(0, EXERCISES_PER_MODULE)
}

// ---------------------------------------------------------------------------
// Grammar exercises (10) — 6 authored + 4 "arrange the words" generated from
// the grammar example sentences (segmented against the taught vocabulary)
// ---------------------------------------------------------------------------

/** Extra segmentation tokens: textbook proper names + natural taught compounds */
const SEGMENT_EXTRA = ['玛丽', '大卫', '小明', '这儿', '那儿', '王老师', '李小姐', '王医生', '王先生', '汉字', '好吃']

function taughtCharsUpTo(stage: number): string[] {
  return HSK1_STAGES.slice(0, stage).flatMap((s) => s.words.map((w) => w.hanzi))
}

function segmentSentence(sentence: string, stage: number): string[] | null {
  const dict = new Set<string>([...taughtCharsUpTo(stage), ...SEGMENT_EXTRA])
  const cleaned = sentence.replace(/[。！？，、…—·：‘’“”()（）\s]/g, (m) => (/\s/.test(m) ? ' ' : ''))
  if (!cleaned) return null
  const tokens: string[] = []
  let i = 0
  while (i < cleaned.length) {
    let matched = ''
    for (let len = Math.min(5, cleaned.length - i); len >= 1; len--) {
      const cand = cleaned.slice(i, i + len)
      if (dict.has(cand)) {
        matched = cand
        break
      }
    }
    if (!matched) return null
    tokens.push(matched)
    i += matched.length
  }
  return tokens
}

function buildGrammarExercises(stage: number): KeyedExercise[] {
  const st = getHsk1Stage(stage)
  if (!st) return []
  const out: KeyedExercise[] = []

  // 1–6) authored choose/fill questions, options shuffled per id
  for (const q of STAGE_GRAMMAR_EXERCISES[stage - 1]) {
    const built = buildAuthoredQuestion(q)
    out.push(built)
  }

  // 7–10) arrange-the-words from the grammar example sentences
  const rng = mulberry32(hashString(`hsk1-grammar-order-${stage}`))
  const candidates = st.grammar
    .flatMap((g) => g.examples)
    .map((e) => ({ hanzi: e.hanzi, tokens: segmentSentence(e.hanzi, stage) }))
    .filter((e): e is { hanzi: string; tokens: string[] } => !!e.tokens && e.tokens.length >= 3 && e.tokens.length <= 8)
  const picked = seededShuffle(candidates, rng).slice(0, EXERCISES_PER_MODULE - STAGE_GRAMMAR_EXERCISES[stage - 1].length)
  for (const [i, cand] of picked.entries()) {
    const seed = `gx-order-${stage}-${i}`
    const display = seededShuffle(cand.tokens, mulberry32(hashString(seed)))
    // guard: a shuffled order identical to the answer would give the answer away
    const identity = display.length === cand.tokens.length && display.every((t, j) => t === cand.tokens[j])
    const finalDisplay = identity ? [...display.slice(1), display[0]] : display
    // repeated tokens (e.g. two 很) must map to DIFFERENT tile positions —
    // assign each occurrence the next unused index of that token
    const queues = new Map<string, number[]>()
    finalDisplay.forEach((t, idx) => {
      const q = queues.get(t) ?? []
      q.push(idx)
      queues.set(t, q)
    })
    const key = cand.tokens.map((t) => {
      const q = queues.get(t)
      const idx = q?.shift()
      return idx ?? finalDisplay.indexOf(t)
    })
    out.push({
      exercise: {
        id: seed, kind: 'order',
        prompt: 'Arrange the words into the correct sentence.',
        tiles: finalDisplay,
      },
      key: { t: 'order', value: key },
    })
  }
  return out.slice(0, EXERCISES_PER_MODULE)
}

/** Authored question (correct-first convention) → client view + key */
export function buildAuthoredQuestion(q: AuthoredQuestion): KeyedExercise {
  if (q.kind === 'match') {
    const left = q.matchLeft ?? []
    const correct = q.matchOptions ?? []
    const shuffled = seededShuffle(correct, mulberry32(hashString(q.id)))
    return {
      exercise: {
        id: q.id, kind: 'match', prompt: q.prompt,
        matchLeft: left, options: shuffled,
      },
      key: { t: 'match', value: correct.map((m) => shuffled.indexOf(m)) },
    }
  }
  const options = q.options ?? []
  const { options: shuffled, key } = shuffleMcq(options, q.id)
  return {
    exercise: {
      id: q.id, kind: q.kind === 'truefalse' ? 'truefalse' : q.kind === 'fill' ? 'fill' : 'mcq',
      prompt: q.prompt, hanzi: q.hanzi, pinyin: q.pinyin, options: shuffled,
    },
    key: { t: 'index', value: key },
  }
}

// ---------------------------------------------------------------------------
// Pronunciation exercises (10) — tone listening, word listening, minimal pairs
// ---------------------------------------------------------------------------

const TONE_OPTIONS = ['1st tone (ˉ)', '2nd tone (ˊ)', '3rd tone (ˇ)', '4th tone (ˋ)']

function buildPronunciationExercises(stage: number): KeyedExercise[] {
  const st = getHsk1Stage(stage)
  if (!st) return []
  const lesson = st.pronunciation
  const out: KeyedExercise[] = []
  const rng = mulberry32(hashString(`hsk1-pron-${stage}`))

  // 1–4) listen → which tone (sound-demo syllables, pinyin hidden to avoid leaks)
  for (const [i, demo] of lesson.toneDemos.slice(0, 4).entries()) {
    out.push({
      exercise: {
        id: `p-tone-${stage}-${i}`, kind: 'listen',
        prompt: 'Listen — which tone do you hear?',
        audio: demo.hanzi, options: [...TONE_OPTIONS],
      },
      key: { t: 'index', value: demo.tone - 1 },
    })
  }

  // 5–7) listen → which word (options show hanzi only)
  const words = seededShuffle(lesson.listeningWords, rng)
  for (let i = 0; i < 3 && i < words.length; i++) {
    const w = words[i]
    const others = seededShuffle(
      words.filter((d) => d.hanzi !== w.hanzi),
      mulberry32(hashString(`p-word-${stage}-${i}`))
    ).slice(0, 2)
    const opts = [w.hanzi, ...others.map((d) => d.hanzi)]
    const { options, key } = shuffleMcq(opts, `p-word-${stage}-${i}`)
    out.push({
      exercise: {
        id: `p-word-${stage}-${i}`, kind: 'listen',
        prompt: 'Listen and choose the word you hear.',
        audio: w.hanzi, options,
      },
      key: { t: 'index', value: key },
    })
  }

  // 8–9) minimal pairs — which one did you hear?
  for (const [i, pair] of lesson.minimalPairs.slice(0, 2).entries()) {
    const playA = rng() < 0.5
    out.push({
      exercise: {
        id: `p-pair-${stage}-${i}`, kind: 'listen',
        prompt: `Listen — which one do you hear? (${pair.note})`,
        audio: playA ? pair.a.hanzi : pair.b.hanzi,
        options: [`A — ${pair.a.hanzi} ${pair.a.pinyin} (${pair.a.meaning})`, `B — ${pair.b.hanzi} ${pair.b.pinyin} (${pair.b.meaning})`],
      },
      key: { t: 'index', value: playA ? 0 : 1 },
    })
  }

  // 10) visual tone reading — which tone is the first syllable?
  const toneWord = lesson.listeningWords.find((w) => typeof w.toneOfFirstSyllable === 'number')
  if (toneWord && typeof toneWord.toneOfFirstSyllable === 'number') {
    out.push({
      exercise: {
        id: `p-read-${stage}`, kind: 'mcq',
        prompt: `Which tone is the first syllable of “${toneWord.pinyin}”?`,
        hanzi: toneWord.hanzi, pinyin: toneWord.pinyin, options: [...TONE_OPTIONS],
      },
      key: { t: 'index', value: toneWord.toneOfFirstSyllable - 1 },
    })
  }
  return out.slice(0, EXERCISES_PER_MODULE)
}

// ---------------------------------------------------------------------------
// Reading exercises (10) — the authored comprehension questions
// ---------------------------------------------------------------------------

function buildReadingExercises(stage: number): KeyedExercise[] {
  const questions = STAGE_READING_QUESTIONS[stage - 1] ?? []
  const out: KeyedExercise[] = []
  for (const [pi, passage] of questions.entries()) {
    for (const q of passage) {
      const built = buildAuthoredQuestion(q)
      out.push({ ...built, exercise: { ...built.exercise, prompt: `Passage ${pi + 1}: ${q.prompt}` } })
    }
  }
  return out.slice(0, EXERCISES_PER_MODULE)
}

// ---------------------------------------------------------------------------
// Public API — build a module's exercises (with keys, server-side only)
// ---------------------------------------------------------------------------

export function buildModuleExercises(stage: number, module: HskModuleKind): KeyedExercise[] {
  switch (module) {
    case 'vocabulary':
      return buildVocabularyExercises(stage)
    case 'grammar':
      return buildGrammarExercises(stage)
    case 'pronunciation':
      return buildPronunciationExercises(stage)
    case 'reading':
      return buildReadingExercises(stage)
    default:
      return []
  }
}

/** Strip keys — what the API sends to the browser */
export function toClientExercises(keyed: KeyedExercise[]): ClientExercise[] {
  return keyed.map((k) => k.exercise)
}

export function gradeModule(
  stage: number,
  module: HskModuleKind,
  submissions: SubmittedAnswer[]
): GradeResult & { correctWords: string[]; wrongWords: string[] } {
  return gradeKeyed(buildModuleExercises(stage, module), submissions)
}

/** Grade a submission set against any keyed exercise list (DB or generated) */
export function gradeKeyed(
  keyed: KeyedExercise[],
  submissions: SubmittedAnswer[]
): GradeResult & { correctWords: string[]; wrongWords: string[] } {
  const review: ReviewRow[] = []
  let score = 0
  const correctWords: string[] = []
  const wrongWords: string[] = []

  for (const [i, k] of keyed.entries()) {
    const sub = submissions[i] ?? null
    const correct = isSubmissionEqual(sub, k.key, k.exercise)
    if (correct) score++
    if (k.word) {
      if (correct) correctWords.push(k.word)
      else wrongWords.push(k.word)
    }
    review.push({
      id: k.exercise.id,
      correct,
      note: correct ? 'Correct!' : `Correct answer: ${answerText(k.key, k.exercise)}`,
      exercise: k.exercise,
    })
  }

  const max = keyed.length
  const percent = max > 0 ? Math.round((score / max) * 100) : 0
  return { score, max, percent, passed: percent >= HSK_PASS_PERCENT, review, correctWords, wrongWords }
}

// ---------------------------------------------------------------------------
// Progress model — the shape lives in CLIENT-SAFE progress-utils.ts (guests
// reuse the same helpers for their temporary local progress); nothing here.
// ---------------------------------------------------------------------------
