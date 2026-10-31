// ---------------------------------------------------------------------------
// 📚 HSK DB-first content layer (SERVER-ONLY)
//
// The admin panel is the source of truth for stages/words/grammar/
// pronunciation/readings. Every loader falls back to the bundled curriculum
// when the DB has no rows for that level yet (fresh installs, DB hiccup) so
// the site never shows an empty course.
//
// All JSON columns are parsed defensively — a corrupted row degrades to an
// empty list, never a 500 on the student-facing pages.
// ---------------------------------------------------------------------------

import { db } from '@/lib/db'
import { HSK1_STAGES, getHsk1Stage, HSK1_TOTAL_WORDS, HSK_STAGE_COUNT } from '@/lib/practice/hsk/content'
import { HSK_SYLLABUS_VERSION } from '@/lib/hsk-seed'
import type { GrammarExample, GrammarMistake, HskStageMeta, PronunciationLesson, ReadingLine } from '@/lib/practice/hsk/types'

export { HSK_STAGE_COUNT }

export const HSK_LEVELS = ['hsk1', 'hsk2', 'hsk3'] as const
export type HskLevelKey = (typeof HSK_LEVELS)[number]

export const HSK_LEVEL_LABELS: Record<HskLevelKey, string> = {
  hsk1: 'HSK 1',
  hsk2: 'HSK 2',
  hsk3: 'HSK 3',
}

function parseJsonArray<T>(raw: string | null | undefined): T[] {
  if (!raw) return []
  try {
    const v = JSON.parse(raw)
    return Array.isArray(v) ? (v as T[]) : []
  } catch {
    return []
  }
}

export interface StageOverview {
  stageNumber: number
  title: string
  description: string
  wordCount: number
  grammarCount: number
  readingCount: number
  published: boolean
  manuallyUnlocked: boolean
  source: 'db' | 'static'
}

export interface LevelOverview {
  level: HskLevelKey
  source: 'db' | 'static'
  syllabusVersion: string
  stages: StageOverview[]
  totalWords: number
}

/** Overview of one level's stages — DB first, static fallback */
export async function loadLevelOverview(level: HskLevelKey): Promise<LevelOverview> {
  if (level === 'hsk1') {
    try {
      const stages = await db.hskStage.findMany({
        where: { level: 'hsk1' },
        orderBy: { stageNumber: 'asc' },
        include: {
          _count: { select: { words: true, grammar: true, readings: true } },
        },
      })
      if (stages.length > 0) {
        return {
          level,
          source: 'db',
          syllabusVersion: HSK_SYLLABUS_VERSION,
          totalWords: stages.reduce((n, s) => n + s._count.words, 0),
          stages: stages.map((s) => ({
            stageNumber: s.stageNumber,
            title: s.title,
            description: s.description,
            wordCount: s._count.words,
            grammarCount: s._count.grammar,
            readingCount: s._count.readings,
            published: s.published,
            manuallyUnlocked: s.manuallyUnlocked,
            source: 'db' as const,
          })),
        }
      }
    } catch (e) {
      console.error('[loadLevelOverview] db failed, using static fallback:', e instanceof Error ? e.message : e)
    }
    return {
      level,
      source: 'static',
      syllabusVersion: HSK_SYLLABUS_VERSION,
      totalWords: HSK1_TOTAL_WORDS,
      stages: HSK1_STAGES.map((s) => ({
        stageNumber: s.stage,
        title: s.title,
        description: s.description,
        wordCount: s.words.length,
        grammarCount: s.grammar.length,
        readingCount: s.readings.length,
        published: true,
        manuallyUnlocked: false,
        source: 'static' as const,
      })),
    }
  }
  // hsk2 / hsk3 — DB content when the admin creates it, otherwise Coming Soon
  try {
    const stages = await db.hskStage.findMany({
      where: { level },
      orderBy: { stageNumber: 'asc' },
      include: { _count: { select: { words: true, grammar: true, readings: true } } },
    })
    if (stages.length > 0) {
      return {
        level,
        source: 'db',
        syllabusVersion: 'Admin-managed curriculum',
        totalWords: stages.reduce((n, s) => n + s._count.words, 0),
        stages: stages.map((s) => ({
          stageNumber: s.stageNumber,
          title: s.title,
          description: s.description,
          wordCount: s._count.words,
          grammarCount: s._count.grammar,
          readingCount: s._count.readings,
          published: s.published,
          manuallyUnlocked: s.manuallyUnlocked,
          source: 'db' as const,
        })),
      }
    }
  } catch {
    // fall through to coming-soon
  }
  return { level, source: 'static', syllabusVersion: '', stages: [], totalWords: 0 }
}

/** Full teaching content of one stage — DB first, static fallback (hsk1) */
export async function loadStageContent(level: HskLevelKey, stageNumber: number): Promise<HskStageMeta | null> {
  if (level === 'hsk1') {
    try {
      const row = await db.hskStage.findUnique({
        where: { level_stageNumber: { level: 'hsk1', stageNumber } },
        include: {
          words: { where: { published: true }, orderBy: { sortOrder: 'asc' } },
          grammar: { where: { published: true }, orderBy: { sortOrder: 'asc' } },
          pronunciations: { where: { published: true }, orderBy: { sortOrder: 'asc' } },
          readings: { where: { published: true }, orderBy: { sortOrder: 'asc' } },
        },
      })
      if (row) {
        const pron = row.pronunciations[0]
        const pronunciation: PronunciationLesson = {
          title: pron?.title ?? 'Pronunciation',
          intro: pron?.intro ?? '',
          sections: parseJsonArray(pron?.sections),
          // pronunciation listening drills: when the admin has not authored
          // dedicated drills, reuse the stage vocabulary for word listening
          toneDemos: [],
          listeningWords: row.words.slice(0, 6).map((w) => ({
            hanzi: w.hanzi,
            pinyin: w.pinyin,
            meaning: w.meaning,
          })),
          minimalPairs: [],
        }
        return {
          stage: row.stageNumber,
          title: row.title,
          description: row.description,
          words: row.words.map((w) => ({
            hanzi: w.hanzi,
            pinyin: w.pinyin,
            meaning: w.meaning,
            category: w.category as HskStageMeta['words'][number]['category'],
            example: w.example,
            examplePinyin: w.examplePinyin,
            exampleEnglish: w.exampleEnglish,
          })),
          grammar: row.grammar.map((g) => ({
            id: g.id,
            title: g.title,
            explanation: g.explanation,
            structure: g.structure,
            examples: parseJsonArray<GrammarExample>(g.examples),
            mistakes: parseJsonArray<GrammarMistake>(g.mistakes),
          })),
          pronunciation,
          readings: row.readings.map((r) => ({
            id: r.id,
            title: r.title,
            form: r.form === 'dialogue' ? 'dialogue' : 'text',
            lines: parseJsonArray<ReadingLine>(r.lines),
            notes: parseJsonArray(r.notes),
          })),
        }
      }
    } catch (e) {
      console.error('[loadStageContent] db failed, using static fallback:', e instanceof Error ? e.message : e)
    }
    return getHsk1Stage(stageNumber)
  }
  // hsk2 / hsk3 — DB only (no bundled curriculum)
  try {
    const row = await db.hskStage.findUnique({
      where: { level_stageNumber: { level, stageNumber } },
      include: {
        words: { where: { published: true }, orderBy: { sortOrder: 'asc' } },
        grammar: { where: { published: true }, orderBy: { sortOrder: 'asc' } },
        pronunciations: { where: { published: true }, orderBy: { sortOrder: 'asc' } },
        readings: { where: { published: true }, orderBy: { sortOrder: 'asc' } },
      },
    })
    if (!row) return null
    const pron = row.pronunciations[0]
    return {
      stage: row.stageNumber,
      title: row.title,
      description: row.description,
      words: row.words.map((w) => ({
        hanzi: w.hanzi,
        pinyin: w.pinyin,
        meaning: w.meaning,
        category: w.category as HskStageMeta['words'][number]['category'],
        example: w.example,
        examplePinyin: w.examplePinyin,
        exampleEnglish: w.exampleEnglish,
      })),
      grammar: row.grammar.map((g) => ({
        id: g.id,
        title: g.title,
        explanation: g.explanation,
        structure: g.structure,
        examples: parseJsonArray<GrammarExample>(g.examples),
        mistakes: parseJsonArray<GrammarMistake>(g.mistakes),
      })),
      pronunciation: {
        title: pron?.title ?? 'Pronunciation',
        intro: pron?.intro ?? '',
        sections: parseJsonArray(pron?.sections),
        toneDemos: [],
        listeningWords: row.words.slice(0, 6).map((w) => ({ hanzi: w.hanzi, pinyin: w.pinyin, meaning: w.meaning })),
        minimalPairs: [],
      },
      readings: row.readings.map((r) => ({
        id: r.id,
        title: r.title,
        form: r.form === 'dialogue' ? 'dialogue' : 'text',
        lines: parseJsonArray<ReadingLine>(r.lines),
        notes: parseJsonArray(r.notes),
      })),
    }
  } catch {
    return null
  }
}

