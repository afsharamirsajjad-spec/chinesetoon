// ---------------------------------------------------------------------------
// 📊 /api/admin/exam-results — Exam Results & analytics (admin only, 3.9)
//
// GET ?format=csv → CSV download (Excel-compatible)
// GET (JSON)      → attempts list with filters (examId, level, from, to,
//                   student query) + aggregates: attempts, averages, pass
//                   rate, and the most-missed questions (wrong rate).
// Student identities appear only here (admin scope) — the public site never
// exposes another student's records.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { isAuthorized } from '@/lib/admin-auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

function csvCell(v: unknown): string {
  const s = String(v ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export async function GET(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { searchParams } = new URL(req.url)
    const format = searchParams.get('format') ?? 'json'
    const examId = searchParams.get('examId') ?? ''
    const level = searchParams.get('level') ?? ''
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const student = (searchParams.get('student') ?? '').trim().toLowerCase()

    const rows = await db.hskExamAttempt.findMany({
      where: {
        status: { in: ['submitted', 'expired'] },
        ...(examId ? { examId } : {}),
        ...(from || to
          ? {
              startedAt: {
                ...(from && !Number.isNaN(Date.parse(from)) ? { gte: new Date(from) } : {}),
                ...(to && !Number.isNaN(Date.parse(to)) ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}),
              },
            }
          : {}),
      },
      include: {
        exam: { select: { title: true, level: true, passPercent: true, examType: true } },
        version: { select: { payload: true } },
      },
      orderBy: { startedAt: 'desc' },
      take: 1000,
    })

    // student names (admin-only view)
    const userIds = [...new Set(rows.map((r) => r.userId).filter((x): x is string => Boolean(x)))]
    const users = userIds.length
      ? await db.user.findMany({ where: { id: { in: userIds } }, select: { id: true, firstName: true, lastName: true, email: true } })
      : []
    const userById = new Map(users.map((u) => [u.id, u]))

    let attempts = rows.map((r) => {
      const u = r.userId ? userById.get(r.userId) : null
      return {
        id: r.id,
        examTitle: r.exam.title,
        level: r.exam.level,
        examType: r.exam.examType,
        studentName: u ? `${u.firstName} ${u.lastName}` : 'Guest',
        studentEmail: u?.email ?? '',
        status: r.status,
        percent: r.scorePercent,
        passed: r.passed,
        timeSpentSec: (() => {
          try {
            const s = r.scoreJson ? (JSON.parse(r.scoreJson) as { timeSpentSec?: number }) : null
            return s?.timeSpentSec ?? null
          } catch {
            return null
          }
        })(),
        bySkill: (() => {
          try {
            const s = r.scoreJson ? (JSON.parse(r.scoreJson) as { bySkill?: Record<string, { score: number; max: number }> }) : null
            return s?.bySkill ?? null
          } catch {
            return null
          }
        })(),
        startedAt: r.startedAt.toISOString(),
        submittedAt: r.submittedAt?.toISOString() ?? null,
      }
    })

    if (student) {
      attempts = attempts.filter(
        (a) => a.studentName.toLowerCase().includes(student) || a.studentEmail.toLowerCase().includes(student)
      )
    }
    if (level && ['hsk1', 'hsk2', 'hsk3'].includes(level)) {
      attempts = attempts.filter((a) => a.level === level)
    }

    // aggregates
    const graded = attempts.filter((a) => a.percent !== null)
    const aggregates = {
      attempts: attempts.length,
      graded: graded.length,
      averagePercent: graded.length ? Math.round(graded.reduce((s, a) => s + (a.percent ?? 0), 0) / graded.length) : 0,
      passRate: graded.length ? Math.round((graded.filter((a) => a.passed).length / graded.length) * 100) : 0,
    }

    // most-missed questions — graded textually from each attempt's snapshot
    const missAgg = new Map<string, { prompt: string; asked: number; wrong: number }>()
    for (const r of rows.slice(0, 200)) {
      try {
        const payload = JSON.parse(r.version.payload) as {
          questions: Array<{
            id: string
            kind: string
            prompt: string
            options: string[]
            answerIndex: number | null
            matchLeft: string[]
            matchOptions: string[]
            tiles: string[]
          }>
        }
        const answers = JSON.parse(r.answers || '{}') as Record<string, string | string[] | null>
        for (const q of payload.questions) {
          const entry = missAgg.get(q.id) ?? { prompt: q.prompt, asked: 0, wrong: 0 }
          entry.asked++
          const a = answers[q.id] ?? null
          let ok = false
          if (q.kind === 'match' && Array.isArray(a)) {
            ok = q.matchLeft.every((_, i) => a[i] === q.matchOptions[i])
          } else if (q.kind === 'order' && Array.isArray(a)) {
            ok = a.join('') === q.tiles.join('')
          } else if (typeof a === 'string' && a.length > 0) {
            ok = a === (q.options[q.answerIndex ?? 0] ?? '')
          }
          if (!ok) entry.wrong++
          missAgg.set(q.id, entry)
        }
      } catch {
        // skip corrupt snapshots
      }
    }

    const missedQuestions = [...missAgg.entries()]
      .map(([id, e]) => ({ id, prompt: e.prompt, asked: e.asked, missed: e.wrong, missedRate: e.asked ? Math.round((e.wrong / e.asked) * 100) : 0 }))
      .sort((a, b) => b.missed - a.missed)
      .slice(0, 10)

    if (format === 'csv') {
      const header = [
        'Attempt ID', 'Exam', 'Level', 'Type', 'Student', 'Email', 'Status',
        'Percent', 'Passed', 'Time spent (s)', 'Started at', 'Submitted at',
      ]
      const lines = [header.join(',')]
      for (const a of attempts) {
        lines.push(
          [
            a.id, a.examTitle, a.level, a.examType, a.studentName, a.studentEmail,
            a.status, a.percent ?? '', a.passed ?? '', a.timeSpentSec ?? '',
            a.startedAt, a.submittedAt ?? '',
          ]
            .map(csvCell)
            .join(',')
        )
      }
      return new Response(`\uFEFF${lines.join('\n')}`, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="hsk-exam-results-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      })
    }

    return NextResponse.json({ attempts, aggregates, missedQuestions })
  } catch (err) {
    console.error('[GET /api/admin/exam-results] error:', err)
    return NextResponse.json({ error: 'Could not load exam results' }, { status: 500 })
  }
}
