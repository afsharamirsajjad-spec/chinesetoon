// ---------------------------------------------------------------------------
// 🖼️ GET /api/images/[id] — سازگاری با URLهای تصویریِ قدیمیِ id-محور
//
// معماری جدید: آپلود مستقیماً URL دائمی CDN بلاب را برمی‌گرداند و همان در
// فیلدهای image دیتابیس ذخیره می‌شود — این مسیر فقط برای ارجاع‌های قدیمیِ
// «/api/images/<48hex>» است: در Blob جست‌وجو می‌شود و redirect می‌کند.
// چنین URLهایی هرگز روی Vercel کار نکرده‌اند (دیسک فقط-خواندنی) — پس هیچ
// محتوای واقعی از این مسیر وابسته نیست؛ حذف تصادفی محتوا رخ نمی‌دهد.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { findLegacyImageUrl } from '@/lib/images'
import { ImageStorageUnavailableError } from '@/lib/images'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: raw } = await ctx.params
  const id = raw.trim().toLowerCase()
  try {
    const url = await findLegacyImageUrl(id)
    if (url) return NextResponse.redirect(url, 302)
    return NextResponse.json({ error: 'Image not found' }, { status: 404 })
  } catch (e) {
    // Blob پیکربندی نیست — هیچ تصویر قدیمی‌ای هم وجود ندارد؛ 404 صادقانه
    if (e instanceof ImageStorageUnavailableError) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }
    console.error('[images] legacy lookup failed:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Image not found' }, { status: 404 })
  }
}
