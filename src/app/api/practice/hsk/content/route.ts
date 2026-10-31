// ---------------------------------------------------------------------------
// 📚 GET /api/practice/hsk/content?level=hsk1&stage=3 — full teaching content
// of one stage for the module pages. DB-first (admin-managed), static fallback.
// Public educational content; contains no answer keys.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { loadStageContent, HSK_LEVELS, type HskLevelKey } from '@/lib/practice/hsk/db-content'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const levelParam = (searchParams.get('level') ?? 'hsk1') as HskLevelKey
  const level = (HSK_LEVELS as readonly string[]).includes(levelParam) ? levelParam : 'hsk1'
  const stage = Number(searchParams.get('stage'))
  if (!Number.isInteger(stage) || stage < 1 || stage > 50) {
    return NextResponse.json({ error: 'Invalid stage' }, { status: 400 })
  }
  try {
    const content = await loadStageContent(level, stage)
    if (!content) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ content })
  } catch (err) {
    console.error('[GET /api/practice/hsk/content] error:', err)
    return NextResponse.json({ error: 'Could not load the stage content' }, { status: 500 })
  }
}
