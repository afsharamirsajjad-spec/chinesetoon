// ---------------------------------------------------------------------------
// 📚 منابع عمومی دانلودی (کتاب/جزوه/صدا/ویدئو) — اعتبارسنجی خالص
//
// این فایل «بدون» وابستگی سرور (fs/blob) است تا هم مسیرهای API و هم فرم
// آپلود پنل ادمین (کلاینت) از یک منبع حقیقت استفاده کنند. ذخیره‌سازی واقعی
// در resources-store.ts (سمت سرور) است.
//
// قواعد:
//  • فقط پسوندهای سند/کتاب/آرشیو/رسانه — هیچ فایل اجرایی/اسکریپتی/HTML
//    پذیرفته نمی‌شود (فایل عمومی است؛ اجرایی بودن = ریسک برای همه).
//  • نام فایل فقط «نمایشی» است و پاک‌سازی می‌شود؛ هرگز در مسیر ذخیره نمی‌رود.
//  • سقف مسیر multipart (فرم سرور) = ۴ مگابایت (زیر سقف بدنهٔ Vercel)؛
//    مسیر آپلود مستقیم مرورگر→Blob سقف خیلی بیشتری دارد (سقف UI: ۱۰۰MB).
// ---------------------------------------------------------------------------

export const MAX_RESOURCE_FORM_BYTES = 4 * 1024 * 1024 // ۴MB — مسیر multipart
export const MAX_RESOURCE_CLIENT_BYTES = 100 * 1024 * 1024 // ۱۰۰MB — آپلود مستقیم Blob

export const RESOURCE_EXTENSIONS = [
  'pdf',
  'epub',
  'mobi',
  'doc',
  'docx',
  'ppt',
  'pptx',
  'xls',
  'xlsx',
  'zip',
  'txt',
  'mp3',
  'm4a',
  'mp4',
  'png',
  'jpg',
  'jpeg',
  'webp',
] as const

export type ResourceExtension = (typeof RESOURCE_EXTENSIONS)[number]

export const RESOURCE_MIME_BY_EXT: Record<ResourceExtension, string> = {
  pdf: 'application/pdf',
  epub: 'application/epub+zip',
  mobi: 'application/x-mobipocket-ebook',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  zip: 'application/zip',
  txt: 'text/plain',
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  mp4: 'video/mp4',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
}

/** پسوند واقعی از نام فایل — فقط اگر در لیست مجاز باشد؛ وگرنه null */
export function resourceExtensionOf(fileName: string): ResourceExtension | null {
  const m = /\.([a-z0-9]+)$/i.exec((fileName || '').trim())
  if (!m) return null
  const ext = m[1].toLowerCase()
  return (RESOURCE_EXTENSIONS as readonly string[]).includes(ext) ? (ext as ResourceExtension) : null
}

/** نام نمایشی پاک‌سازی‌شده — هرگز برای مسیر/ذخیره استفاده نمی‌شود */
export function sanitizeResourceName(name: string): string {
  const base = (name || '').split(/[\\/]/).pop() || ''
  return base.replace(/[^\w.\- ()\u0600-\u06FF]/g, '_').trim().slice(0, 120) || 'resource'
}

/** نمایش خوانا برای لیست‌ها/کارت‌ها */
export function formatResourceSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB'
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(bytes % (1024 * 1024) === 0 ? 0 : 1)} MB`
}

/** عنوان ردیف منبع — کوتاه، بدون کنترل‌کاراکتر */
export function sanitizeResourceTitle(title: string): string {
  return (title || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160)
}

/** توضیح ردیف منبع — کوتاه، بدون کنترل‌کاراکتر */
export function sanitizeResourceDescription(desc: string): string {
  return (desc || '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ' ').trim().slice(0, 1000)
}
