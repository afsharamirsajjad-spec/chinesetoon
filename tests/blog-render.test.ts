/// <reference types="bun-types" />
// ---------------------------------------------------------------------------
// تست‌های پارسر قالب مقاله (src/lib/blog-format.ts) — منطق مشترک رندرکنندهٔ
// وبلاگ و اسکریپت‌های seed. اجرا: `bun test tests/`
// ---------------------------------------------------------------------------

import { describe, expect, test } from 'bun:test'
import { parseInline, parseTable, isInternalLink, countWords } from '../src/lib/blog-format'

// ---------- parseInline ----------

describe('parseInline', () => {
  test('متن ساده → یک توکن text', () => {
    expect(parseInline('hello world')).toEqual([{ type: 'text', text: 'hello world' }])
  })

  test('بولد', () => {
    expect(parseInline('a **bold** b')).toEqual([
      { type: 'text', text: 'a ' },
      { type: 'bold', text: 'bold' },
      { type: 'text', text: ' b' },
    ])
  })

  test('لینک داخلی', () => {
    const t = parseInline('see [our classes](/classes) now')
    expect(t).toEqual([
      { type: 'text', text: 'see ' },
      { type: 'link', text: 'our classes', href: '/classes' },
      { type: 'text', text: ' now' },
    ])
    expect(isInternalLink((t[1] as { href: string }).href)).toBe(true)
  })

  test('لینک خارجی https', () => {
    const t = parseInline('official [CTI site](https://www.chinesetest.cn/)')
    expect(t[1]).toEqual({ type: 'link', text: 'CTI site', href: 'https://www.chinesetest.cn/' })
    expect(isInternalLink('https://www.chinesetest.cn/')).toBe(false)
  })

  test('ترکیب بولد و لینک در یک خط', () => {
    const t = parseInline('**HSK 1** has [150 words](/blog/hsk-1-study-guide) total')
    expect(t.map((x) => x.type)).toEqual(['bold', 'text', 'link', 'text'])
  })

  test('براکت بدون فرمت لینک → متن خام', () => {
    expect(parseInline('array [i] is not a link')).toEqual([{ type: 'text', text: 'array [i] is not a link' }])
  })

  test('بولد خالی/ناقص دست نمی‌خورد', () => {
    expect(parseInline('a ** b')).toEqual([{ type: 'text', text: 'a ** b' }])
  })
})

// ---------- parseTable ----------

describe('parseTable', () => {
  const valid = [
    '| Level | Words | Pass |',
    '| --- | --- | --- |',
    '| HSK 1 | 150 | 120/200 |',
    '| HSK 2 | 300 | 120/200 |',
  ].join('\n')

  test('جدول معتبر با ردیف جداکننده', () => {
    const t = parseTable(valid)
    expect(t).not.toBeNull()
    expect(t!.header).toEqual(['Level', 'Words', 'Pass'])
    expect(t!.rows).toEqual([
      ['HSK 1', '150', '120/200'],
      ['HSK 2', '300', '120/200'],
    ])
  })

  test('بدون ردیف جداکننده → null', () => {
    const noSep = ['| a | b |', '| 1 | 2 |'].join('\n')
    expect(parseTable(noSep)).toBeNull()
  })

  test('تعداد ستون ناهماهنگ → null', () => {
    const ragged = ['| a | b |', '| --- | --- |', '| 1 | 2 | 3 |'].join('\n')
    expect(parseTable(ragged)).toBeNull()
  })

  test('پاراگراف عادی با کاراکتر | داخل متن → null', () => {
    expect(parseTable('the word | appears here in a sentence')).toBeNull()
  })

  test('کمتر از سه خط جدول → null', () => {
    expect(parseTable('| a | b |\n| --- | --- |')).toBeNull()
  })

  test('سلول بولد در جدول حفظ می‌شود (پارسر inline خودش رندر می‌کند)', () => {
    const t = parseTable(['| Word | Meaning |', '| --- | --- |', '| **你 (nǐ)** | you |'].join('\n'))
    expect(t!.rows[0][0]).toBe('**你 (nǐ)**')
  })
})

// ---------- countWords ----------

describe('countWords', () => {
  test('لاتین + چینی (هر کاراکتر چینی = یک واژه)', () => {
    expect(countWords('four words here now')).toBe(4)
    expect(countWords('你好')).toBe(2)
    expect(countWords('learn 你好 today')).toBe(4)
  })
})
