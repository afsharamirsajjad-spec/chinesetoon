// ---------------------------------------------------------------------------
// ☁️ Vercel Blob — لایهٔ ذخیره‌سازی مشترک فایل‌های آپلودی
//
// Vercel فایل‌سیستم فقط-خواندنی دارد؛ بدون Blob هیچ آپلودی (رسید/تصویر/تکالیف)
// ممکن نیست. اگر BLOB_READ_WRITE_TOKEN تنظیم باشد فایل‌ها به Blob می‌روند
// (pathname از شناسهٔ 48hex یا sha256 ساخته می‌شود = URL capability)؛ وگرنه
// مسیر FS محلی (توسعه/سندباکس) فعال است.
//
// خطاها: SDK خطاهای اختصاصی‌اش را از entry عمومی صادر نمی‌کند؛ به همین دلیل
// putBlobFile خطاها را بر اساس پیام طبقه‌بندی و مشکلات پیکربندی (توکن نامعتبر/
// store حذف‌شده) را به‌صورت BlobConfigError با پیام قابل‌اقدام بالا می‌دهد تا
// مسیرها 503 شفاف بدهند — نه 500 مبهم.
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

/**
 * آپلود به Blob — خروجی URL عمومیِ غیرقابل‌حدس.
 * اگر توکن تنظیم نباشد null برمی‌گردد (تماس‌دهنده به FS fallback می‌کند)؛
 * اگر توکن نامعتبر باشد BlobConfigError می‌دهد (نه 500 مبهم).
 */
export async function putBlobFile(pathname: string, data: Buffer): Promise<string | null> {
  const token = BLOB_TOKEN()
  if (!token) return null
  try {
    const blob = await import('@vercel/blob')
    const res = await blob.put(pathname, data, {
      access: 'public',
      addRandomSuffix: false,
      token,
    })
    return res.url
  } catch (e) {
    wrapBlobError(e)
  }
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
