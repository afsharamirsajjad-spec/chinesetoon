// ---------------------------------------------------------------------------
// ☁️ Vercel Blob — لایهٔ ذخیره‌سازی مشترک فایل‌های آپلودی
//
// Vercel فایل‌سیستم فقط-خواندنی دارد؛ بدون Blob هیچ آپلودی (رسید/تصویر/تکالیف)
// ممکن نیست. اگر BLOB_READ_WRITE_TOKEN تنظیم باشد فایل‌ها به Blob می‌روند؛
// وگرنه مسیر FS محلی (توسعه/سندباکس) فعال است.
//
// 🔒 سازگاری با استورهای «خصوصی» (پیش‌فرض استورهای جدید Vercel):
//  • putBlobFile اول access:'public' را امتحان می‌کند؛ اگر استور خصوصی بود
//    (خطای «Cannot use public access on a private store») خودکار با
//    access:'private' دوباره آپلود می‌کند و حالت استور کش می‌شود.
//  • فایل‌های استور خصوصی با URL خام قابل دانلود نیستند → fetchBlobResponse
//    با هدر Bearer توکن سمت سرور می‌گیرد و مسیرهای API سایت استریم می‌کنند
//    (همان الگوی احراز خود SDK).
//
// خطاها: SDK خطاهای اختصاصی‌اش را از entry عمومی صادر نمی‌کند؛ به همین دلیل
// بر اساس پیام طبقه‌بندی و مشکلات پیکربندی به BlobConfigError تبدیل می‌شوند.
// ---------------------------------------------------------------------------

const BLOB_TOKEN = () => (process.env.BLOB_READ_WRITE_TOKEN ?? '').trim()

export function isBlobConfigured(): boolean {
  return BLOB_TOKEN() !== ''
}

/** مشکل پیکربندی Blob — توکن غایب/نامعتبر یا store در دسترس نیست (503 شفاف) */
export class BlobConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BlobConfigError'
  }
}

function messageOf(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

function wrapBlobError(e: unknown): never {
  const msg = messageOf(e)
  if (/access denied/i.test(msg)) {
    throw new BlobConfigError(
      'Vercel Blob rejected the access token — BLOB_READ_WRITE_TOKEN is missing or invalid. Reconnect the Blob store in Vercel and redeploy.'
    )
  }
  if (/store not found/i.test(msg)) {
    throw new BlobConfigError('The connected Vercel Blob store was not found — reconnect the store in the Vercel dashboard and redeploy.')
  }
  if (/suspended/i.test(msg)) {
    throw new BlobConfigError('The Vercel Blob store is suspended — check the Vercel dashboard.')
  }
  throw e
}

// حالت استور پس از اولین آپلود کش می‌شود (private stores: تلاش public بی‌فایده است)
const g = globalThis as unknown as { __ctBlobStorePrivate?: boolean }

export interface PutBlobResult {
  url: string
  /** true = استور خصوصی است؛ URL خام به‌صورت عمومی قابل دانلود نیست و باید
   *  از مسیر API سایت (fetchBlobResponse) سرو شود */
  isPrivate: boolean
}

/**
 * آپلود به Blob — با سازگاری خودکار استور خصوصی:
 * public اول؛ خطای «private store» → retry با access:'private' + کش حالت.
 * توکن تنظیم نباشد null برمی‌گردد (تماس‌دهنده به FS fallback می‌کند).
 */
export async function putBlobFile(pathname: string, data: Buffer): Promise<PutBlobResult | null> {
  const token = BLOB_TOKEN()
  if (!token) return null
  const blob = await import('@vercel/blob')
  const opts = { addRandomSuffix: false, token } as const
  try {
    if (g.__ctBlobStorePrivate) {
      const res = await blob.put(pathname, data, { ...opts, access: 'private' })
      return { url: res.url, isPrivate: true }
    }
    const res = await blob.put(pathname, data, { ...opts, access: 'public' })
    return { url: res.url, isPrivate: false }
  } catch (e) {
    const msg = messageOf(e)
    if (/private store/i.test(msg)) {
      // استور خصوصی است — یک‌بار با private دوباره
      g.__ctBlobStorePrivate = true
      try {
        const res = await blob.put(pathname, data, { ...opts, access: 'private' })
        return { url: res.url, isPrivate: true }
      } catch (e2) {
        wrapBlobError(e2)
      }
    }
    wrapBlobError(e)
  }
}

/**
 * دریافت فایل از Blob سمت سرور — با هدر Bearer (الگوی احراز خود SDK)؛
 * برای استورهای خصوصی تنها راه خواندن است و برای public هم بی‌ضرر است.
 * خروجی Response خام است تا مسیر API بتواند استریم/هدرهای خودش را بدهد.
 */
export async function fetchBlobResponse(url: string): Promise<Response> {
  const token = BLOB_TOKEN()
  if (!token) throw new BlobConfigError('BLOB_READ_WRITE_TOKEN is not configured on the server.')
  const res = await fetch(url, {
    headers: { authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) {
    throw new BlobConfigError(
      res.status === 403 || res.status === 401
        ? 'Vercel Blob rejected the access token while reading a file — check BLOB_READ_WRITE_TOKEN.'
        : `Blob read failed (status ${res.status}).`
    )
  }
  return res
}

/** حذف از Blob — بهترین‌تلاش، هرگز throw نمی‌کند */
export async function delBlobFile(url: string): Promise<void> {
  if (!url || !url.startsWith('http')) return
  try {
    const blob = await import('@vercel/blob')
    await blob.del(url)
  } catch (e) {
    console.error('[blob] delete failed (non-fatal):', e instanceof Error ? e.message : e)
  }
}

/**
 * جست‌وجوی pathname در Blob — اگر وجود داشت URL آن، وگرنه null.
 * برای سازگاری با ارجاع‌های قدیمیِ id-محور (بدون آپلود مجدد).
 */
export async function headBlobFile(pathname: string): Promise<string | null> {
  if (!BLOB_TOKEN()) return null
  try {
    const blob = await import('@vercel/blob')
    const meta = await blob.head(pathname)
    return meta?.url ?? null
  } catch (e) {
    // head برای pathname غایب هم ممکن است خطای عمومی بدهد — غیرحیاتی است
    console.error('[blob] head failed (non-fatal):', e instanceof Error ? e.message : e)
    return null
  }
}
