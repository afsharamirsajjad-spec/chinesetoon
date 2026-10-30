import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAuthorized } from '@/lib/admin-auth'
import {
  MAX_RESOURCE_FORM_BYTES,
  RESOURCE_MIME_BY_EXT,
  resourceExtensionOf,
  sanitizeResourceName,
  sanitizeResourceTitle,
  sanitizeResourceDescription,
} from '@/lib/resources'
import { saveResourceFile, deleteResourceFile, generateResourceId } from '@/lib/resources-store'

// ---------------------------------------------------------------------------
// 📚 /api/resources — منابع عمومی دانلودی (کتاب/جزوه/صدا/ویدئو)
//
// GET   عمومی: فقط منابع منتشرشده (با x-admin-key + ?all=1 → همه، برای پنل)
// POST  مدیریت: multipart (فرم ≤۴MB، ذخیرهٔ سرور) یا JSON (فایلِ قبلاً
//       آپلودشدهٔ مستقیم مرورگر→Blob با توکن کوتاه‌عمر)
// DELETE مدیریت: حذف ردیف + فایل ذخیره‌شده
// ---------------------------------------------------------------------------

export const dynamic = 'force-dynamic'

interface ResourceRow {
  id: string
  title: string
  description: string
  fileName: string
  fileUrl: string
  fileSize: number
  mimeType: string
  downloads: number
  published: boolean
  sortOrder: number
  createdAt: Date
}

function publicView(r: ResourceRow) {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    fileName: r.fileName,
    fileUrl: r.fileUrl,
    fileSize: r.fileSize,
    mimeType: r.mimeType,
    downloads: r.downloads,
    published: r.published,
    sortOrder: r.sortOrder,
    createdAt: r.createdAt,
  }
}

export async function GET(req: NextRequest) {
  try {
    const admin = await isAuthorized(req)
    const wantsAll = req.nextUrl.searchParams.get('all') === '1'
    const rows = await db.resource.findMany({
      where: admin && wantsAll ? {} : { published: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      take: 500, // 🛡️ سقف دفاعی — پاسخ هرگز بی‌کران نیست
    })
    return NextResponse.json({ resources: rows.map(publicView) })
  } catch (err) {
    console.error('[GET /api/resources] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const contentType = req.headers.get('content-type') ?? ''

    // ---------- مسیر ۲: فایل از قبل مستقیم به Blob آپلود شده (JSON) ----------
    if (contentType.includes('application/json')) {
      const body = (await req.json().catch(() => null)) as {
        title?: string
        description?: string
        fileName?: string
        url?: string
        size?: number
        mime?: string
      } | null
      const url = (body?.url ?? '').trim()
      if (!/^https:\/\//.test(url)) {
        return NextResponse.json({ error: 'Invalid blob URL' }, { status: 400 })
      }
      const fileName = sanitizeResourceName(body?.fileName ?? '')
      const ext = resourceExtensionOf(fileName)
      if (!ext) {
        return NextResponse.json(
          { error: 'Unsupported file type — allowed: PDF, EPUB, DOC(X), PPT(X), XLS(X), ZIP, TXT, MP3, MP4, images.' },
          { status: 400 }
        )
      }
      const title = sanitizeResourceTitle(body?.title ?? '')
      if (!title) {
        return NextResponse.json({ error: 'Title is required' }, { status: 400 })
      }
      const created = await db.resource.create({
        data: {
          title,
          description: sanitizeResourceDescription(body?.description ?? ''),
          fileName,
          fileUrl: url,
          fileSize: Number.isFinite(body?.size) ? Math.max(0, Math.floor(body!.size!)) : 0,
          mimeType: (body?.mime ?? '').trim() || RESOURCE_MIME_BY_EXT[ext],
        },
      })
      return NextResponse.json({ ok: true, id: created.id }, { status: 201 })
    }

    // ---------- مسیر ۱: multipart فرم — ذخیرهٔ سرور (≤۴MB) ----------
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Expected multipart/form-data or JSON' }, { status: 400 })
    }
    const form = await req.formData()
    const file = form.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }
    if (file.size > MAX_RESOURCE_FORM_BYTES) {
      return NextResponse.json(
        { error: 'File is too large for the direct form upload (4MB). Use cloud upload — refresh the page and try again.' },
        { status: 413 }
      )
    }
    const fileName = sanitizeResourceName(file.name)
    const ext = resourceExtensionOf(fileName)
    if (!ext) {
      return NextResponse.json(
        { error: 'Unsupported file type — allowed: PDF, EPUB, DOC(X), PPT(X), XLS(X), ZIP, TXT, MP3, MP4, images.' },
        { status: 400 }
      )
    }
    const title = sanitizeResourceTitle(String(form.get('title') ?? ''))
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    const description = sanitizeResourceDescription(String(form.get('description') ?? ''))

    const id = generateResourceId()
    const data = Buffer.from(await file.arrayBuffer())
    const storedUrl = await saveResourceFile(id, ext, data)
    const created = await db.resource.create({
      data: {
        title,
        description,
        fileName,
        // Blob → URL کامل؛ FS محلی → نام فایل hex در پوشهٔ resources
        fileUrl: storedUrl ?? `${id}.${ext}`,
        fileSize: data.length,
        mimeType: file.type || RESOURCE_MIME_BY_EXT[ext],
      },
    })
    return NextResponse.json({ ok: true, id: created.id }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/resources] error:', err)
    return NextResponse.json({ error: 'Could not save the resource — try again.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = (await req.json().catch(() => null)) as { id?: string } | null
    const id = typeof body?.id === 'string' ? body.id : ''
    if (!id) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    const row = await db.resource.findUnique({ where: { id } })
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await deleteResourceFile(row.fileUrl)
    await db.resource.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/resources] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
