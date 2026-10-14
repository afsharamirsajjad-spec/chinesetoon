// ---------------------------------------------------------------------------
// 🖼️ ذخیرهٔ امن تصاویر آپلودی ادمین (پیش‌نمایش کلاس‌ها / تصویر مقالات)
//
// اصول امنیتی (هم‌خانوادهٔ receipts.ts):
//  • فایل هرگز در public/ نوشته نمی‌شود — در uploads/images/ بیرون از وب‌روت
//    (CT_DATA_DIR) ذخیره و فقط از مسیر GET /api/images/[id] سرو می‌شود
//  • شناسهٔ فایل = ۴۸ نویسهٔ hex تصادفی (غیرقابل‌حدس) — نام اصلی فایل هرگز
//    روی دیسک نمی‌رود و هیچ مسیری از ورودی کاربر ساخته نمی‌شود
//  • نوع فایل از «magic bytes» تشخیص داده می‌شود، نه از ادعای مرورگر
//  • فقط JPEG/PNG/WEBP/GIF — SVG عمداً پذیرفته نیست (می‌تواند اسکریپت داشته باشد)
//  • سقف ۵ مگابایت
// ---------------------------------------------------------------------------

import { randomBytes } from 'crypto'
import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'
import { isBlobConfigured, putBlobFile } from '@/lib/blob-store'

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // ۵MB

// 🗄️ همان سیاست پایداری رسیدها — در «داده‌های پایدار» بیرون از پوشهٔ پروژه
// تا redeploy پروژه هرگز تصاویر آپلودشده را از بین نبرد.
// 🟢 Vercel: فایل‌سیستم read-only است؛ تا فعال‌شدن Vercel Blob خطای واضح
// برمی‌گردد (نه EROFS مبهم) — همان محدودیت شناخته‌شدهٔ رسیدها.
const CT_DATA_DIR = (process.env.CT_DATA_DIR || '/home/z/data').trim() || '/home/z/data'
const IMAGES_DIR = path.join(CT_DATA_DIR, 'uploads', 'images')

export function isImageStorageAvailable(): boolean {
  if (isBlobConfigured()) return true
  if (process.env.VERCEL === '1' && !process.env.CT_DATA_DIR) return false
  return true
}

export const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
export type ImageMime = (typeof IMAGE_MIMES)[number]

export const IMAGE_EXT_BY_MIME: Record<ImageMime, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

/** شناسهٔ غیرقابل‌حدس فایل — ۴۸ نویسهٔ hex (۱۹۲ بیت آنتروپی) */
export function generateImageId(): string {
  return randomBytes(24).toString('hex')
}

export function isImageId(id: string): boolean {
  return /^[a-f0-9]{48}$/.test(id)
}

export interface DetectedImageType {
  mime: ImageMime
}

/**
 * تشخیص نوع واقعی تصویر با magic bytes — هر نوع دیگری (SVG، اجرایی، آرشیو و…)
 * قطعاً رد می‌شود.
 */
export function detectImageType(bytes: Uint8Array): DetectedImageType | null {
  if (bytes.length < 12) return null
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { mime: 'image/jpeg' }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return { mime: 'image/png' }
  }
  // WEBP: RIFF .... WEBP
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return { mime: 'image/webp' }
  }
  // GIF: GIF87a / GIF89a
  if (
    bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) && bytes[5] === 0x61
  ) {
    return { mime: 'image/gif' }
  }
  return null
}

/** 🟢 خطای واضح وقتی ذخیرهٔ تصویر روی فایل‌سیستم ممکن نیست (Vercel read-only FS) */
export class ImageStorageUnavailableError extends Error {
  constructor() {
    super('Image file storage is not available in this environment. Configure Vercel Blob (BLOB_READ_WRITE_TOKEN) for production image uploads.')
    this.name = 'ImageStorageUnavailableError'
  }
}

/**
 * ذخیرهٔ تصویر — Blob وقتی توکن هست (خروجی URL عمومیِ غیرقابل‌حدس که مستقیم
 * به‌عنوان src تصویر استفاده می‌شود)، وگرنه FS محلی (مسیر /api/images/[id]).
 */
export async function saveImageFile(
  id: string,
  mime: ImageMime,
  data: Buffer
): Promise<{ url: string | null }> {
  if (!isImageId(id)) throw new Error('Invalid image id')
  const ext = IMAGE_EXT_BY_MIME[mime]
  // ☁️ اولویت با Blob — روی Vercel تنها گزینه است
  const blobUrl = await putBlobFile(`images/${id}.${ext}`, data)
  if (blobUrl) return { url: blobUrl }
  if (!isImageStorageAvailable()) throw new ImageStorageUnavailableError()
  await mkdir(IMAGES_DIR, { recursive: true })
  await writeFile(path.join(IMAGES_DIR, `${id}.${ext}`), data)
  return { url: null }
}

/** خواندن امن — id همیشه قبل از ساخت مسیر اعتبارسنجی می‌شود؛ mime از پسوند فایل می‌آید */
export async function readImageFile(id: string): Promise<{ mime: ImageMime; data: Buffer } | null> {
  if (!isImageId(id)) return null
  for (const mime of IMAGE_MIMES) {
    const ext = IMAGE_EXT_BY_MIME[mime]
    try {
      const data = await readFile(path.join(IMAGES_DIR, `${id}.${ext}`))
      return { mime, data }
    } catch {
      // این پسوند نیست — پسوند بعدی
    }
  }
  return null
}
