// ---------------------------------------------------------------------------
// ☁️ Vercel Blob — لایهٔ ذخیره‌سازی مشترک فایل‌های آپلودی
//
// Vercel فایل‌سیستم فقط-خواندنی دارد؛ بدون Blob هیچ آپلودی (رسید/تصویر/تکالیف)
// ممکن نیست. اگر BLOB_READ_WRITE_TOKEN تنظیم باشد فایل‌ها به Blob می‌روند
// (pathname از شناسهٔ 48hex غیرقابل‌حدس ساخته می‌شود = URL capability)؛ وگرنه
// مسیر FS محلی (توسعه/سندباکس) فعال است.
// ---------------------------------------------------------------------------

const BLOB_TOKEN = () => (process.env.BLOB_READ_WRITE_TOKEN ?? '').trim()

export function isBlobConfigured(): boolean {
  return BLOB_TOKEN() !== ''
}

/**
 * آپلود به Blob — خروجی URL عمومیِ غیرقابل‌حدس.
 * اگر توکن تنظیم نباشد null برمی‌گردد (تماس‌دهنده به FS fallback می‌کند).
 * هرگز throw نمی‌کند مگر خود آپلود شکست بخورد (تماس‌دهنده پیام تمیز می‌دهد).
 */
export async function putBlobFile(pathname: string, data: Buffer): Promise<string | null> {
  const token = BLOB_TOKEN()
  if (!token) return null
  const blob = await import('@vercel/blob')
  const res = await blob.put(pathname, data, {
    access: 'public',
    addRandomSuffix: false,
    token,
  })
  return res.url
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
