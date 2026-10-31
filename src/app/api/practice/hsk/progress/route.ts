// ---------------------------------------------------------------------------
// 📈 /api/practice/hsk/progress — structured HSK practice progress
//
// GET → signed-in user's learning progress + derived summary numbers.
//       Guests get { authenticated: false } (the client keeps local,
//       browser-only progress for them — it is never uploaded).
//
// Ownership: every query is scoped to the session user — one user's learning
// records are never exposed to another. The `data` JSON is built entirely
// server-side by mergeAttempt(); the client never sends a score.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/user-auth'
import { db } from '@/lib/db'
import { computeSummary, emptyProgress } from '@/lib/practice/hsk/builder'
import type { Hsk1ProgressSummary } from '@/lib/practice/hsk/types'

export const dynamic = 'force-dynamic'

function parseProgress(raw: string | null | undefined): Hsk1ProgressSummary {
  if (!raw) return emptyProgress()
  try {
    const parsed = JSON.parse(raw) as Hsk1ProgressSummary
    if (parsed && parsed.version === 1 && typeof parsed.stages === 'object' && parsed.stages) {
      return parsed
    }
  } catch {
    // corrupted snapshot — fall back to a fresh one rather than erroring
  }
  return emptyProgress()
}

export async function GET(req: NextRequest) {
  let user: Awaited<ReturnType<typeof getUserFromRequest>> = null
  try {
    user = await getUserFromRequest(req)
  } catch {
    // DB unreachable — degrade to guest mode (the client keeps local progress)
  }
  if (!user) {
    return NextResponse.json({ authenticated: false })
  }
  try {
    const row = await db.hskProgress.findUnique({ where: { userId: user.id } })
    const progress = parseProgress(row?.data)
    return NextResponse.json({
      authenticated: true,
      firstName: user.firstName,
      progress,
      ...computeSummary(progress),
    })
  } catch (e) {
    console.error('[GET /api/practice/hsk/progress] error:', e instanceof Error ? e.message : e)
    return NextResponse.json({ authenticated: false })
  }
}
