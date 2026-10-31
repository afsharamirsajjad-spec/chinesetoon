// ---------------------------------------------------------------------------
// 🎬 /api/admin/videos — Teaching Videos management (admin only)
// GET → full list (including unpublished) · POST → add from a pasted YouTube
// URL (the video ID is extracted and validated — never arbitrary HTML).
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isAuthorized, getAdminActor } from '@/lib/admin-auth'
import { isSameOrigin } from '@/lib/http-guard'
import { logAdminAction } from '@/lib/audit'
import { db } from '@/lib/db'
import { extractYouTubeId, youTubeThumbnailUrl, VIDEO_LEVELS, VIDEO_CATEGORIES } from '@/lib/videos'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  url: z.string().trim().min(5).max(500),
  title: z.string().trim().min(1).max(160),
  teacher: z.string().trim().max(80).default(''),
  level: z.enum(VIDEO_LEVELS).default('hsk1'),
  category: z.enum(VIDEO_CATEGORIES).default('general'),
  description: z.string().trim().max(1200).default(''),
  durationLabel: z.string().trim().max(40).default(''),
  sortOrder: z.number().int().min(0).max(9999).default(0),
  published: z.boolean().default(true),
})

export async function GET(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const rows = await db.teachingVideo.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      take: 500,
    })
    return NextResponse.json({
      videos: rows.map((v) => ({ ...v, thumbnailUrl: youTubeThumbnailUrl(v.youtubeId) })),
    })
  } catch (err) {
    console.error('[GET /api/admin/videos] error:', err)
    return NextResponse.json({ error: 'Could not load videos' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const body = await req.json().catch(() => null)
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid video data' }, { status: 400 })
    }
    const youtubeId = extractYouTubeId(parsed.data.url)
    if (!youtubeId) {
      return NextResponse.json(
        { error: 'Could not extract a valid YouTube video ID. Paste a youtube.com/watch, youtu.be or youtube.com/shorts link.' },
        { status: 400 }
      )
    }
    const row = await db.teachingVideo.create({
      data: {
        youtubeId,
        title: parsed.data.title,
        teacher: parsed.data.teacher,
        level: parsed.data.level,
        category: parsed.data.category,
        description: parsed.data.description,
        durationLabel: parsed.data.durationLabel,
        sortOrder: parsed.data.sortOrder,
        published: parsed.data.published,
      },
    })
    const actor = await getAdminActor(req)
    await logAdminAction({
      actor,
      action: 'video.create',
      targetType: 'video',
      targetId: row.id,
      meta: { title: row.title, youtubeId },
    })
    return NextResponse.json({ ok: true, id: row.id })
  } catch (err) {
    console.error('[POST /api/admin/videos] error:', err)
    return NextResponse.json({ error: 'Could not add the video' }, { status: 500 })
  }
}
