// ---------------------------------------------------------------------------
// 📝 /api/hsk-exams — exam hub data (public, Part 3.1)
// GET → published exams grouped by level + (for signed-in students) their
// attempt history: best score, average, last attempts.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/user-auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const exams = await db.hskExam.findMany({
      where: { published: true },
      orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        level: true,
        examType: true,
        durationMin: true,
        passPercent: true,
        access: true,
        questionIds: true,
      },
    })

    const user = await getUserFromRequest(req).catch(() => null)
    let myAttempts: Array<{
      examId: string
      id: string
      percent: number | null
      passed: boolean | null
      status: string
      submittedAt: string | null
      scoreJson: string | null
    }> = []
    if (user) {
      const rows = await db.hskExamAttempt.findMany({
        where: { userId: user.id, status: { in: ['submitted', 'expired'] } },
        orderBy: { updatedAt: 'desc' },
        take: 200,
        select: {
          id: true,
          examId: true,
          scorePercent: true,
          passed: true,
          status: true,
          submittedAt: true,
          scoreJson: true,
        },
      })
      myAttempts = rows.map((r) => ({
        examId: r.examId,
        id: r.id,
        percent: r.scorePercent,
        passed: r.passed,
        status: r.status,
        submittedAt: r.submittedAt?.toISOString() ?? null,
        scoreJson: r.scoreJson,
      }))
    }

    // in-progress attempts the student can resume (server clock decides expiry)
    let resumable: Array<{ examId: string; attemptId: string; expiresAt: string | null }> = []
    if (user) {
      const rows = await db.hskExamAttempt.findMany({
        where: { userId: user.id, status: 'in_progress' },
        orderBy: { updatedAt: 'desc' },
        take: 20,
        select: { id: true, examId: true, expiresAt: true },
      })
      resumable = rows
        .filter((r) => !r.expiresAt || r.expiresAt.getTime() > Date.now())
        .map((r) => ({ examId: r.examId, attemptId: r.id, expiresAt: r.expiresAt?.toISOString() ?? null }))
    }

    return NextResponse.json({
      exams: exams.map((e) => ({
        ...e,
        questionCount: (JSON.parse(e.questionIds) as string[]).length,
        questionIds: undefined,
      })),
      myAttempts,
      resumable,
      authenticated: Boolean(user),
      firstName: user?.firstName,
    })
  } catch (err) {
    console.error('[GET /api/hsk-exams] error:', err)
    return NextResponse.json({ exams: [], myAttempts: [], resumable: [], authenticated: false })
  }
}
