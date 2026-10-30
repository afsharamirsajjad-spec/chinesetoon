/// <reference types="bun-types" />
// ---------------------------------------------------------------------------
// تست‌های منطق آزمون‌ها (src/lib/exams.ts) — پارس XML + نمره‌دهی
// اجرا: `bun test tests/`
// ---------------------------------------------------------------------------

import { describe, expect, test } from 'bun:test'
import {
  parseExamXml,
  gradeExam,
  safeParseExamQuestions,
  ExamParseError,
  type ExamQuestion,
} from '../src/lib/exams'

const VALID_XML = `<?xml version="1.0" encoding="UTF-8"?>
<exam slug="hsk-1-mock-1" title="HSK 1 Mock Exam 1" level="HSK 1" durationMin="40" passPercent="60" description="Full mock exam.">
  <question>
    <text>What does 你好 mean?</text>
    <option correct="true">Hello</option>
    <option>Goodbye</option>
    <option>Thanks</option>
    <option>Sorry</option>
  </question>
  <question>
    <text>Which pinyin matches 谢谢?</text>
    <option>zàijiàn</option>
    <option correct="true">xièxie</option>
  </question>
</exam>`

describe('parseExamXml — پارس و اعتبارسنجی', () => {
  test('XML سالم → مقادیر کامل با escape صحیح', () => {
    const x = parseExamXml(VALID_XML)
    expect(x.slug).toBe('hsk-1-mock-1')
    expect(x.title).toBe('HSK 1 Mock Exam 1')
    expect(x.level).toBe('HSK 1')
    expect(x.durationMin).toBe(40)
    expect(x.passPercent).toBe(60)
    expect(x.questions.length).toBe(2)
    expect(x.questions[0]).toEqual({
      q: 'What does 你好 mean?',
      options: ['Hello', 'Goodbye', 'Thanks', 'Sorry'],
      answer: 0,
    })
    expect(x.questions[1].answer).toBe(1)
  })

  test('کاراکترهای XML (ampersand/براکت) درست decode می‌شوند', () => {
    const x = parseExamXml(
      `<exam title="T"><question><text>A &amp; B &lt;雨&gt;</text><option correct="true">yes &amp; no</option><option>no</option></question></exam>`
    )
    expect(x.questions[0].q).toBe('A & B <雨>')
    expect(x.questions[0].options[0]).toBe('yes & no')
  })

  test('بدون slug → از عنوان slugify می‌شود', () => {
    const x = parseExamXml(`<exam title="HSK 2 Grammar! Quiz"><question><text>q</text><option correct="true">a</option><option>b</option></question></exam>`)
    expect(x.slug).toBe('hsk-2-grammar-quiz')
  })

  test('ریشهٔ اشتباه / خالی → ExamParseError', () => {
    expect(() => parseExamXml('')).toThrow(ExamParseError)
    expect(() => parseExamXml('<tests><q/></tests>')).toThrow(ExamParseError)
  })

  test('سؤال بدون متن / تک‌گزینه / بدون یا با دو پاسخ درست → خطای شماره‌دار', () => {
    expect(() =>
      parseExamXml(`<exam title="T"><question><option correct="true">a</option><option>b</option></question></exam>`)
    ).toThrow(/Question 1/)
    expect(() =>
      parseExamXml(`<exam title="T"><question><text>q</text><option correct="true">a</option></question></exam>`)
    ).toThrow(/at least two/)
    expect(() =>
      parseExamXml(`<exam title="T"><question><text>q</text><option>a</option><option>b</option></question></exam>`)
    ).toThrow(/exactly one/)
    expect(() =>
      parseExamXml(
        `<exam title="T"><question><text>q</text><option correct="true">a</option><option correct="true">b</option></question></exam>`
      )
    ).toThrow(/found 2/)
  })

  test('سؤال بدون گزینه / XML فاسد → ExamParseError', () => {
    expect(() => parseExamXml(`<exam title="T"></exam>`)).toThrow(ExamParseError)
    expect(() => parseExamXml('<exam title="T"><question>')).toThrow(ExamParseError)
  })
})

describe('gradeExam — نمره‌دهی سمت سرور', () => {
  const questions: ExamQuestion[] = [
    { q: 'q1', options: ['a', 'b', 'c'], answer: 1 },
    { q: 'q2', options: ['x', 'y'], answer: 0 },
    { q: 'q3', options: ['p', 'q', 'r', 's'], answer: 3 },
  ]

  test('همه درست → ۱۰۰٪ و قبولی', () => {
    const g = gradeExam(questions, [1, 0, 3], 60)
    expect(g.score).toBe(3)
    expect(g.maxScore).toBe(3)
    expect(g.percent).toBe(100)
    expect(g.passed).toBe(true)
    expect(g.correct).toEqual([true, true, true])
  })

  test('دو از سه → ۶۷٪ و قبولی؛ پاسخ‌های null/نامعتبر = نادرست', () => {
    const g = gradeExam(questions, [1, 0, 99], 60)
    expect(g.score).toBe(2)
    expect(g.percent).toBe(67)
    expect(g.passed).toBe(true)
    expect(g.correct).toEqual([true, true, false])

    const g2 = gradeExam(questions, [1, null, 'x' as unknown as number], 60)
    expect(g2.score).toBe(1)
    expect(g2.passed).toBe(false)
  })

  test('پاسخ‌های غیرآرایه → صفر', () => {
    const g = gradeExam(questions, undefined as unknown as unknown[], 60)
    expect(g.score).toBe(0)
    expect(g.percent).toBe(0)
    expect(g.passed).toBe(false)
  })

  test('آستانهٔ قبولی مرزی اعمال می‌شود', () => {
    // ۶۷٪ با آستانهٔ ۷۰ → مردود
    expect(gradeExam(questions, [1, 0, 99], 70).passed).toBe(false)
    // ۱۰۰٪ با آستانهٔ ۱۰۰ → قبول
    expect(gradeExam(questions, [1, 0, 3], 100).passed).toBe(true)
  })
})

describe('safeParseExamQuestions — JSON دیتابیس', () => {
  test('JSON سالم → آرایه؛ ردیف خراب → []؛ ردیف نامعتبر فیلتر می‌شود', () => {
    const good: ExamQuestion[] = [{ q: 'q', options: ['a', 'b'], answer: 1 }]
    expect(safeParseExamQuestions(JSON.stringify(good))).toEqual(good)
    expect(safeParseExamQuestions('not json')).toEqual([])
    const filtered = safeParseExamQuestions(
      JSON.stringify([good[0], { q: 'bad', options: ['a'], answer: 5 }, { nope: true }])
    )
    expect(filtered.length).toBe(1)
  })
})
