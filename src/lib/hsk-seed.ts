// ---------------------------------------------------------------------------
// 🌱 HSK curriculum seeding (SERVER-ONLY)
//
// The authored HSK 1 curriculum (150 verified words, grammar, pronunciation,
// readings) is seeded into the admin-managed tables ONCE — when the HskStage
// table has no hsk1 rows yet. From then on, the admin panel is the source of
// truth: editing stages/words/lessons there changes the website, and the
// static curriculum stays as a read-only fallback when the tables are empty.
//
// Idempotent and safe to run on every cold start (same pattern as the blog
// seeder): a failed/guest run leaves the tables untouched and the site falls
// back to the bundled curriculum.
// ---------------------------------------------------------------------------

import { db } from '@/lib/db'
import { HSK1_STAGES } from '@/lib/practice/hsk/content'

export const HSK_SYLLABUS_VERSION = 'HSK 2.0 (official 150-word list, 2010 standard)'

let seedPromise: Promise<{ seeded: boolean; stages: number }> | null = null

async function runSeed(): Promise<{ seeded: boolean; stages: number }> {
  const existing = await db.hskStage.count({ where: { level: 'hsk1' } })
  if (existing > 0) {
    return { seeded: false, stages: existing }
  }
  for (const stage of HSK1_STAGES) {
    await db.hskStage.create({
      data: {
        level: 'hsk1',
        stageNumber: stage.stage,
        title: stage.title,
        description: stage.description,
        published: true,
        manuallyUnlocked: false,
        words: {
          create: stage.words.map((w, i) => ({
            hanzi: w.hanzi,
            pinyin: w.pinyin,
            meaning: w.meaning,
            category: w.category,
            example: w.example,
            examplePinyin: w.examplePinyin,
            exampleEnglish: w.exampleEnglish,
            sortOrder: i,
            published: true,
          })),
        },
        grammar: {
          create: stage.grammar.map((g, i) => ({
            title: g.title,
            explanation: g.explanation,
            structure: g.structure,
            examples: JSON.stringify(g.examples),
            mistakes: JSON.stringify(g.mistakes),
            sortOrder: i,
            published: true,
          })),
        },
        pronunciations: {
          create: [
            {
              title: stage.pronunciation.title,
              intro: stage.pronunciation.intro,
              sections: JSON.stringify(stage.pronunciation.sections),
              sortOrder: 0,
              published: true,
            },
          ],
        },
        readings: {
          create: stage.readings.map((r, i) => ({
            title: r.title,
            form: r.form,
            lines: JSON.stringify(r.lines),
            notes: JSON.stringify(r.notes ?? []),
            sortOrder: i,
            published: true,
          })),
        },
      },
    })
  }
  return { seeded: true, stages: HSK1_STAGES.length }
}

/**
 * Seed the HSK 1 curriculum once. Concurrent cold starts share one promise;
 * failures are swallowed (the site falls back to the bundled curriculum) but
 * logged for diagnosis.
 */
export function ensureHskSeed(): Promise<{ seeded: boolean; stages: number }> {
  if (!seedPromise) {
    seedPromise = runSeed().catch((e) => {
      console.error('[hsk-seed] failed:', e instanceof Error ? e.message : e)
      seedPromise = null
      return { seeded: false, stages: 0 }
    })
  }
  return seedPromise
}
