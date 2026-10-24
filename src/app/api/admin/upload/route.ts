// ---------------------------------------------------------------------------
// 🖼️ POST /api/admin/upload — آپلود تصویر از پنل ادمین (معماری production)
//
// کلاینت‌های وابسته: ClassesAdminTab (تصویر کلاس) + AdminPage (تصویر مقاله)
// قرارداد: FormData فیلد «file» + هدر x-admin-key → پاسخ { url }
//
// ذخیره‌سازی: Vercel Blob (تنها بک‌اند دائمی) با pathname محتوامحور
// (sha256 → ضد duplicate). URL برگشتی مستقیم در فیلدهای image دیتابیس ذخیره
// می‌شود و از CDN بلاب سرو می‌گردد — هیچ وابستگی به دیسک سرور نیست.
//
// امنیت:
//  • فقط ادمین (سشن x-admin-key) — مهمان ۴۰۱ می‌گیرد
//  • نوع فایل از magic bytes تشخیص داده می‌شود؛ فقط JPEG/PNG/WEBP/GIF
//  • سقف ۴ مگابایت (Content-Length + file.size هر دو چک می‌شوند) — زیر حد
//    4.5MB بدنهٔ serverless Vercel
//  • ثبت اقدام در Audit Log
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { isAuthorized, getAdminActor } from '@/lib/admin-auth'
import { isSameOrigin } from '@/lib/http-guard'
import {
  MAX_IMAGE_BYTES,
  detectImageType,
  saveImageFile,
  ImageStorageUnavailableError,
} from '@/lib/images'
import { logAdminAction } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Your admin session has expired — please sign in again.', code: 'AUTH_REQUIRED' },
      { status: 401 }
    )
  }

  // 🛡️ سیاست مبدأ (mutation) — بدنه multipart است، سقف حجم جداگانه چک می‌شود
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden', message: 'Cross-origin request rejected' }, { status: 403 })
  }

  // سقف حجم بدنه — قبل از خواندن formData (زیر حد serverless Vercel)
  const contentLength = Number(req.headers.get('content-length') || '0')
  if (contentLength > MAX_IMAGE_BYTES + 64 * 1024) {
    return NextResponse.json(
      { error: 'The image is too large (max 4 MB)', message: 'The image is too large (max 4 MB)', code: 'FILE_TOO_LARGE' },
      { status: 413 }
    )
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data', message: 'Invalid form data' }, { status: 400 })
  }

  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: 'Image file is required', message: 'Image file is required', code: 'FILE_REQUIRED' },
      { status: 400 }
    )
  }

  if (file.size <= 0) {
    return NextResponse.json({ error: 'The selected file is empty', message: 'The selected file is empty', code: 'FILE_EMPTY' }, { status: 400 })
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: 'The image is too large (max 4 MB)', message: 'The image is too large (max 4 MB)', code: 'FILE_TOO_LARGE' },
      { status: 413 }
    )
  }

  // 🔬 نوع واقعی فایل از محتوا — ادعای مرورگر (file.type) هرگز قابل‌اعتماد نیست
  const bytes = Buffer.from(await file.arrayBuffer())
  const detected = detectImageType(bytes)
  if (!detected) {
    return NextResponse.json(
      { error: 'Only JPG, PNG, WEBP or GIF images are accepted', message: 'Only JPG, PNG, WEBP or GIF images are accepted', code: 'FILE_TYPE' },
      { status: 415 }
    )
  }

  try {
    const saved = await saveImageFile(detected.mime, bytes)
    logAdminAction({
      actor: getAdminActor(req),
      action: 'upload.image',
      targetType: 'IMAGE',
      targetId: saved.id,
      meta: { mime: detected.mime, size: bytes.length },
    })
    return NextResponse.json({ ok: true, url: saved.url }, { status: 201 })
  } catch (e) {
    // ☁️ Blob پیکربندی نیست — پیام کاملاً قابل‌اقدام برای مالک
    if (e instanceof ImageStorageUnavailableError) {
      return NextResponse.json(
        { error: e.message, message: e.message, code: 'STORAGE_UNAVAILABLE' },
        { status: 503 }
      )
    }
    console.error('[admin/upload] save failed:', e instanceof Error ? e.message : e)
    return NextResponse.json(
      { error: 'Could not save the image. Please try again.', message: 'Could not save the image. Please try again.' },
      { status: 500 }
    )
  }
}
