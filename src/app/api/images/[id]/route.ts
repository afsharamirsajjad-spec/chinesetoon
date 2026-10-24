// ---------------------------------------------------------------------------
// 🖼️ GET /api/images/[id] — سازگاری با URLهای تصویریِ قدیمیِ id-محور
//
// معماری جدید: آپلود مستقیماً URL تصویر را برمی‌گرداند (استور عمومی: CDN بلاب؛
// استور خصوصی: مسیر /api/images/c/<hash>.<ext>) و همان در فیلدهای image
// دیتابیس ذخیره می‌شود — این مسیر فقط برای ارجاع‌های قدیمیِ «/api/images/<48hex>»
// است: در Blob جست‌وجو و با توکن سمت سرور استریم می‌کند (استور خصوصی هم کار می‌کند).
// چنین URLهایی هرگز روی Vercel کار نکرده‌اند — هیچ محتوای واقعی از این مسیر وابسته نیست.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { findLegacyImageUrl, IMAGE_MIME_BY_EXT } from '@/lib/images'
import { ImageStorageUnavailableError } from '@/lib/images'
import { fetchBlobResponse } from '@/lib/blob-store'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: raw } = await ctx.params
  const id = raw.trim().toLowerCase()
  try {
    const url = await findLegacyImageUrl(id)
    if (!url) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }
    // استور خصوصی/عمومی — استریم با توکن سمت سرور (URL خام لو نمی‌رود)
    const upstream = await fetchBlobResponse(url)
    // پسوند از pathname بلاب
    const extMatch = /\.([a-z0-9]+)(?:\?|$)/i.exec(url)
    const mime = IMAGE_MIME_BY_EXT[extMatch?.[1] ?? ''] ?? 'image/png'
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': mime,
        ...(upstream.headers.get('content-length')
          ? { 'Content-Length': upstream.headers.get('content-length') as string }
          : {}),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (e) {
    // Blob پیکربندی نیست — هیچ تصویر قدیمی‌ای هم وجود ندارد؛ 404 صادقانه
    if (e instanceof ImageStorageUnavailableError) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }
    console.error('[images] legacy lookup failed:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Image not found' }, { status: 404 })
  }
}
