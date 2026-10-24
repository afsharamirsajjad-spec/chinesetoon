// ---------------------------------------------------------------------------
// 🖼️ GET /api/images/c/[file] — سرو تصاویر محتوامحور (استور خصوصی Blob)
//
// file = «<sha256hex>.<ext>» — الگوی سخت‌گیرانه (ضد path traversal)؛
// در Blob جست‌وجو و با هدر Bearer سمت سرور استریم می‌شود (استور خصوصی).
// pathname محتوامحور است → خروجی تغییرناپذیر → کش دائمی امن.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { isContentImageFile, IMAGE_MIME_BY_EXT } from '@/lib/images'
import { headBlobFile, fetchBlobResponse } from '@/lib/blob-store'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ file: string }> }) {
  const { file: raw } = await ctx.params
  const file = raw.trim().toLowerCase()
  if (!isContentImageFile(file)) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 })
  }

  try {
    const blobUrl = await headBlobFile(`images/${file}`)
    if (!blobUrl) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }
    const upstream = await fetchBlobResponse(blobUrl)
    const ext = file.split('.').pop() ?? 'png'
    const mime = IMAGE_MIME_BY_EXT[ext] ?? 'image/png'
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
    console.error('[images/c] serve failed:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Image not found' }, { status: 404 })
  }
}
