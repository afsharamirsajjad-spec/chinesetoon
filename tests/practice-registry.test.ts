/// <reference types="bun-types" />
// ---------------------------------------------------------------------------
// تست‌های رجیستری هاب تمرین (src/lib/practice/registry.ts) — اجرا: `bun test tests/`
// تضمین می‌کند هر کارت /practice به یک مقصد واقعی و بدون کلید تکراری لینک است.
// ---------------------------------------------------------------------------

import { describe, expect, test } from 'bun:test'
import {
  PRACTICE_ACTIVITIES,
  PRACTICE_CATEGORIES,
  isKnownActivity,
} from '../src/lib/practice/registry'

// مسیرها/لنگرهای مجاز — لنگرها باید واقعاً در صفحهٔ مقصد وجود داشته باشند
// (درخواست مالک: فعالیت‌های تعاملی داخل خود /practice تعبیه شده‌اند —
//  idهای تزریق‌شده: #practice-daily-word/#practice-tone-trainer/
//  #practice-flashcards/#practice-level-quiz؛ فقط درس‌ها به /learn لینک‌اند)
const VALID_HREFS = new Set([
  '/',
  '/learn',
  '/classes',
  '/exams',
  '/practice/hsk1',
  '/practice#practice-daily-word',
  '/practice#practice-flashcards',
  '/practice#practice-tone-trainer',
  '/practice#practice-level-quiz',
])

describe('practice registry', () => {
  test('کلید فعالیت‌ها یکتاست', () => {
    const keys = PRACTICE_ACTIVITIES.map((a) => a.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  test('هر فعالیت به href واقعی لینک است (بدون لینک شکست)', () => {
    for (const a of PRACTICE_ACTIVITIES) {
      expect(VALID_HREFS.has(a.href)).toBe(true)
    }
  })

  test('دستهٔ هر فعالیت در فهرست دسته‌هاست', () => {
    const catKeys = new Set(PRACTICE_CATEGORIES.map((c) => c.key))
    for (const a of PRACTICE_ACTIVITIES) {
      expect(catKeys.has(a.category)).toBe(true)
    }
  })

  test('متادیتای لازم هر کارت پر است (عنوان/توضیح/سطح/زمان/اقدام)', () => {
    for (const a of PRACTICE_ACTIVITIES) {
      expect(a.title.length).toBeGreaterThan(3)
      expect(a.description.length).toBeGreaterThan(20)
      expect(a.level.length).toBeGreaterThan(0)
      expect(a.minutes).toBeGreaterThan(0)
      expect(a.action.length).toBeGreaterThan(3)
    }
  })

  test('isKnownActivity — کلیدهای واقعی پذیرفته و جعلی رد می‌شوند', () => {
    expect(isKnownActivity('hsk-course')).toBe(true)
    expect(isKnownActivity('daily-word')).toBe(true)
    expect(isKnownActivity('level-quiz')).toBe(true)
    expect(isKnownActivity('fake-activity')).toBe(false)
    expect(isKnownActivity('')).toBe(false)
  })
})
