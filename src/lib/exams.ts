// ---------------------------------------------------------------------------
// 📝 آزمون‌ها (HSK-مانند) — منطق خالص: پارس XML، اعتبارسنجی، نمره‌دهی
//
// این فایل بدون وابستگی سرور است (هم مسیرهای API هم تست‌ها و هم فرم پنل از
// آن استفاده می‌کنند). مالک سؤالات را با فایل XML از پنل وارد می‌کند:
//
// <exam slug="hsk-1-mock-1" title="HSK 1 Mock Exam 1" level="HSK 1"
//       durationMin="40" passPercent="60" description="...">
//   <question>
//     <text>What does 你好 mean?</text>
//     <option correct="true">Hello</option>
//     <option>Goodbye</option>
//     <option>Thanks</option>
//     <option>Sorry</option>
//   </question>
//   <!-- سؤال بعدی... -->
// </exam>
//
// قواعد: حداقل ۱ سؤال، هر سؤال حداقل ۲ گزینه، دقیقاً یک گزینهٔ correct.
// پاسخ درست هرگز به کلاینت عمومی نمی‌رود؛ نمره‌دهی همیشه سمت سرور است.
// ---------------------------------------------------------------------------

import { XMLParser } from 'fast-xml-parser'

export interface ExamQuestion {
  q: string
  options: string[]
  /** ایندکس گزینهٔ درست (۰-مبنا) */
  answer: number
}

export interface ParsedExam {
  slug: string
  title: string
  description: string
  level: string
  durationMin: number
  passPercent: number
  questions: ExamQuestion[]
}

export class ExamParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ExamParseError'
  }
}

// سقف‌های دفاعی — فایل XML معقول، نه بی‌کران
export const MAX_EXAM_QUESTIONS = 200
export const MAX_EXAM_OPTIONS = 8
export const MAX_EXAM_XML_BYTES = 1024 * 1024 // ۱ مگابایت XML — صدها سؤال کفایت می‌کند

const SLUG_RE = /^[a-z0-9-]+$/

function textOf(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'string') return v.trim()
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  // fast-xml-parser ممکن است #text تودرتو بدهد
  if (typeof v === 'object' && '#text' in (v as Record<string, unknown>)) {
    return textOf((v as Record<string, unknown>)['#text'])
  }
  return ''
}

function attrOf(node: Record<string, unknown>, name: string): string {
  return textOf(node[`@_${name}`])
}

function asArray<T>(v: T | T[] | undefined): T[] {
  if (v === undefined) return []
  return Array.isArray(v) ? v : [v]
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || ''
  )
}

function intFrom(v: string, fallback: number, min: number, max: number): number {
  const n = Number.parseInt(v, 10)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

/**
 * پارس و اعتبارسنجی XML آزمون — هر ایراد با شمارهٔ سؤال پرتاب می‌شود تا
 * پیام پنل برای مالک قابل‌اقدام باشد.
 */
export function parseExamXml(xml: string): ParsedExam {
  const source = (xml ?? '').trim()
  if (!source) throw new ExamParseError('The XML file is empty.')
  if (source.length > MAX_EXAM_XML_BYTES) {
    throw new ExamParseError(`The XML file is too large (max ${Math.round(MAX_EXAM_XML_BYTES / 1024)} KB).`)
  }

  let doc: Record<string, unknown>
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseAttributeValue: false,
      trimValues: true,
      commentPropName: '#comment',
    })
    doc = parser.parse(source)
  } catch (e) {
    throw new ExamParseError(
      `The XML could not be parsed: ${e instanceof Error ? e.message : 'malformed XML'}`
    )
  }

  const examNode = doc['exam']
  if (!examNode || typeof examNode !== 'object') {
    throw new ExamParseError('The root element must be <exam>.')
  }
  const exam = examNode as Record<string, unknown>

  const title = sanitizeExamText(textOf(exam['title']) || attrOf(exam, 'title'))
  if (!title) throw new ExamParseError('The exam needs a <title> or a title="…" attribute.')

  let slug = textOf(attrOf(exam, 'slug')).toLowerCase()
  if (!slug) slug = slugify(title)
  if (!SLUG_RE.test(slug)) {
    throw new ExamParseError(
      `The slug "${slug}" is invalid — use lowercase letters, numbers and dashes only.`
    )
  }

  const description = sanitizeExamText(attrOf(exam, 'description'))
  const level = sanitizeExamText(attrOf(exam, 'level')).slice(0, 60)
  const durationMin = intFrom(attrOf(exam, 'durationMin'), 0, 0, 300)
  const passPercent = intFrom(attrOf(exam, 'passPercent'), 60, 1, 100)

  const questionNodes = asArray(exam['question'] as Record<string, unknown> | Record<string, unknown>[])
  if (questionNodes.length === 0) {
    throw new ExamParseError('The exam has no <question> elements.')
  }
  if (questionNodes.length > MAX_EXAM_QUESTIONS) {
    throw new ExamParseError(`Too many questions (max ${MAX_EXAM_QUESTIONS}).`)
  }

  const questions: ExamQuestion[] = questionNodes.map((qn, i) => {
    const n = i + 1
    const q = sanitizeExamText(textOf(qn['text']))
    if (!q) throw new ExamParseError(`Question ${n}: the <text> element is missing or empty.`)

    const optionNodes = asArray(qn['option'] as unknown)
    const options = optionNodes.map((o) => sanitizeExamText(textOf(o)))
    if (options.length < 2) {
      throw new ExamParseError(`Question ${n}: at least two <option> elements are required.`)
    }
    if (options.length > MAX_EXAM_OPTIONS) {
      throw new ExamParseError(`Question ${n}: at most ${MAX_EXAM_OPTIONS} options are allowed.`)
    }
    if (options.some((o) => !o)) {
      throw new ExamParseError(`Question ${n}: an <option> is empty.`)
    }

    const correctIndexes = optionNodes
      .map((o, idx) => (/^(true|1)$/i.test(textOf((o as Record<string, unknown>)?.['@_correct'])) ? idx : -1))
      .filter((idx) => idx >= 0)
    if (correctIndexes.length !== 1) {
      throw new ExamParseError(
        `Question ${n}: exactly one <option correct="true"> is required (found ${correctIndexes.length}).`
      )
    }

    return { q, options, answer: correctIndexes[0] }
  })

  return { slug, title, description, level, durationMin, passPercent, questions }
}

/** متن سؤال/گزینه — کوتاه و بدون کنترل‌کاراکتر */
export function sanitizeExamText(s: string): string {
  return (s ?? '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim()
    .slice(0, 500)
}

/** پارس امن JSON سؤالات از DB — هرگز throw نمی‌کند */
export function safeParseExamQuestions(raw: string): ExamQuestion[] {
  try {
    const arr = JSON.parse(raw) as unknown
    if (!Array.isArray(arr)) return []
    return arr.filter(
      (x): x is ExamQuestion =>
        !!x &&
        typeof x === 'object' &&
        typeof (x as ExamQuestion).q === 'string' &&
        Array.isArray((x as ExamQuestion).options) &&
        Number.isInteger((x as ExamQuestion).answer) &&
        (x as ExamQuestion).answer >= 0 &&
        (x as ExamQuestion).answer < (x as ExamQuestion).options.length
    )
  } catch {
    return []
  }
}

export interface ExamGrade {
  score: number
  maxScore: number
  percent: number
  passed: boolean
  /** درستی هر پاسخ به ترتیب سؤال‌ها — برای بازخورد پس از آزمون */
  correct: boolean[]
}

/**
 * نمره‌دهی سمت سرور — پاسخ‌ها به‌صورت ایندکس گزینه (null = بی‌پاسخ).
 * پاسخ نامعتبر/بیرون از محدوده = نادرست (دستکاری کلاینت بی‌اثر است).
 */
export function gradeExam(
  questions: ExamQuestion[],
  answers: unknown,
  passPercent: number
): ExamGrade {
  const list = Array.isArray(answers) ? answers : []
  const correct = questions.map((q, i) => list[i] === q.answer)
  const score = correct.filter(Boolean).length
  const maxScore = questions.length
  const percent = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
  return { score, maxScore, percent, passed: percent >= passPercent, correct }
}
