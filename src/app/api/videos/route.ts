// ---------------------------------------------------------------------------
// 🎬 /api/videos — public teaching-video library (Part 6)
// GET → published videos ordered by sortOrder. Public, indexable data.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { youTubeThumbnailUrl } from '@/lib/videos'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const level = searchParams.get('level') ?? ''
    const category = searchParams.get('category') ?? ''

    const rows = await db.teachingVideo.findMany({
      where: {
        published: true,
        ...(level ? { level } : {}),
        ...(category ? { category } : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      take: 200,
    })

    return NextResponse.json({
      videos: rows.map((v) => ({
        id: v.id,
        title: v.title,
        teacher: v.teacher,
        level: v.level,
        category: v.category,
        description: v.description,
        durationLabel: v.durationLabel,
        thumbnailUrl: youTubeThumbnailUrl(v.youtubeId),
      })),
    })
  } catch (err) {
    console.error('[GET /api/videos] error:', err)
    return NextResponse.json({ videos: [] })
  }
}
