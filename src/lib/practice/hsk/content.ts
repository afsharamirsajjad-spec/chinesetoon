// ---------------------------------------------------------------------------
// 📚 HSK 1 curriculum assembly — CLIENT-SAFE
//
// Assembles the teaching content for all 10 stages (words, grammar lessons,
// pronunciation lessons, reading passages). Contains NO exercise questions
// and NO answer keys:
//   • authored questions live in the SERVER-ONLY exercises.ts
//   • exercise generation + grading live in the SERVER-ONLY builder.ts
// Client components may import anything from this file.
// ---------------------------------------------------------------------------

import { STAGE_WORDS } from './words'
import { STAGE_GRAMMAR } from './grammar'
import { STAGE_PRONUNCIATION } from './pronunciation'
import { STAGE_READINGS } from './readings'
import { HSK_MODULES, HSK_STAGE_COUNT, type HskStageMeta, type HskModuleKind } from './types'

export const HSK1_STAGE_META: Array<{ title: string; description: string }> = [
  {
    title: 'Hello! First Words',
    description: 'Greetings, names and your very first Chinese conversation with 是, 叫 and 吗 questions.',
  },
  {
    title: 'People Around You',
    description: 'Family and friends — 这/那, asking 谁 with 的 for possession and 都 for “all”.',
  },
  {
    title: 'Numbers, Age & Dates',
    description: 'Count from one to ten, say how old you are and read Chinese dates.',
  },
  {
    title: 'Time & Days',
    description: 'Clock times, days of the week and the two key verbs 在 (to be at) and 去 (to go).',
  },
  {
    title: 'Places & Positions',
    description: 'Where things are: 上/下/里/前面/后面, cities and shops, and questions with 哪儿.',
  },
  {
    title: 'Food & Drink',
    description: 'Ordering food and drinks — 有, 想 and buying 一点儿 of everything.',
  },
  {
    title: 'Study & Work',
    description: 'The language-learning verbs: read, write, speak, listen — plus measure word 本 and 看见.',
  },
  {
    title: 'Home & Weather',
    description: 'Living somewhere, going home, big/small/many/few, weather and pets.',
  },
  {
    title: 'Likes & Abilities',
    description: '爱 and 喜欢, what you 会 and what you 能, and meeting people politely.',
  },
  {
    title: 'Real Life & Review',
    description: 'Shopping and prices with 多少钱, phone calls, the 了 particle — and a full review.',
  },
]

function buildStages(): HskStageMeta[] {
  const stages: HskStageMeta[] = []
  for (let i = 0; i < HSK_STAGE_COUNT; i++) {
    const meta = HSK1_STAGE_META[i]
    stages.push({
      stage: i + 1,
      title: meta.title,
      description: meta.description,
      words: STAGE_WORDS[i],
      grammar: STAGE_GRAMMAR[i],
      pronunciation: STAGE_PRONUNCIATION[i],
      readings: STAGE_READINGS[i],
    })
  }
  return stages
}

export const HSK1_STAGES: HskStageMeta[] = buildStages()

export function getHsk1Stage(stage: number): HskStageMeta | null {
  if (!Number.isInteger(stage) || stage < 1 || stage > HSK1_STAGES.length) return null
  return HSK1_STAGES[stage - 1]
}

export const HSK1_TOTAL_WORDS = HSK1_STAGES.reduce((n, s) => n + s.words.length, 0)

export const HSK1_MODULE_INFO: Record<HskModuleKind, { label: string; blurb: string }> = {
  vocabulary: {
    label: 'Vocabulary',
    blurb: 'Learn the stage’s words with audio and examples, then test yourself.',
  },
  grammar: {
    label: 'Grammar',
    blurb: 'Simple explanations, structures and the mistakes to avoid.',
  },
  pronunciation: {
    label: 'Pronunciation',
    blurb: 'Pinyin, tones and listening drills with replayable audio.',
  },
  reading: {
    label: 'Reading',
    blurb: 'Short passages with pinyin, translation and comprehension questions.',
  },
}

export { HSK_MODULES, HSK_STAGE_COUNT }
