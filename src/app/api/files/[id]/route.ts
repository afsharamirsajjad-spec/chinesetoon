// ---------------------------------------------------------------------------
// 🗂️ GET /api/files/[id] — public access to an educational file
//
// Public blob objects → 302 to the permanent CDN URL (cacheable).
// Private-store objects → streamed through the server with the Blob token
// (same pattern as /api/images/c/*). Content is educational material that is
// already public to students (lesson audio, question images), so no auth is
// required here; admin listing/deletion stays behind the admin session.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { fetchEduFileResponse } from '@/lib/edu-files'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id || id.length > 40) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const row = await db.educationalFile.findUnique({ where: { id } })
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (row.isPrivate) {
      const upstream = await fetchEduFileResponse(row.fileUrl)
      if (!upstream.ok || !upstream.body) {
        return NextResponse.json({ error: 'File unavailable' }, { status: 502 })
      }
      return new Response(upstream.body, {
        status: 200,
        headers: {
          'Content-Type': row.mimeType || 'application/octet-stream',
          'Content-Length': String(row.size),
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(row.fileName)}`,
        },
      })
    }
    return NextResponse.redirect(row.fileUrl, 302)
  } catch (err) {
    console.error('[GET /api/files/[id]] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
