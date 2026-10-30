import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { readResourceFile, fetchResourceBlobResponse } from '@/lib/resources-store'

// ---------------------------------------------------------------------------
// 📚 GET /api/resources/[id]/file — دانلود عمومی فایل منبع
//
// عمومی و بدون احراز هویت (الزام تسک: «در دسترس عموم»)؛ فقط منابع منتشرشده.
//  • Blob (استور عمومی یا خصوصی) → استریم با توکن سرور (Content-Disposition: attachment)
//  • FS محلی → خواندن از CT_DATA_DIR/uploads/resources با نام hex-اعتبارسنجی‌شده
// شمارندهٔ downloads هم در همین مسیر افزایش می‌یابد.
// ---------------------------------------------------------------------------

export const dynamic = 'force-dynamic'

function downloadHeaders(fileName: string, mimeType: string, length: number | null): Headers {
  const headers = new Headers()
  headers.set(
    'Content-Type',
    mimeType || 'application/octet-stream'
  )
  // نام فایل یونیکد (فارسی/چینی) با RFC 5987 + fallback ASCII
  const ascii = fileName.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_') || 'resource'
  headers.set(
    'Content-Disposition',
    `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
  )
  if (length && length > 0) headers.set('Content-Length', String(length))
  headers.set('Cache-Control', 'no-store')
  return headers
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id || id.length > 40) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const row = await db.resource.findUnique({ where: { id } })
    if (!row || !row.published) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // شمارندهٔ دانلود — بهترین‌تلاش؛ شکستش جلوی دانلود را نمی‌گیرد
    await db.resource
      .update({ where: { id }, data: { downloads: { increment: 1 } } })
      .catch(() => {})

    if (/^https?:\/\//.test(row.fileUrl)) {
      try {
        const upstream = await fetchResourceBlobResponse(row.fileUrl)
        const len = Number(upstream.headers.get('content-length') ?? '0') || row.fileSize || null
        return new Response(upstream.body, {
          headers: downloadHeaders(row.fileName, row.mimeType, len),
        })
      } catch (e) {
        console.error('[GET /api/resources/[id]/file] blob read failed:', e instanceof Error ? e.message : e)
        return NextResponse.json({ error: 'File is temporarily unavailable' }, { status: 503 })
      }
    }

    // FS محلی — fileUrl = نام فایل hex در پوشهٔ resources
    const buf = await readResourceFile(row.fileUrl)
    if (!buf) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return new Response(new Uint8Array(buf), {
      headers: downloadHeaders(row.fileName, row.mimeType, buf.length),
    })
  } catch (err) {
    console.error('[GET /api/resources/[id]/file] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
