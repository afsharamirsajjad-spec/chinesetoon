// ---------------------------------------------------------------------------
// 🖼️ GET /api/images/[id] — سروِ تصاویر عمومی آپلودشدهٔ ادمین
//
// تصاویر پیش‌نمایش کلاس‌ها/مقالات عمومی‌اند — برخلاف رسیدها (خصوصی/مالکی‌محور)
// اینجا هیچ احرازی لازم نیست؛ فقط:
//  • id باید ۴۸ hex معتبر باشد (هیچ مسیری از ورودی کاربر ساخته نمی‌شود)
//  • پاسخ با Cache-Control immutable — شناسه هر آپلود یکتاست
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { readImageFile, isImageId, IMAGE_EXT_BY_MIME } from '@/lib/images'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const clean = id.trim().toLowerCase()
  if (!isImageId(clean)) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 })
  }

  const found = await readImageFile(clean)
  if (!found) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 })
  }

  const ext = IMAGE_EXT_BY_MIME[found.mime]
  return new NextResponse(new Uint8Array(found.data), {
    status: 200,
    headers: {
      'Content-Type': found.mime,
      'Content-Length': String(found.data.length),
      'Content-Disposition': `inline; filename="${clean}.${ext}"`,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
