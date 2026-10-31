// ---------------------------------------------------------------------------
// 🗂️ /api/admin/files/[id] — replace / rename / delete an educational file
//
// PATCH (multipart) → replace the stored object and/or rename.
//   ⚠️ Replacing the object changes the URL content-address; rows referencing
//   the file keep pointing at this EducationalFile row, so every lesson that
//   uses it automatically shows the new content.
// DELETE → removes the DB row. The content-addressed Blob object is kept
//   (immutable cache, possible references in old snapshots) — storage can be
//   reaped from the Vercel dashboard if needed.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { isAuthorized, getAdminActor } from '@/lib/admin-auth'
import { isSameOrigin } from '@/lib/http-guard'
import { logAdminAction } from '@/lib/audit'
import { db } from '@/lib/db'
import {
  MAX_EDU_FILE_BYTES,
  detectEduFileType,
  refineEduType,
  saveEduFile,
  EduStorageUnavailableError,
  formatEduSize,
} from '@/lib/edu-files'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const { id } = await params
    const row = await db.educationalFile.findUnique({ where: { id } })
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const form = await req.formData()
    const data: { title?: string; fileName?: string; fileUrl?: string; isPrivate?: boolean; mimeType?: string; size?: number; kind?: string } = {}

    const title = form.get('title')
    if (typeof title === 'string') data.title = title.trim().slice(0, 120)

    const file = form.get('file')
    if (file instanceof File) {
      if (file.size <= 0 || file.size > MAX_EDU_FILE_BYTES) {
        return NextResponse.json(
          { error: `File must be between 1 byte and ${formatEduSize(MAX_EDU_FILE_BYTES)}.` },
          { status: 400 }
        )
      }
      const bytes = Buffer.from(await file.arrayBuffer())
      const detected = detectEduFileType(bytes)
      const refined = detected ? refineEduType(detected, file.name) : null
      if (!refined) {
        return NextResponse.json({ error: 'Unsupported file type for replacement.' }, { status: 400 })
      }
      const saved = await saveEduFile(refined.mime, refined.kind, refined.ext, bytes)
      data.fileName = file.name.slice(0, 180)
      data.fileUrl = saved.url
      data.isPrivate = saved.isPrivate
      data.mimeType = saved.mime
      data.size = saved.size
      data.kind = saved.kind
    }

    const updated = await db.educationalFile.update({ where: { id }, data })
    const actor = await getAdminActor(req)
    await logAdminAction({
      actor,
      action: 'eduFile.update',
      targetType: 'file',
      targetId: id,
      meta: { name: updated.fileName, replaced: file instanceof File },
    })
    return NextResponse.json({
      ok: true,
      file: {
        id: updated.id,
        title: updated.title,
        fileName: updated.fileName,
        mimeType: updated.mimeType,
        size: updated.size,
        kind: updated.kind,
        url: `/api/files/${updated.id}`,
        createdAt: updated.createdAt.toISOString(),
      },
    })
  } catch (err) {
    if (err instanceof EduStorageUnavailableError) {
      return NextResponse.json({ error: err.message }, { status: 503 })
    }
    console.error('[PATCH /api/admin/files/[id]] error:', err)
    return NextResponse.json({ error: 'Could not update the file' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const { id } = await params
    const row = await db.educationalFile.findUnique({ where: { id } })
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await db.educationalFile.delete({ where: { id } })
    const actor = await getAdminActor(req)
    await logAdminAction({
      actor,
      action: 'eduFile.delete',
      targetType: 'file',
      targetId: id,
      meta: { name: row.fileName },
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/admin/files/[id]] error:', err)
    return NextResponse.json({ error: 'Could not delete the file' }, { status: 500 })
  }
}
