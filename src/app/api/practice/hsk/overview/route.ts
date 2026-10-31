// ---------------------------------------------------------------------------
// 📚 GET /api/practice/hsk/overview?level=hsk1 — stage list for the dashboards
// DB-first (admin-managed) with the bundled curriculum as fallback. Public,
// no personal data.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { loadLevelOverview, HSK_LEVELS, type HskLevelKey } from '@/lib/practice/hsk/db-content'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const levelParam = (searchParams.get('level') ?? 'hsk1') as HskLevelKey
  const level = (HSK_LEVELS as readonly string[]).includes(levelParam) ? levelParam : 'hsk1'
  try {
    const overview = await loadLevelOverview(level)
    return NextResponse.json(overview)
  } catch (err) {
    console.error('[GET /api/practice/hsk/overview] error:', err)
    return NextResponse.json({ error: 'Could not load the course overview' }, { status: 500 })
  }
}
