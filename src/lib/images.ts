// ---------------------------------------------------------------------------
// 🖼️ ذخیره‌سازی تصاویر — معماری production (Vercel Blob فقط)
//
// تصمیم معماری (بازطراحی به درخواست مالک):
//  • Vercel Blob تنها بک‌اندِ ذخیرهٔ دائمی تصاویر است — هیچ مسیر دیسک محلی،
//    هیچ mkdir/writeFile برای فایل دائمی باقی نمانده (فایل‌سیستم Vercel
//    فقط-خواندنی است و مسیرهای /home/z روی آن وجود ندارند).
//  • pathname محتوامحور (content-addressed) است: sha256 بایت‌های تصویر →
//    «images/<hash>.<ext>». نتیجه: آپلود دوبارهٔ همان تصویر همان URL را می‌دهد
//    (ضد duplicate، ضد رشد بی‌رویهٔ Blob) و URLها تغییرناپذیرند → کش دائمی امن.
//  • متادیتا در اسکیمای موجود می‌ماند: URL تصویر در فیلدهای image (CourseClass/
//    Post/…) ذخیره می‌شود — بدون تغییر destructive در دیتابیس.
//  • اعتبارسنجی نوع فایل با magic bytes (نه ادعای مرورگر) — فقط JPEG/PNG/WEBP/GIF.
//  • سقف ۴ مگابایت: زیر حد ۴.۵MB بدنهٔ serverless Vercel (با سربار multipart).
// ---------------------------------------------------------------------------

import { createHash } from 'crypto'
import { isBlobConfigured, putBlobFile, headBlobFile, BlobConfigError } from '@/lib/blob-store'

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024 // ۴MB — امن زیر حد 4.5MB سرورلس Vercel

export const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
export type ImageMime = (typeof IMAGE_MIMES)[number]

export const IMAGE_EXT_BY_MIME: Record<ImageMime, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

export interface DetectedImageType {
  mime: ImageMime
}

/**
 * تشخیص نوع واقعی تصویر با magic bytes — هر نوع دیگری (SVG، اجرایی، آرشیو و…)
 * قطعاً رد می‌شود (SVG می‌تواند اسکریپت داشته باشد).
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

/** 🟢 خطای پیکربندی — توکن Blob غایب/نامعتبر؛ پیام کاملاً قابل‌اقدام */
export class ImageStorageUnavailableError extends Error {
  constructor(message = 'Image storage is not configured. Connect a Vercel Blob store to this project (Storage → Create → Blob) so BLOB_READ_WRITE_TOKEN is set, then redeploy.') {
    super(message)
    this.name = 'ImageStorageUnavailableError'
  }
}

function requireBlob(): void {
  if (!isBlobConfigured()) throw new ImageStorageUnavailableError()
}

export interface SavedImage {
  /** URL دائمی عمومی تصویر — مستقیم در فیلدهای image دیتابیس ذخیره می‌شود */
  url: string
  /** نام فایل در Blob — «images/<sha256>.<ext>» (محتوامحور، ضد duplicate) */
  pathname: string
  /** ۲۴ نویسهٔ اول هش — شناسهٔ نمایشی برای audit log */
  id: string
}

/**
 * ذخیرهٔ تصویر در Vercel Blob با pathname محتوامحور.
 * آپلود دوبارهٔ بایت‌های یکسان = همان pathname = همان URL (بدون فایل تکراری).
 */
export async function saveImageFile(mime: ImageMime, data: Buffer): Promise<SavedImage> {
  requireBlob()
  const ext = IMAGE_EXT_BY_MIME[mime]
  const hash = createHash('sha256').update(data).digest('hex')
  const pathname = `images/${hash}.${ext}`
  let url: string | null
  try {
    url = await putBlobFile(pathname, data)
  } catch (e) {
    // توکن نامعتبر/حذف‌شده → پیام پیکربندی شفاف (503) — نه 500 مبهم
    if (e instanceof BlobConfigError) throw new ImageStorageUnavailableError(e.message)
    throw e
  }
  if (!url) throw new ImageStorageUnavailableError()
  return { url, pathname, id: hash.slice(0, 24) }
}

/** شناسهٔ لگاسی — URLهای قدیمی به شکل /api/images/<48hex> */
export function isLegacyImageId(id: string): boolean {
  return /^[a-f0-9]{48}$/.test(id)
}

/**
 * یافتن URL یک تصویر قدیمیِ id-محور در Blob (سازگاری با ارجاع‌های پیشین).
 * چون قبلاً id تصادفی بود و پسوند در URL نبود، هر چهار پسوند امتحان می‌شود.
 */
export async function findLegacyImageUrl(id: string): Promise<string | null> {
  if (!isLegacyImageId(id)) return null
  requireBlob()
  for (const mime of IMAGE_MIMES) {
    const url = await headBlobFile(`images/${id}.${IMAGE_EXT_BY_MIME[mime]}`)
    if (url) return url
  }
  return null
}
