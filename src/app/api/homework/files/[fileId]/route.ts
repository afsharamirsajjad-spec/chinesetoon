// ---------------------------------------------------------------------------
// 📚 GET /api/homework/files/[fileId] — دانلود امن فایل تکلیف/پاسخ
//
// دسترسی (کاملاً احرازشده — شناسهٔ 48hex غیرقابل‌حدس فقط لایهٔ اضافه است):
//  • ادمین: همهٔ فایل‌ها
//  • دانش‌پذیرِ واردشده: پیوست‌های تکلیفِ فعال + فایل‌های «پاسخ خودش»
//    (فایل پاسخ دیگران 404 می‌گیرد — بدون نشت)
// دانلود همیشه Content-Disposition: attachment + nosniff — فایل HTML/SVG
// قابل قبول نیست و هرگز در مرورگر رندر نمی‌شود.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/user-auth'
import { isAuthorized } from '@/lib/admin-auth'
import { readHomeworkFile, isHomeworkFileId, HOMEWORK_FILE_EXT_BY_MIME } from '@/lib/homework-files'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, ctx: { params: Promise<{ fileId: string }> }) {
  const { fileId: raw } = await ctx.params
  const fileId = raw.trim().toLowerCase()
  if (!isHomeworkFileId(fileId)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  const file = await db.homeworkFile.findUnique({
    where: { id: fileId },
    select: {
      name: true,
      mime: true,
      url: true,
      submissionId: true,
      homework: { select: { archived: true } },
    },
  })
  if (!file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  // 🔒 ادمین → همه؛ دانش‌پذیر → پیوست تکلیفِ فعال یا فایل پاسخِ خودش
  const admin = await isAuthorized(req)
  if (!admin) {
    const viewer = await getUserFromRequest(req).catch(() => null)
    if (!viewer) {
      return NextResponse.json({ error: 'Please sign in to download', code: 'AUTH_REQUIRED' }, { status: 401 })
    }
    if (file.submissionId) {
      const own = await db.homeworkSubmission.findUnique({
        where: { id: file.submissionId },
        select: { userId: true },
      })
      if (!own || own.userId !== viewer.id) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 })
      }
    } else if (file.homework.archived) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
  }

  // 🟢 Blob فعال است → redirect به URL بلاب (امضاشده نیست اما شناسه غیرقابل‌حدس است)
  if (file.url) {
    return NextResponse.redirect(file.url, 302)
  }

  // ذخیرهٔ محلی — از FS خوانده و attachment سرو می‌شود
  const ext = HOMEWORK_FILE_EXT_BY_MIME[file.mime]
  if (!ext) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
  const data = await readHomeworkFile(fileId, ext)
  if (!data) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
  const safeName = (file.name || `homework-${fileId}`).replace(/"/g, '')
  return new NextResponse(new Uint8Array(data), {
    status: 200,
    headers: {
      'Content-Type': file.mime,
      'Content-Length': String(data.length),
      'Content-Disposition': `attachment; filename="${safeName}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
