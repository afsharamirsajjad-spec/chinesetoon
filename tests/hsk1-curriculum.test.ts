/// <reference types="bun-types" />
// ---------------------------------------------------------------------------
// HSK 1 curriculum integrity tests (bun test tests/)
//
// These enforce the promises the product makes to learners:
//   • exactly 150 unique words (the official HSK 1 list), 15 per stage
//   • reading passages never use characters not yet taught (plus textbook
//     proper names) — no random/advanced vocabulary sneaks in
//   • every one of the 40 module exercise sets has exactly 10 questions and
//     every question has a VALID, derivable answer key
//   • grading is correct (all-correct → 100%, empty → 0%)
//   • stage unlocking requires ALL four modules of the previous stage
// ---------------------------------------------------------------------------

import { describe, expect, test } from 'bun:test'
import { HSK1_STAGES, HSK1_TOTAL_WORDS, getHsk1Stage } from '../src/lib/practice/hsk/content'
import { STAGE_WORDS, ALL_WORDS } from '../src/lib/practice/hsk/words'
import { STAGE_GRAMMAR_EXERCISES, STAGE_READING_QUESTIONS } from '../src/lib/practice/hsk/exercises'
import {
  buildModuleExercises,
  gradeModule,
  toClientExercises,
} from '../src/lib/practice/hsk/builder'
import {
  computeSummary,
  emptyProgress,
  isStageUnlocked,
  mergeAttempt,
} from '../src/lib/practice/hsk/progress-utils'
import { HSK_MODULES, HSK_STAGE_COUNT, type SubmittedAnswer } from '../src/lib/practice/hsk/types'

const PROPER_NAME_CHARS = new Set([...'玛丽大卫小明王李张陈'])

const PINYIN_ALLOWED = /^[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ\s'’]+$/
const PINYIN_PUNCT = /[.,!?;:—…。，！？、：]/g

function hanziOf(text: string): string[] {
  return [...text].filter((ch) => /\p{Script=Han}/u.test(ch))
}

describe('HSK 1 vocabulary coverage', () => {
  test('10 stages × 15 words = 150, all unique', () => {
    expect(STAGE_WORDS.length).toBe(10)
    for (const words of STAGE_WORDS) {
      expect(words.length).toBe(15)
    }
    expect(HSK1_TOTAL_WORDS).toBe(150)
    const hanziSet = new Set(ALL_WORDS.map((w) => w.hanzi))
    expect(hanziSet.size).toBe(150)
  })

  test('every word has hanzi, tone-marked pinyin, meaning and a complete example', () => {
    for (const w of ALL_WORDS) {
      expect(w.hanzi.length).toBeGreaterThan(0)
      expect(PINYIN_ALLOWED.test(w.pinyin)).toBe(true)
      expect(w.meaning.length).toBeGreaterThan(0)
      expect(w.example.length).toBeGreaterThan(0)
      expect(PINYIN_ALLOWED.test(w.examplePinyin.replace(PINYIN_PUNCT, ''))).toBe(true)
      expect(w.exampleEnglish.length).toBeGreaterThan(0)
    }
  })

  test('spot-check: the official list essentials are all present', () => {
    const hanzi = new Set(ALL_WORDS.map((w) => w.hanzi))
    for (const essential of [
      '你', '我', '他', '她', '我们', '这', '那', '谁', '什么', '多少', '几', '怎么', '怎么样',
      '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '岁', '个', '本', '些', '块',
      '不', '很', '太', '都', '一点儿', '和', '在', '的', '了', '吗', '呢', '喂',
      '是', '有', '看', '听', '说', '读', '写', '看见', '叫', '来', '回', '去', '吃', '喝',
      '睡觉', '打电话', '做', '买', '开', '坐', '住', '学习', '工作', '下雨', '爱', '喜欢',
      '想', '认识', '会', '能', '好', '大', '小', '多', '少', '冷', '热', '高兴', '漂亮',
      '没有', '不客气', '没关系', '对不起', '谢谢', '再见', '请',
      '中国', '北京', '学校', '饭店', '商店', '医院', '老师', '学生', '同学', '朋友', '医生',
      '先生', '小姐', '衣服', '水', '菜', '米饭', '水果', '苹果', '茶', '杯子', '钱', '飞机',
      '出租车', '电视', '电脑', '电影', '天气', '猫', '狗', '东西', '人', '名字', '书', '汉语',
      '汉语', '字', '桌子', '椅子', '家', '今天', '明天', '昨天', '上午', '中午', '下午', '年', '月',
      '号', '星期', '点', '分钟', '现在', '时候', '上', '下', '前面', '后面', '里', '哪儿',
    ]) {
      expect(hanzi.has(essential)).toBe(true)
    }
  })
})

describe('HSK 1 stage content completeness', () => {
  test('every stage has grammar, pronunciation and reading content', () => {
    for (const stage of HSK1_STAGES) {
      expect(stage.grammar.length).toBeGreaterThanOrEqual(2)
      expect(stage.grammar.length).toBeLessThanOrEqual(3)
      for (const g of stage.grammar) {
        expect(g.explanation.length).toBeGreaterThan(30)
        expect(g.structure.length).toBeGreaterThan(3)
        expect(g.examples.length).toBeGreaterThanOrEqual(3)
        expect(g.mistakes.length).toBeGreaterThanOrEqual(1)
      }
      expect(stage.pronunciation.toneDemos.length).toBe(4)
      expect(stage.pronunciation.listeningWords.length).toBeGreaterThanOrEqual(5)
      expect(stage.pronunciation.minimalPairs.length).toBeGreaterThanOrEqual(2)
      expect(stage.readings.length).toBe(2)
      for (const passage of stage.readings) {
        expect(passage.lines.length).toBeGreaterThanOrEqual(4)
        expect(passage.notes?.length ?? 0).toBeGreaterThanOrEqual(2)
      }
      expect(STAGE_GRAMMAR_EXERCISES[stage.stage - 1].length).toBe(6)
      expect(STAGE_READING_QUESTIONS[stage.stage - 1].length).toBe(2)
      for (const qs of STAGE_READING_QUESTIONS[stage.stage - 1]) {
        expect(qs.length).toBe(5)
      }
    }
  })

  test('authored questions follow the correct-first convention (answer derivable)', () => {
    for (const stageQs of STAGE_GRAMMAR_EXERCISES) {
      for (const q of stageQs) {
        const opts = q.options ?? []
        expect(opts.length).toBeGreaterThanOrEqual(3)
        expect(new Set(opts).size).toBe(opts.length)
      }
    }
    for (const stageQs of STAGE_READING_QUESTIONS) {
      for (const passage of stageQs) {
        for (const q of passage) {
          if (q.kind === 'truefalse') {
            expect(q.options).toEqual(['True', 'False'])
          } else if (q.kind === 'match') {
            const left = q.matchLeft ?? []
            const right = q.matchOptions ?? []
            expect(left.length).toBeGreaterThanOrEqual(3)
            expect(left.length).toBe(right.length)
            expect(new Set(right).size).toBe(right.length)
          } else {
            const opts = q.options ?? []
            expect(opts.length).toBeGreaterThanOrEqual(3)
            expect(new Set(opts).size).toBe(opts.length)
          }
        }
      }
    }
  })

  test('reading passages only use characters taught up to that stage (+ textbook names)', () => {
    for (const stage of HSK1_STAGES) {
      const taught = new Set(
        HSK1_STAGES.slice(0, stage.stage).flatMap((s) => s.words.flatMap((w) => [...w.hanzi]))
      )
      for (const passage of stage.readings) {
        for (const line of passage.lines) {
          for (const ch of hanziOf(line.hanzi)) {
            expect(taught.has(ch) || PROPER_NAME_CHARS.has(ch)).toBe(true)
          }
        }
        for (const note of passage.notes ?? []) {
          for (const ch of hanziOf(note.word)) {
            expect(taught.has(ch) || PROPER_NAME_CHARS.has(ch)).toBe(true)
          }
        }
      }
    }
  })
})

describe('exercise builder — determinism and answer keys', () => {
  test('40 module sets exist, each with exactly 10 exercises and unique ids', () => {
    for (let stage = 1; stage <= HSK_STAGE_COUNT; stage++) {
      for (const mod of HSK_MODULES) {
        const keyed = buildModuleExercises(stage, mod)
        expect(keyed.length).toBe(10)
        const ids = keyed.map((k) => k.exercise.id)
        expect(new Set(ids).size).toBe(10)
      }
    }
  })

  test('building twice gives byte-identical exercise sets (refresh-safe)', () => {
    for (let stage = 1; stage <= HSK_STAGE_COUNT; stage++) {
      for (const mod of HSK_MODULES) {
        const a = JSON.stringify(toClientExercises(buildModuleExercises(stage, mod)))
        const b = JSON.stringify(toClientExercises(buildModuleExercises(stage, mod)))
        expect(a).toBe(b)
      }
    }
  })

  test('client view never contains an answer field', () => {
    for (let stage = 1; stage <= HSK_STAGE_COUNT; stage++) {
      for (const mod of HSK_MODULES) {
        for (const ex of toClientExercises(buildModuleExercises(stage, mod))) {
          const json = JSON.stringify(ex)
          expect(json.includes('"key"')).toBe(false)
          expect(json.includes('"answer"')).toBe(false)
        }
      }
    }
  })

  test('every answer key is valid for its question shape', () => {
    for (let stage = 1; stage <= HSK_STAGE_COUNT; stage++) {
      for (const mod of HSK_MODULES) {
        for (const { exercise: ex, key } of buildModuleExercises(stage, mod)) {
          if (key.t === 'index') {
            expect(ex.options?.length ?? 0).toBeGreaterThan(key.value)
          } else if (key.t === 'match') {
            expect(ex.matchLeft?.length).toBe(key.value.length)
            const seen = new Set(key.value)
            expect(seen.size).toBe(key.value.length) // bijective pairing
            for (const v of key.value) expect((ex.options?.length ?? 0)).toBeGreaterThan(v)
          } else {
            // order — key is a permutation of tile indices that rebuilds the sentence
            expect(ex.tiles?.length).toBe(key.value.length)
            const sorted = [...key.value].sort((a, b) => a - b)
            expect(sorted).toEqual(key.value.map((_, i) => i))
            // the displayed order must NOT already be the solution
            const solved = key.value.every((tileIdx, pos) => tileIdx === pos)
            expect(solved).toBe(false)
          }
        }
      }
    }
  })

  test('multiple-choice options never repeat within a question', () => {
    for (let stage = 1; stage <= HSK_STAGE_COUNT; stage++) {
      for (const mod of HSK_MODULES) {
        for (const { exercise: ex } of buildModuleExercises(stage, mod)) {
          if (ex.options) expect(new Set(ex.options).size).toBe(ex.options.length)
        }
      }
    }
  })
})

describe('grading', () => {
  test('submitting every correct answer scores 100% and passes', () => {
    for (let stage = 1; stage <= HSK_STAGE_COUNT; stage++) {
      for (const mod of HSK_MODULES) {
        const keyed = buildModuleExercises(stage, mod)
        const answers = keyed.map((k) => (k.key.t === 'index' ? k.key.value : [...k.key.value]))
        const result = gradeModule(stage, mod, answers)
        expect(result.score).toBe(10)
        expect(result.percent).toBe(100)
        expect(result.passed).toBe(true)
        expect(result.review.every((r) => r.correct)).toBe(true)
      }
    }
  })

  test('submitting nothing scores 0% and fails', () => {
    for (let stage = 1; stage <= HSK_STAGE_COUNT; stage++) {
      for (const mod of HSK_MODULES) {
        const result = gradeModule(stage, mod, new Array(10).fill(null))
        expect(result.score).toBe(0)
        expect(result.percent).toBe(0)
        expect(result.passed).toBe(false)
      }
    }
  })

  test('review reveals the correct answer after grading (never before)', () => {
    const result = gradeModule(1, 'vocabulary', new Array(10).fill(null))
    for (const row of result.review) {
      expect(row.note.startsWith('Correct answer:')).toBe(true)
      expect(row.note.length).toBeGreaterThan('Correct answer:'.length)
    }
  })

  test('the 80% pass line is enforced exactly', () => {
    const keyed = buildModuleExercises(1, 'grammar')
    const answers: SubmittedAnswer[] = keyed.map((k) => (k.key.t === 'index' ? k.key.value : [...k.key.value]))
    // 7/10 = 70% → fail; 8/10 = 80% → pass
    answers[0] = null
    answers[1] = null
    answers[2] = null
    expect(gradeModule(1, 'grammar', answers).passed).toBe(false)
    answers[2] = keyed[2].key.t === 'index' ? keyed[2].key.value : [...keyed[2].key.value]
    expect(gradeModule(1, 'grammar', answers).percent).toBe(80)
    expect(gradeModule(1, 'grammar', answers).passed).toBe(true)
  })

  test('vocabulary grading reports per-word review stats', () => {
    const keyed = buildModuleExercises(2, 'vocabulary')
    const answers = keyed.map((k) => (k.key.t === 'index' ? k.key.value : [...k.key.value]))
    const result = gradeModule(2, 'vocabulary', answers)
    expect(result.correctWords.length).toBeGreaterThan(0)
    expect(result.wrongWords.length).toBe(0)
  })
})

describe('stage unlocking and progress math', () => {
  test('stage 1 unlocked, everything else locked on a fresh account', () => {
    const progress = emptyProgress()
    expect(isStageUnlocked(progress, 1)).toBe(true)
    expect(isStageUnlocked(progress, 2)).toBe(false)
    const summary = computeSummary(progress)
    expect(summary.overallPercent).toBe(0)
    expect(summary.completedStages).toBe(0)
    expect(summary.currentStage).toBe(1)
    expect(summary.unlockedUpTo).toBe(1)
  })

  test('a single passed module does NOT unlock the next stage', () => {
    let progress = emptyProgress()
    progress = mergeAttempt(progress, {
      stage: 1, module: 'vocabulary', percent: 100, passed: true, at: new Date().toISOString(),
    })
    expect(isStageUnlocked(progress, 2)).toBe(false)
    expect(progress.stages['1'].modules.vocabulary?.completed).toBe(true)
  })

  test('all four modules of stage 1 unlock stage 2', () => {
    let progress = emptyProgress()
    for (const mod of HSK_MODULES) {
      progress = mergeAttempt(progress, {
        stage: 1, module: mod, percent: 90, passed: true, at: new Date().toISOString(),
      })
    }
    expect(isStageUnlocked(progress, 2)).toBe(true)
    expect(isStageUnlocked(progress, 3)).toBe(false)
    const summary = computeSummary(progress)
    expect(summary.completedStages).toBe(1)
    expect(summary.completedModules).toBe(4)
    expect(summary.overallPercent).toBe(10)
    expect(summary.unlockedUpTo).toBe(2)
    expect(summary.currentStage).toBe(2)
  })

  test('a failed attempt (below 80%) never completes a module', () => {
    let progress = emptyProgress()
    progress = mergeAttempt(progress, {
      stage: 1, module: 'grammar', percent: 60, passed: false, at: new Date().toISOString(),
    })
    expect(progress.stages['1'].modules.grammar?.completed).toBe(false)
    expect(progress.stages['1'].modules.grammar?.bestPercent).toBe(60)
  })

  test('best score is kept across retakes and completion persists', () => {
    let progress = emptyProgress()
    progress = mergeAttempt(progress, { stage: 1, module: 'reading', percent: 100, passed: true, at: 't1' })
    progress = mergeAttempt(progress, { stage: 1, module: 'reading', percent: 50, passed: false, at: 't2' })
    const reading = progress.stages['1'].modules.reading
    expect(reading?.bestPercent).toBe(100)
    expect(reading?.completed).toBe(true)
    expect(reading?.attempts).toBe(2)
  })

  test('completing everything gives 100% and stage 10 as current', () => {
    let progress = emptyProgress()
    for (let s = 1; s <= HSK_STAGE_COUNT; s++) {
    for (const mod of HSK_MODULES) {
      progress = mergeAttempt(progress, { stage: s, module: mod, percent: 100, passed: true, at: 't' })
    }
    }
    const summary = computeSummary(progress)
    expect(summary.overallPercent).toBe(100)
    expect(summary.completedStages).toBe(10)
    expect(summary.currentStage).toBe(10)
  })
})

describe('content helpers', () => {
  test('getHsk1Stage validates the stage number', () => {
    expect(getHsk1Stage(1)?.stage).toBe(1)
    expect(getHsk1Stage(10)?.stage).toBe(10)
    expect(getHsk1Stage(0)).toBe(null)
    expect(getHsk1Stage(11)).toBe(null)
  })
})
