// ---------------------------------------------------------------------------
// 🎓 GET /api/lms/files/[fileId] — دانلود امن فایل مواد آموزشی
// دسترسی: ثبت‌نام‌شدهٔ همان کلاس | استادِ همان کلاس | ادمین — بقیه 404.
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

  const file = await db.materialFile.findUnique({
    where: { id: fileId },
    select: { name: true, mime: true, url: true, material: { select: { classId: true, published: true } } },
  })
  if (!file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  // 🔒 ادمین/استادِ همان کلاس → همه؛ دانش‌پذیر → فقط ثبت‌نام‌شدهٔ همان کلاس
  const admin = await isAuthorized(req)
  if (!admin) {
    const viewer = await getUserFromRequest(req).catch(() => null)
    if (!viewer) {
      return NextResponse.json({ error: 'Please sign in to download', code: 'AUTH_REQUIRED' }, { status: 401 })
    }
    const klass = await db.courseClass.findUnique({
      where: { id: file.material.classId },
      select: { teacherId: true },
    })
    const isClassTeacher = klass?.teacherId === viewer.id
    if (!isClassTeacher) {
      const enrolled = await db.classEnrollment.findUnique({
        where: { classId_userId: { classId: file.material.classId, userId: viewer.id } },
        select: { id: true },
      })
      if (!enrolled) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 })
      }
    }
  }

  if (file.url) {
    return NextResponse.redirect(file.url, 302)
  }

  const ext = HOMEWORK_FILE_EXT_BY_MIME[file.mime]
  if (!ext) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
  const data = await readHomeworkFile(fileId, ext)
  if (!data) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
  const safeName = (file.name || `material-${fileId}`).replace(/"/g, '')
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
