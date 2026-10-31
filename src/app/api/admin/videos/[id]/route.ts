// ---------------------------------------------------------------------------
// 🎬 /api/admin/videos/[id] — edit / reorder / publish / delete a video
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isAuthorized, getAdminActor } from '@/lib/admin-auth'
import { isSameOrigin } from '@/lib/http-guard'
import { logAdminAction } from '@/lib/audit'
import { db } from '@/lib/db'
import { extractYouTubeId, VIDEO_LEVELS, VIDEO_CATEGORIES } from '@/lib/videos'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  url: z.string().trim().min(5).max(500).optional(),
  title: z.string().trim().min(1).max(160).optional(),
  teacher: z.string().trim().max(80).optional(),
  level: z.enum(VIDEO_LEVELS).optional(),
  category: z.enum(VIDEO_CATEGORIES).optional(),
  description: z.string().trim().max(1200).optional(),
  durationLabel: z.string().trim().max(40).optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  published: z.boolean().optional(),
})

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
    const existing = await db.teachingVideo.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json().catch(() => null)
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid video data' }, { status: 400 })
    }
    const data: Record<string, unknown> = { ...parsed.data }
    if (parsed.data.url !== undefined) {
      const youtubeId = extractYouTubeId(parsed.data.url)
      if (!youtubeId) {
        return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
      }
      data.youtubeId = youtubeId
      delete data.url
    }
    const updated = await db.teachingVideo.update({ where: { id }, data })
    const actor = await getAdminActor(req)
    await logAdminAction({
      actor,
      action: 'video.update',
      targetType: 'video',
      targetId: id,
      meta: { title: updated.title },
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PATCH /api/admin/videos/[id]] error:', err)
    return NextResponse.json({ error: 'Could not update the video' }, { status: 500 })
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
    const existing = await db.teachingVideo.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await db.teachingVideo.delete({ where: { id } })
    const actor = await getAdminActor(req)
    await logAdminAction({
      actor,
      action: 'video.delete',
      targetType: 'video',
      targetId: id,
      meta: { title: existing.title },
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/admin/videos/[id]] error:', err)
    return NextResponse.json({ error: 'Could not delete the video' }, { status: 500 })
  }
}
