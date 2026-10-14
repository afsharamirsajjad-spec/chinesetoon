// ---------------------------------------------------------------------------
// 📚 زیرساخت فایل تکالیف — آپلود/خواندن امن (هم‌خانوادهٔ receipts.ts و images.ts)
//
// امنیت:
//  • شناسهٔ فایل = ۴۸ نویسهٔ hex تصادفی (غیرقابل‌حدس) — نام اصلی کاربر هرگز
//    برای مسیر/ذخیره استفاده نمی‌شود؛ فقط نام نمایشی پاک‌سازی‌شده در DB می‌ماند
//  • پسوند از لیست مجاز (اسناد/تصویر/صدا/ویدیو/آرشیو) — HTML/SVG/اسکریپت مطلقاً نه
//  • سقف ۱۵ مگابایت برای هر فایل و حداکثر ۵ فایل در هر ارسال
//  • همهٔ دانلودها با Content-Disposition: attachment + nosniff سرو می‌شوند
//
// ذخیره‌سازی دولایه:
//  • Vercel: وقتی BLOB_READ_WRITE_TOKEN تنظیم باشد → @vercel/blob (Vercel FS
//    read-only است)؛ مسیر بلاک هم شناسهٔ 48hex دارد = URL غیرقابل‌حدس
//  • محلی/سندباکس: CT_DATA_DIR/uploads/homework (بیرون از وب‌روت)
// ---------------------------------------------------------------------------

import { randomBytes } from 'crypto'
import { mkdir, readFile, writeFile, unlink } from 'fs/promises'
import path from 'path'
import { sanitizeDisplayName } from '@/lib/receipts'
import { isBlobConfigured, putBlobFile, delBlobFile } from '@/lib/blob-store'

export const MAX_HOMEWORK_FILE_BYTES = 15 * 1024 * 1024 // ۱۵MB
export const MAX_HOMEWORK_FILES_PER_UPLOAD = 5

export const HOMEWORK_FILE_EXT_BY_MIME: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'text/plain': 'txt',
  'application/zip': 'zip',
  'application/x-zip-compressed': 'zip',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'video/mp4': 'mp4',
  // اسناد آفیس — مرورگرهای مختلف mimeهای متفاوتی می‌فرستند
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
}

// 🛡️ mimeهای قابل‌اعتماد از روی پسوند — ادعای مرورگر فقط پسوندِ مجاز را می‌پذیریم
// و mime نهایی از همین جدول می‌آید (نه از file.type مرورگر)
const EXT_BY_LOWER_MIME: Record<string, string> = Object.fromEntries(
  Object.entries(HOMEWORK_FILE_EXT_BY_MIME).map(([mime, ext]) => [mime, ext])
)

const MIME_BY_EXT: Record<string, string> = Object.fromEntries(
  Object.entries(HOMEWORK_FILE_EXT_BY_MIME).map(([mime, ext]) => [ext, mime])
)

/** پسوندهای مجاز — از mime ادعایی مرورگر + نام فایل، فقط همین‌ها پذیرفته می‌شوند */
export function homeworkExtFor(file: { name: string; type: string }): string | null {
  const nameExt = (file.name.split('.').pop() ?? '').toLowerCase()
  // ۱) پسوند نام فایل باید خودش در لیست مجاز باشد (ادعای mime به‌تنهایی کافی نیست)
  if (!nameExt || !MIME_BY_EXT[nameExt]) return null
  // ۲) اگر مرورگر mime فرستاده، باید با پسوند سازگار باشد (مثل image/jpeg برای jpg)
  const claimed = (file.type || '').toLowerCase().split(';')[0].trim()
  if (claimed) {
    const claimedExt = EXT_BY_LOWER_MIME[claimed]
    // mime ناشناخته یا ناسازگار با پسوند نام فایل → رد (مثل txt با نام .pdf)
    if (claimedExt && claimedExt !== nameExt) return null
  }
  return nameExt
}

export const HOMEWORK_MIME_BY_EXT = MIME_BY_EXT

/** شناسهٔ غیرقابل‌حدس فایل — ۴۸ نویسهٔ hex (۱۹۲ بیت آنتروپی) */
export function generateHomeworkFileId(): string {
  return randomBytes(24).toString('hex')
}

export function isHomeworkFileId(id: string): boolean {
  return /^[a-f0-9]{48}$/.test(id)
}

export { sanitizeDisplayName as sanitizeHomeworkFileName }

const CT_DATA_DIR = (process.env.CT_DATA_DIR || '/home/z/data').trim() || '/home/z/data'
const HOMEWORK_DIR = path.join(CT_DATA_DIR, 'uploads', 'homework')

/** آیا ذخیرهٔ محلی ممکن است؟ (روی Vercel فقط با Blob) */
export function isHomeworkStorageAvailable(): boolean {
  if (isBlobConfigured()) return true
  if (process.env.VERCEL === '1' && !process.env.CT_DATA_DIR) return false
  return true
}

/** 🟢 خطای واضح وقتی هیچ بک‌اند ذخیره‌ای در دسترس نیست */
export class HomeworkStorageUnavailableError extends Error {
  constructor() {
    super('Homework file storage is not available in this environment. Configure BLOB_READ_WRITE_TOKEN (Vercel Blob) for production uploads.')
    this.name = 'HomeworkStorageUnavailableError'
  }
}

/**
 * ذخیرهٔ فایل — روی Vercel با Blob (URL برمی‌گردد)، محلی با FS (url=null).
 * خروجی url در رکورد HomeworkFile ذخیره می‌شود؛ مسیر دانلود همیشه از
 * /api/homework/files/[fileId] با احراز هویت رد می‌شود.
 */
export async function saveHomeworkFile(
  id: string,
  ext: string,
  data: Buffer
): Promise<{ url: string | null }> {
  if (!isHomeworkFileId(id)) throw new Error('Invalid homework file id')
  // ☁️ اولویت با Blob — روی Vercel تنها گزینه است
  const url = await putBlobFile(`${id}.${ext}`, data)
  if (url) return { url }
  if (!isHomeworkStorageAvailable()) throw new HomeworkStorageUnavailableError()
  await mkdir(HOMEWORK_DIR, { recursive: true })
  await writeFile(path.join(HOMEWORK_DIR, `${id}.${ext}`), data)
  return { url: null }
}

/** خواندن از FS محلی — فقط برای فایل‌های بدون url بلاک */
export async function readHomeworkFile(id: string, ext: string): Promise<Buffer | null> {
  if (!isHomeworkFileId(id)) return null
  try {
    return await readFile(path.join(HOMEWORK_DIR, `${id}.${ext}`))
  } catch {
    return null
  }
}

/** حذف فیزیکی بهترین‌تلاش — شکستش جریان اصلی را نمی‌شکند (رکورد DB منبع حقیقت است) */
export async function deleteHomeworkFile(id: string, ext: string, url: string | null): Promise<void> {
  if (!isHomeworkFileId(id)) return
  if (url) await delBlobFile(url)
  await unlink(path.join(HOMEWORK_DIR, `${id}.${ext}`)).catch(() => {})
}
