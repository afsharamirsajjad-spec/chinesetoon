// ---------------------------------------------------------------------------
// 🗂️ /api/admin/files — Educational File Manager (admin only)
//
// GET  ?query=&kind=   → list files (metadata + how many lessons/questions
//                        reference each file) — keys never leave the admin.
// POST (multipart)     → upload a new file (file + optional title).
//                        Type is sniffed from magic bytes; only whitelisted
//                        formats pass; 4MB cap (Vercel serverless body limit).
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
  EduFileError,
  EduStorageUnavailableError,
  EDU_KINDS,
  formatEduSize,
} from '@/lib/edu-files'

export const dynamic = 'force-dynamic'

function safeJsonArray(raw: string): string[] {
  try {
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

async function buildUsageMap(): Promise<Map<string, number>> {
  const usage = new Map<string, number>()
  const bump = (id: string | null) => {
    if (!id) return
    usage.set(id, (usage.get(id) ?? 0) + 1)
  }
  const [words, readings, pronunciations, questions, stages] = await Promise.all([
    db.hskWord.findMany({ select: { audioFileId: true, imageFileId: true } }),
    db.hskReading.findMany({ select: { audioFileId: true } }),
    db.hskPronunciation.findMany({ select: { audioFileId: true } }),
    db.hskQuestion.findMany({ select: { audioFileId: true, imageFileId: true } }),
    db.hskStage.findMany({ select: { coverImageId: true } }),
  ])
  for (const w of words) {
    bump(w.audioFileId)
    bump(w.imageFileId)
  }
  for (const r of readings) bump(r.audioFileId)
  for (const p of pronunciations) bump(p.audioFileId)
  for (const q of questions) {
    bump(q.audioFileId)
    bump(q.imageFileId)
  }
  for (const s of stages) bump(s.coverImageId)
  return usage
}

export async function GET(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { searchParams } = new URL(req.url)
    const query = (searchParams.get('query') ?? '').trim().toLowerCase().slice(0, 80)
    const kind = searchParams.get('kind') ?? ''

    const rows = await db.educationalFile.findMany({
      where: kind && (EDU_KINDS as readonly string[]).includes(kind) ? { kind } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 500,
    })
    const usage = await buildUsageMap()

    const files = rows
      .filter((r) =>
        query
          ? r.fileName.toLowerCase().includes(query) ||
            r.title.toLowerCase().includes(query)
          : true
      )
      .map((r) => ({
        id: r.id,
        title: r.title,
        fileName: r.fileName,
        mimeType: r.mimeType,
        size: r.size,
        sizeLabel: formatEduSize(r.size),
        kind: r.kind,
        url: `/api/files/${r.id}`,
        createdAt: r.createdAt.toISOString(),
        usedBy: usage.get(r.id) ?? 0,
      }))
    return NextResponse.json({ files })
  } catch (err) {
    console.error('[GET /api/admin/files] error:', err)
    return NextResponse.json({ error: 'Could not load files' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized', message: 'Your admin session has expired — please sign in again.' }, { status: 401 })
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden', message: 'Cross-origin request rejected' }, { status: 403 })
  }
  try {
    const form = await req.formData()
    const file = form.get('file')
    const title = String(form.get('title') ?? '').trim().slice(0, 120)
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (file.size <= 0 || file.size > MAX_EDU_FILE_BYTES) {
      return NextResponse.json(
        { error: `File must be between 1 byte and ${formatEduSize(MAX_EDU_FILE_BYTES)}.` },
        { status: 400 }
      )
    }
    const bytes = Buffer.from(await file.arrayBuffer())
    const detected = detectEduFileType(bytes)
    if (!detected) {
      return NextResponse.json(
        { error: 'Unsupported file type. Allowed: PDF, DOCX, XLSX, CSV, TXT, MP3, WAV, M4A, MP4, JPG, PNG, WebP, GIF.' },
        { status: 400 }
      )
    }
    const refined = refineEduType(detected, file.name)
    if (!refined) {
      return NextResponse.json(
        { error: 'The file extension does not match its content (or is not whitelisted).' },
        { status: 400 }
      )
    }
    const saved = await saveEduFile(refined.mime, refined.kind, refined.ext, bytes)
    const row = await db.educationalFile.create({
      data: {
        title,
        fileName: file.name.slice(0, 180),
        fileUrl: saved.url,
        isPrivate: saved.isPrivate,
        mimeType: saved.mime,
        size: saved.size,
        kind: saved.kind,
      },
    })
    const actor = await getAdminActor(req)
    await logAdminAction({
      actor,
      action: 'eduFile.upload',
      targetType: 'file',
      targetId: row.id,
      meta: { name: row.fileName, kind: row.kind, size: row.size },
    })
    return NextResponse.json({
      ok: true,
      file: {
        id: row.id,
        title: row.title,
        fileName: row.fileName,
        mimeType: row.mimeType,
        size: row.size,
        kind: row.kind,
        url: `/api/files/${row.id}`,
        createdAt: row.createdAt.toISOString(),
        usedBy: 0,
      },
    })
  } catch (err) {
    if (err instanceof EduStorageUnavailableError) {
      return NextResponse.json({ error: err.message }, { status: 503 })
    }
    if (err instanceof EduFileError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    console.error('[POST /api/admin/files] error:', err)
    return NextResponse.json({ error: 'Could not upload the file' }, { status: 500 })
  }
}
