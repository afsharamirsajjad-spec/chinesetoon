/// <reference types="bun-types" />
// ---------------------------------------------------------------------------
// 🧪 تست‌های واحد اعتبارسنجی آپلود و صفحه‌بندی پرداخت‌ها — `bun test tests/`
// فقط توابع خالص (بدون دیتابیس/شبکه) — سریع و قابل‌اجرا در هر محیط
// ---------------------------------------------------------------------------

import { describe, expect, test } from 'bun:test'
import {
  detectImageType,
  isLegacyImageId,
  MAX_IMAGE_BYTES,
} from '../src/lib/images'
import { parsePaginationParams } from '../src/app/api/admin/payments/route'

// ---------- detectImageType — تشخیص magic bytes ----------

describe('detectImageType', () => {
  test('JPEG buffer → image/jpeg', () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01])
    expect(detectImageType(jpeg)?.mime).toBe('image/jpeg')
  })

  test('PNG buffer → image/png', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d])
    expect(detectImageType(png)?.mime).toBe('image/png')
  })

  test('WEBP buffer → image/webp', () => {
    const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP')])
    expect(detectImageType(webp)?.mime).toBe('image/webp')
  })

  test('GIF buffer → image/gif', () => {
    // هدر ۶بایتی GIF + descriptor صفحهٔ منطقی (فایل واقعی همیشه > ۱۲ بایت است)
    const gif = Buffer.concat([
      Buffer.from('GIF89a'.split('').map((c) => c.charCodeAt(0))),
      Buffer.from([0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00]), // width/height/packed/bg/index
    ])
    expect(detectImageType(gif)?.mime).toBe('image/gif')
  })

  test('SVG伪装成图片 → رد (null)', () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')
    expect(detectImageType(svg)).toBeNull()
  })

  test('HTML伪装成图片 → رد (null)', () => {
    const html = Buffer.from('<html><body>x</body></html>'.split('').map((c) => c.charCodeAt(0)))
    expect(detectImageType(html)).toBeNull()
  })

  test('buffer خیلی کوتاه → رد (null)', () => {
    expect(detectImageType(Buffer.from([0xff, 0xd8]))).toBeNull()
  })
})

// ---------- MAX_IMAGE_BYTES — زیر حد سرورلس Vercel ----------

describe('image size limits', () => {
  test('سقف ۴ مگابایت زیر حد 4.5MB بدنهٔ Vercel است', () => {
    expect(MAX_IMAGE_BYTES).toBeLessThanOrEqual(4 * 1024 * 1024)
    expect(MAX_IMAGE_BYTES).toBeGreaterThan(0)
  })
})

// ---------- isLegacyImageId — سازگاری URLهای قدیمی ----------

describe('isLegacyImageId', () => {
  test('۴۸ hex معتبر', () => {
    expect(isLegacyImageId('a'.repeat(48))).toBe(true)
  })
  test('شناسهٔ کوتاه/غیرhex/با پسوند → false', () => {
    expect(isLegacyImageId('short')).toBe(false)
    expect(isLegacyImageId('z'.repeat(48))).toBe(false)
    expect(isLegacyImageId(`${'a'.repeat(48)}.png`)).toBe(false)
    expect(isLegacyImageId('../etc/passwd')).toBe(false)
  })
})

// ---------- parsePaginationParams — صفحه‌بندی امن ----------

describe('parsePaginationParams', () => {
  const parse = (qs: string) => parsePaginationParams(new URLSearchParams(qs))

  test('مقادیر پیش‌فرض', () => {
    expect(parse('')).toEqual({ page: 1, pageSize: 25 })
  })
  test('مقادیر معتبر', () => {
    expect(parse('page=3&pageSize=50')).toEqual({ page: 3, pageSize: 50 })
  })
  test('صفحهٔ صفر/منفی → 1', () => {
    expect(parse('page=0').page).toBe(1)
    expect(parse('page=-4').page).toBe(1)
  })
  test('pageSize نامعتبر → پیش‌فرض 25', () => {
    expect(parse('pageSize=abc').pageSize).toBe(25)
  })
  test('pageSize غول‌آسا → سقف 100', () => {
    expect(parse('pageSize=99999').pageSize).toBe(100)
  })
  test('مقادیر NaN و اعشاری', () => {
    expect(parse('page=1.9&pageSizex=1').page).toBe(1)
    expect(parse('pageSize=2.9').pageSize).toBe(5) // min clamp 5
  })
})
