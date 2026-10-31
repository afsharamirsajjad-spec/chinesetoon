// ---------------------------------------------------------------------------
// 📚 Structured HSK Practice — shared types (CLIENT-SAFE)
//
// This file and everything under src/lib/practice/hsk/content*.ts contain NO
// answer keys — they are safe to import from client components.
// Answer keys + grading live in:
//   • src/lib/practice/hsk/answers.ts   (authored keys for reading/grammar)
//   • src/lib/practice/hsk/builder.ts   (deterministic exercise generation)
// Both are SERVER-ONLY: they must never be imported by client code, or the
// answer keys would ship in the JS bundle (same trust model as /api/exams).
// ---------------------------------------------------------------------------

export const HSK_LEVELS = ['hsk1'] as const
export type HskLevel = (typeof HSK_LEVELS)[number]

export const HSK_MODULES = ['vocabulary', 'grammar', 'pronunciation', 'reading'] as const
export type HskModuleKind = (typeof HSK_MODULES)[number]

export const HSK_STAGE_COUNT = 10

/** Score (percent) a graded attempt must reach for a module to count as completed */
export const HSK_PASS_PERCENT = 80

export type WordCategory =
  | 'pronoun'
  | 'number'
  | 'measure'
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'particle'
  | 'other'

export interface HskWord {
  hanzi: string
  /** Pinyin with tone marks, space-separated syllables */
  pinyin: string
  meaning: string
  category: WordCategory
  example: string
  examplePinyin: string
  exampleEnglish: string
}

export interface GrammarExample {
  hanzi: string
  pinyin: string
  english: string
}

export interface GrammarMistake {
  wrong: string
  right: string
  note: string
}

export interface GrammarPoint {
  id: string
  title: string
  /** Simple English explanation for absolute beginners */
  explanation: string
  /** Structure formula, e.g. "Subject + 很 + Adjective" */
  structure: string
  examples: GrammarExample[]
  mistakes: GrammarMistake[]
}

export interface PronunciationItem {
  label: string
  note?: string
}

export interface ToneDemo {
  /** Single syllable used only as a sound demo (not HSK vocabulary) */
  hanzi: string
  pinyin: string
  tone: 1 | 2 | 3 | 4
  meaning: string
}

export interface MinimalPair {
  a: { hanzi: string; pinyin: string; meaning: string }
  b: { hanzi: string; pinyin: string; meaning: string }
  note: string
}

export interface PronunciationLesson {
  title: string
  intro: string
  sections: { title: string; body: string; items?: PronunciationItem[] }[]
  /** Listen → pick the tone (sound-demo syllables) */
  toneDemos: ToneDemo[]
  /** Listen → pick the word (drawn from taught HSK 1 words) */
  listeningWords: { hanzi: string; pinyin: string; meaning: string; toneOfFirstSyllable?: 1 | 2 | 3 | 4 }[]
  /** Hear one of the two — pick which (initial/final contrast) */
  minimalPairs: MinimalPair[]
}

export interface ReadingLine {
  hanzi: string
  pinyin: string
  english: string
}

export interface ReadingPassage {
  id: string
  title: string
  /** Chinese-only intro shown above the passage (e.g. "对话" / "短文") */
  form: 'dialogue' | 'text'
  lines: ReadingLine[]
  /** Vocabulary notes under the passage */
  notes?: { word: string; meaning: string }[]
}

export interface HskStageMeta {
  stage: number
  title: string
  description: string
  words: HskWord[]
  grammar: GrammarPoint[]
  pronunciation: PronunciationLesson
  readings: ReadingPassage[]
}

// ---------------------------------------------------------------------------
// Authored question (SERVER-ONLY — lives in exercises.ts, never imported by
// client code). Conventions that let the builder derive every answer key:
//   • mcq / fill: the CORRECT option is always `options[0]`; the builder
//     shuffles options deterministically (seeded by question id) and records
//     the shuffled index of the correct one as the key.
//   • match: `matchOptions[i]` is the correct pairing for `matchLeft[i]`;
//     the builder shuffles matchOptions deterministically and derives the key.
//   • order: generated from a known-correct sentence; the key is the tile
//     order that reproduces it.
// ---------------------------------------------------------------------------

export interface AuthoredQuestion {
  id: string
  kind: 'mcq' | 'truefalse' | 'fill' | 'match'
  prompt: string
  hanzi?: string
  pinyin?: string
  options?: string[]
  /** match: left items (prompts) — the user picks one of `options` for each */
  matchLeft?: string[]
  /** match: correct pairing pool, aligned by index with matchLeft */
  matchOptions?: string[]
}

// ---------------------------------------------------------------------------
// Exercise view models — what the API returns (never contains answer keys)
// ---------------------------------------------------------------------------

export type ExerciseKind = 'mcq' | 'truefalse' | 'fill' | 'match' | 'order' | 'listen'

/**
 * One generated/authored exercise as seen by the client.
 * `answer` is NEVER here — the server grades POST submissions.
 */
export interface ClientExercise {
  id: string
  kind: ExerciseKind
  prompt: string
  hanzi?: string
  pinyin?: string
  /** hanzi to speak through the TTS engine (listen exercises) */
  audio?: string
  /** uploaded audio (MP3/WAV) — played directly; TTS is the fallback */
  audioUrl?: string
  /** uploaded image (image-based questions) */
  imageUrl?: string
  options?: string[]
  /** match: left prompts, one answer (index into options) each */
  matchLeft?: string[]
  /** order: tiles in their (deterministically shuffled) display order */
  tiles?: string[]
  explanation?: string
}

/** What the client submits: one answer per exercise */
export type SubmittedAnswer = number | number[] | null

/** Per-question feedback returned by the server AFTER grading */
export interface ReviewRow {
  id: string
  correct: boolean
  /** human feedback — why the answer is right / what the right one is */
  note: string
  /** exercise payload again, so the client can re-render without refetch */
  exercise: ClientExercise
}

/** Server-graded result of one module attempt */
export interface GradeResult {
  score: number
  max: number
  percent: number
  passed: boolean
  review: ReviewRow[]
  /** vocabulary module only — per-word outcome for review stats */
  correctWords?: string[]
  wrongWords?: string[]
}

export interface ModuleProgress {
  bestPercent: number
  attempts: number
  completed: boolean
  completedAt: string | null
  lastAttemptAt: string | null
}

export interface StageProgress {
  modules: Partial<Record<HskModuleKind, ModuleProgress>>
}

export interface Hsk1ProgressSummary {
  version: 1
  stages: Record<number, StageProgress>
  /** last stage the user opened (1..10), for "continue" affordances */
  lastStage: number | null
  lastModule: HskModuleKind | null
  lastVisitAt: string | null
  /** per-word review stats for the vocabulary module (bounded to taught words) */
  vocabStats: Record<string, { seen: number; correct: number }>
}

export interface ProgressApiResponse {
  authenticated: boolean
  firstName?: string
  progress?: Hsk1ProgressSummary
  /** derived, server-computed convenience numbers */
  overallPercent?: number
  completedModules?: number
  completedStages?: number
  currentStage?: number
  unlockedUpTo?: number
}

export interface AttemptRecord {
  stage: number
  module: HskModuleKind
  percent: number
  passed: boolean
  at: string
}

/** Derived, server-computed convenience numbers (also computed client-side for guests) */
export interface ProgressSummary {
  overallPercent: number
  completedModules: number
  completedStages: number
  currentStage: number
  unlockedUpTo: number
}

/** One graded attempt to merge into the progress snapshot */
export interface AttemptInput {
  stage: number
  module: HskModuleKind
  percent: number
  passed: boolean
  at: string
  correctWords?: string[]
  wrongWords?: string[]
}
