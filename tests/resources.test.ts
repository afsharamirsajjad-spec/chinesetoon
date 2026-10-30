/// <reference types="bun-types" />
// ---------------------------------------------------------------------------
// تست‌های منطق منابع عمومی دانلودی (src/lib/resources.ts) — اجرا: `bun test tests/`
// ---------------------------------------------------------------------------

import { describe, expect, test } from 'bun:test'
import {
  RESOURCE_EXTENSIONS,
  RESOURCE_MIME_BY_EXT,
  resourceExtensionOf,
  sanitizeResourceName,
  sanitizeResourceTitle,
  sanitizeResourceDescription,
  formatResourceSize,
  MAX_RESOURCE_FORM_BYTES,
  MAX_RESOURCE_CLIENT_BYTES,
} from '../src/lib/resources'

describe('resources — پسوندهای مجاز', () => {
  test('پسوندهای سند/کتاب/رسانه پذیرفته می‌شوند (بزرگ/کوچک)', () => {
    expect(resourceExtensionOf('HSK1.pdf')).toBe('pdf')
    expect(resourceExtensionOf('book.EPUB')).toBe('epub')
    expect(resourceExtensionOf('audio track.MP3')).toBe('mp3')
    expect(resourceExtensionOf('سخنرانی.mp4')).toBe('mp4')
    expect(resourceExtensionOf('sheet.xlsx')).toBe('xlsx')
  })

  test('اجرایی/اسکریپت/HTML/بدون پسوند → رد', () => {
    expect(resourceExtensionOf('virus.exe')).toBe(null)
    expect(resourceExtensionOf('script.sh')).toBe(null)
    expect(resourceExtensionOf('page.html')).toBe(null)
    expect(resourceExtensionOf('archive.tar.gz')).toBe(null)
    expect(resourceExtensionOf('noextension')).toBe(null)
    expect(resourceExtensionOf('')).toBe(null)
  })

  test('هر پسوند مجاز MIME دارد و برعکس', () => {
    for (const ext of RESOURCE_EXTENSIONS) {
      expect(RESOURCE_MIME_BY_EXT[ext]).toContain('/')
    }
  })
})

describe('resources — پاک‌سازی ورودی‌ها', () => {
  test('نام نمایشی: مسیر حذف و کاراکترهای ناامن جایگزین می‌شوند', () => {
    expect(sanitizeResourceName('../../etc/passwd')).toBe('passwd')
    expect(sanitizeResourceName('my book (2024).pdf')).toBe('my book (2024).pdf')
    expect(sanitizeResourceName('')).toBe('resource')
  })

  test('عنوان و توضیح: کنترل‌کاراکتر حذف و سقف طول اعمال می‌شود', () => {
    expect(sanitizeResourceTitle('  Book\u0000x  ')).toBe('Book x')
    expect(sanitizeResourceDescription('x'.repeat(2000)).length).toBe(1000)
    expect(sanitizeResourceTitle('   ')).toBe('')
  })
})

describe('resources — سقف‌ها و نمایش اندازه', () => {
  test('سقف multipart زیر سقف بدنهٔ Vercel و کوچک‌تر از مسیر Blob مستقیم', () => {
    expect(MAX_RESOURCE_FORM_BYTES).toBe(4 * 1024 * 1024)
    expect(MAX_RESOURCE_CLIENT_BYTES).toBeGreaterThan(MAX_RESOURCE_FORM_BYTES)
  })

  test('نمایش خوانا برای اندازه', () => {
    expect(formatResourceSize(0)).toBe('0 KB')
    expect(formatResourceSize(500 * 1024)).toBe('500 KB')
    expect(formatResourceSize(2 * 1024 * 1024)).toBe('2 MB')
    expect(formatResourceSize(1.5 * 1024 * 1024)).toBe('1.5 MB')
  })
})
