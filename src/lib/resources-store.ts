// ---------------------------------------------------------------------------
// 📚 ذخیره‌سازی منابع عمومی دانلودی — سمت سرور (فقط مسیرهای API)
//
// همان سیاست رسیدها: اولویت با Vercel Blob (با BLOB_READ_WRITE_TOKEN) و
// fallback به FS محلی (CT_DATA_DIR/uploads/resources) برای توسعه/سندباکس.
// نام فایل روی دیسک = شناسهٔ hex غیرقابل‌حدس؛ نام اصلی فقط نمایشی است.
// تفاوت با رسیدها: این فایل‌ها «عمومی» هستند و مسیر دانلود سایت آن‌ها را با
// Content-Disposition: attachment استریم می‌کند (برای استور خصوصی هم کار
// می‌کند چون fetchBlobResponse با توکن سرور می‌خواند).
// ---------------------------------------------------------------------------

import { randomBytes } from 'crypto'
import { mkdir, readFile, writeFile, unlink } from 'fs/promises'
import path from 'path'
import { isBlobConfigured, putBlobFile, delBlobFile, fetchBlobResponse } from '@/lib/blob-store'
import type { ResourceExtension } from '@/lib/resources'

const CT_DATA_DIR = (process.env.CT_DATA_DIR || '/home/z/data').trim() || '/home/z/data'
const RESOURCES_DIR = path.join(CT_DATA_DIR, 'uploads', 'resources')

/** آیا ذخیرهٔ منابع ممکن است؟ روی Vercel فقط با Blob */
export function isResourceStorageAvailable(): boolean {
  if (isBlobConfigured()) return true
  if (process.env.VERCEL === '1' && !process.env.CT_DATA_DIR) return false
  return true
}

/** آپلود مستقیم مرورگر→Blob ممکن است؟ (فایل‌های بزرگ‌تر از سقف multipart) */
export function isBlobUploadAvailable(): boolean {
  return isBlobConfigured()
}

export function generateResourceId(): string {
  return randomBytes(24).toString('hex')
}

export function isResourceFileId(id: string): boolean {
  return /^[a-f0-9]{48}$/.test(id)
}

export class ResourceStorageUnavailableError extends Error {
  constructor() {
    super('Resource file storage is not available in this environment. Configure Vercel Blob (BLOB_READ_WRITE_TOKEN) for production uploads.')
    this.name = 'ResourceStorageUnavailableError'
  }
}

async function ensureDir(): Promise<void> {
  if (!isResourceStorageAvailable()) throw new ResourceStorageUnavailableError()
  await mkdir(RESOURCES_DIR, { recursive: true })
}

/**
 * ذخیرهٔ فایل منبع — Blob وقتی توکن هست (خروجی URL)، وگرنه FS محلی (نام فایل).
 */
export async function saveResourceFile(
  id: string,
  ext: ResourceExtension,
  data: Buffer
): Promise<string | null> {
  if (!isResourceFileId(id)) throw new Error('Invalid resource id')
  const put = await putBlobFile(`resources/${id}.${ext}`, data)
  if (put) return put.url
  if (!isResourceStorageAvailable()) throw new ResourceStorageUnavailableError()
  await ensureDir()
  await writeFile(path.join(RESOURCES_DIR, `${id}.${ext}`), data, { mode: 0o600 })
  return null
}

/** خواندن امن از FS — نام فایل همیشه الگوی hex-پسوند دارد (بدون traversal) */
export async function readResourceFile(fileName: string): Promise<Buffer | null> {
  if (!/^[a-f0-9]{48}\.[a-z0-9]+$/.test(fileName)) return null
  try {
    return await readFile(path.join(RESOURCES_DIR, fileName))
  } catch {
    return null
  }
}

/** حذف فایل منبع — Blob (URL) یا FS (نام فایل)؛ شکست آن جریان اصلی را نمی‌شکند */
export async function deleteResourceFile(fileUrl: string | null | undefined): Promise<void> {
  if (!fileUrl) return
  if (/^https?:\/\//.test(fileUrl)) {
    await delBlobFile(fileUrl)
    return
  }
  await unlink(path.join(RESOURCES_DIR, fileUrl)).catch(() => {})
}

/**
 * استریم فایل از Blob با توکن سرور — برای استور خصوصی تنها راه؛ برای استور
 * عمومی هم بی‌ضرر است (هدر Bearer نادیده گرفته می‌شود).
 */
export async function fetchResourceBlobResponse(url: string): Promise<Response> {
  return fetchBlobResponse(url)
}
