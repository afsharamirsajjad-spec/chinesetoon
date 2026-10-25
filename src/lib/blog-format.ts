// ---------------------------------------------------------------------------
// 🧩 blog-format — پارسر خالصِ قالب محتوای مقالات (بدون وابستگی به React)
//
// قالب محتوا (مطابق رندرکنندهٔ blog-parts.tsx):
//   • بلوک‌ها با «یک خط خالی» جدا می‌شوند
//   • بلوک «## ...» تیتر بخش (h3 + فهرست «در این صفحه») و «### ...» زیرتیتر (h4) است
//   • inline: فقط **بولد** و [متن](آدرس) پشتیبانی می‌شود
//   • بلوک جدول: خط‌های |...| با ردیف جداکنندهٔ |---| — آدرس سلول‌ها مجاز نیست
//
// خالص بودن این ماژول باعث می‌شود هم رندرکنندهٔ سمت کلاینت و هم اسکریپت‌های
// seed/اعتبارسنجی (bun test) دقیقاً از یک منطق مشترک استفاده کنند.
// ---------------------------------------------------------------------------

/** توکن inline یک خط متن — متن ساده، بولد یا لینک */
export interface InlineToken {
  type: 'text' | 'bold' | 'link'
  text: string
  /** فقط برای link — داخلی (شروع با /) یا مطلق https */
  href?: string
}

/** جدول مارک‌داونِ مینیمال — ردیف جداکنندهٔ |---| الزامی است */
export interface TableBlock {
  header: string[]
  rows: string[][]
}

const INLINE_SPLIT = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/g
const LINK_RE = /^\[([^\]]+)\]\(([^)\s]+)\)$/
const SEP_CELL_RE = /^:?-{3,}:?$/

/**
 * تجزیهٔ یک خط به توکن‌های text/bold/link.
 * بولد داخل برچسب لینک پشتیبانی نمی‌شود ([**x**](y) → لینک با متن خام).
 */
export function parseInline(text: string): InlineToken[] {
  return text
    .split(INLINE_SPLIT)
    .filter((chunk) => chunk !== undefined && chunk !== '')
    .map((chunk): InlineToken => {
      if (chunk.startsWith('**') && chunk.endsWith('**') && chunk.length > 4) {
        return { type: 'bold', text: chunk.slice(2, -2) }
      }
      const link = LINK_RE.exec(chunk)
      if (link) return { type: 'link', text: link[1], href: link[2] }
      return { type: 'text', text: chunk }
    })
}

/** آیا لینک داخلی است؟ (مسیر نسبی سایت — با next/link رندر می‌شود، نه target=_blank) */
export function isInternalLink(href: string): boolean {
  return href.startsWith('/')
}

const cellRow = (line: string): string[] => line.slice(1, -1).split('|').map((c) => c.trim())

/**
 * بلوک را به‌عنوان جدول تفسیر می‌کند — فقط وقتی ساختار markdown معتبر باشد:
 * حداقل سرتیتر + ردیف جداکننده + یک ردیف داده، همهٔ خط‌ها با | شروع/پایان
 * و تعداد ستون‌ها یکسان. هر انحرافی → null (بلوک به‌عنوان پاراگراف رندر می‌شود).
 */
export function parseTable(block: string): TableBlock | null {
  const lines = block
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
  if (lines.length < 3) return null
  if (!lines.every((l) => l.startsWith('|') && l.endsWith('|'))) return null

  const header = cellRow(lines[0])
  const sep = cellRow(lines[1])
  if (sep.length !== header.length || !sep.every((c) => SEP_CELL_RE.test(c))) return null

  const rows = lines.slice(2).map(cellRow)
  if (rows.some((r) => r.length !== header.length)) return null
  return { header, rows }
}

/** تعداد واژهٔ لاتین + کاراکترهای چینی (هر کاراکتر چینی ≈ یک واژه) */
export function countWords(content: string): number {
  const cjk = (content.match(/[\u4e00-\u9fff]/g) || []).length
  const latinWords = content
    .replace(/[\u4e00-\u9fff]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length
  return cjk + latinWords
}
