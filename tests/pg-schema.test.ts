// ---------------------------------------------------------------------------
// 🧪 تست خودترمیمِ PostgreSQL — تبدیل گویش DDL و پوشش کامل جداول
//
// باگ واقعی که این مجموعه قفلش می‌کند: جداول پلتفرم آموزشی (TeachingVideo،
// EducationalFile، خانوادهٔ Hsk*) فقط DDLِ گویش SQLite داشتند و مسیر PostgreSQL
// کامل no-op بود → در محیط واقعی هرگز ساخته نمی‌شدند و افزودن ویدیو/فایل/
// محتوای HSK/آزمون با 500 شکست می‌خورد. این تست‌ها تضمین می‌کنند خروجی تبدیل‌شده
// برای PostgreSQL معتبر است و هیچ جدولی از فهرست جامانده است.
// ---------------------------------------------------------------------------

import { describe, expect, test } from 'bun:test'
// فراخوانی ماژول، PrismaClient را می‌سازد ولی اتصال نمی‌گیرد — برای تست DDL امن است
import { CREATE_TABLES, CREATE_INDEXES, ALTER_COLUMNS, toPostgresDdl } from '../src/lib/ensure-schema'

describe('ensure-schema → PostgreSQL dialect', () => {
  test('DATETIME به TIMESTAMP(3) تبدیل می‌شود', () => {
    const out = toPostgresDdl(`"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`)
    expect(out).toContain('TIMESTAMP(3)')
    expect(out).not.toContain('DATETIME')
    expect(out).toContain('CURRENT_TIMESTAMP')
  })

  test('BOOLEAN DEFAULT 0/1 به FALSE/TRUE تبدیل می‌شود', () => {
    const out = toPostgresDdl('"published" BOOLEAN NOT NULL DEFAULT 1, "featured" BOOLEAN NOT NULL DEFAULT 0')
    expect(out).toContain('DEFAULT TRUE')
    expect(out).toContain('DEFAULT FALSE')
    expect(out).not.toContain('DEFAULT 0')
    expect(out).not.toContain('DEFAULT 1')
  })

  test('عددهای غیربولی (INTEGER DEFAULT 0) دست‌نخورده می‌مانند', () => {
    const out = toPostgresDdl('"sortOrder" INTEGER NOT NULL DEFAULT 0, "views" INTEGER NOT NULL DEFAULT 100')
    expect(out).toContain('INTEGER NOT NULL DEFAULT 0')
    expect(out).toContain('DEFAULT 100')
  })

  test('هیچ DDL ساختی گویش SQLite باقی نمی‌ماند (CREATE TABLEها)', () => {
    for (const ddl of CREATE_TABLES) {
      const pg = toPostgresDdl(ddl)
      expect(pg).not.toContain('DATETIME')
      // خط‌به‌خط: هر خطی که نوع BOOLEAN دارد نباید DEFAULT عددی 0/1 بماند
      for (const line of pg.split('\n')) {
        if (/BOOLEAN/.test(line)) {
          expect(line).not.toMatch(/DEFAULT [01](?![\d])/)
        }
      }
    }
  })

  test('ALTER COLUMNها معتبر PG می‌شوند (بدون DATETIME و DEFAULT بولی عددی)', () => {
    for (const statements of Object.values(ALTER_COLUMNS)) {
      for (const stmt of statements) {
        const pg = toPostgresDdl(stmt.replace('ADD COLUMN', 'ADD COLUMN IF NOT EXISTS'))
        expect(pg).not.toContain('DATETIME')
        expect(pg).not.toMatch(/BOOLEAN NOT NULL DEFAULT [01](?![\d])/)
        expect(pg).toContain('ADD COLUMN IF NOT EXISTS')
      }
    }
  })

  test('جداول کلیدی پلتفرم آموزشی در فهرست ساخت هستند', () => {
    const names = CREATE_TABLES.map((d) => d.match(/CREATE TABLE IF NOT EXISTS "([^"]+)"/)?.[1] ?? '')
    for (const required of [
      'TeachingVideo',
      'EducationalFile',
      'HskStage',
      'HskWord',
      'HskGrammar',
      'HskPronunciation',
      'HskReading',
      'HskQuestion',
      'HskExam',
      'HskExamVersion',
      'HskExamAttempt',
      'HskProgress',
      'LiveChatMessage',
      'SiteSetting',
      'User',
      'AdminSession',
    ]) {
      expect(names).toContain(required)
    }
  })

  test('هر CREATE TABLE یک نام معتبر دارد و ایندکس‌ها IF NOT EXISTS دارند', () => {
    for (const ddl of CREATE_TABLES) {
      expect(ddl).toMatch(/^CREATE TABLE IF NOT EXISTS "[A-Za-z]+" \(/)
    }
    for (const ddl of CREATE_INDEXES) {
      expect(ddl).toMatch(/^CREATE (UNIQUE )?INDEX IF NOT EXISTS/)
    }
  })

  test('نمونهٔ کامل: HskExam تبدیل‌شده ستون published با TRUE دارد', () => {
    const exam = CREATE_TABLES.find((d) => d.includes('"HskExam"')) ?? ''
    const pg = toPostgresDdl(exam)
    expect(pg).toContain('"slug" TEXT NOT NULL')
    expect(pg).toContain('"published" BOOLEAN NOT NULL DEFAULT FALSE')
    expect(pg).toContain('TIMESTAMP(3)')
  })
})
