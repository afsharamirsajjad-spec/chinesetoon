import { NextRequest, NextResponse } from 'next/server'
import { isAuthorized } from '@/lib/admin-auth'
import { isBlobUploadAvailable } from '@/lib/resources-store'
import { RESOURCE_EXTENSIONS, RESOURCE_MIME_BY_EXT, resourceExtensionOf } from '@/lib/resources'

// ---------------------------------------------------------------------------
// 📚 /api/resources/upload-token — دروازهٔ آپلود مستقیم مرورگر→Blob
//
// فایل‌های بزرگ‌تر از سقف ۴.۵ مگابایتیِ بدنهٔ Vercel (کتاب‌ها!) از این مسیر
// می‌روند. الگوی رسمی @vercel/blob v2:
//   • GET (ادمین) → { configured } — آیا آپلود مستقیم ممکن است؟
//   • POST (SDK کلاینت، با هدر x-admin-key) → handleUpload توکن کوتاه‌عمرِ
//     اسکوپ‌شده به همان pathname صادر می‌کند؛ توکن read-write اصلی هرگز به
//     مرورگر نمی‌رود. onBeforeGenerateToken مسیر/پسوند را سمت سرور اعتبارسنجی
//     می‌کند: فقط resources/<hex ۴۸>.<پسوند مجاز>.
// پس از آپلود، کلاینت متادیتا را به POST /api/resources (JSON) می‌دهد.
// ---------------------------------------------------------------------------

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ configured: isBlobUploadAvailable() })
}

export async function POST(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!isBlobUploadAvailable()) {
    return NextResponse.json(
      { error: 'Direct cloud upload is not configured (BLOB_READ_WRITE_TOKEN missing).' },
      { status: 503 }
    )
  }
  try {
    const body = await req.json()
    const { handleUpload } = await import('@vercel/blob/client')
    const json = await handleUpload({
      token: (process.env.BLOB_READ_WRITE_TOKEN ?? '').trim(),
      request: req,
      body,
      // 🛡️ فقط فایل منبع واقعی — مسیر hex-۴۸ + پسوند لیست مجاز؛ MIME هم قفل می‌شود
      onBeforeGenerateToken: async (pathname: string) => {
        const m = /^resources\/[a-f0-9]{48}\.([a-z0-9]+)$/.exec(pathname)
        const ext = m ? resourceExtensionOf(`x.${m[1]}`) : null
        if (!m || !ext || !(RESOURCE_EXTENSIONS as readonly string[]).includes(ext)) {
          throw new Error('Unsupported resource path or file type')
        }
        return { allowedContentTypes: [RESOURCE_MIME_BY_EXT[ext]] }
      },
    })
    return NextResponse.json(json)
  } catch (err) {
    console.error('[POST /api/resources/upload-token] error:', err)
    return NextResponse.json(
      { error: 'Could not start the upload — try again.' },
      { status: 400 }
    )
  }
}
