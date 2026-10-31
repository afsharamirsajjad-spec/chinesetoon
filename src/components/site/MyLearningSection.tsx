'use client'

// ---------------------------------------------------------------------------
// 📈 MyLearningSection — Account page card (Part 7)
// A signed-in student's learning snapshot: HSK 1 practice progress (overall %,
// modules, current stage) + recent exam results, with quick links.
// ---------------------------------------------------------------------------

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpenCheck, ClipboardList, Loader2, Trophy } from 'lucide-react'
import { resilientJsonFetch } from '@/lib/client-fetch'
import { computeSummary, emptyProgress, type ProgressSummary } from '@/lib/practice/hsk/progress-utils'
import type { Hsk1ProgressSummary } from '@/lib/practice/hsk/types'

interface ExamRow {
  id: string
  slug: string
  title: string
}
interface MyAttempt {
  examId: string
  id: string
  percent: number | null
  passed: boolean | null
  status: string
  submittedAt: string | null
}

export function MyLearningSection() {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<ProgressSummary>(computeSummary(emptyProgress()))
  const [exams, setExams] = useState<ExamRow[]>([])
  const [attempts, setAttempts] = useState<MyAttempt[]>([])
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      resilientJsonFetch<{ authenticated: boolean; progress?: Hsk1ProgressSummary }>('/api/practice/hsk/progress', { cache: 'no-store' }),
      resilientJsonFetch<{ exams: ExamRow[]; myAttempts: MyAttempt[]; authenticated: boolean }>('/api/hsk-exams', { cache: 'no-store' }),
    ]).then(([p, e]) => {
      if (cancelled) return
      if (p.ok && p.data?.authenticated && p.data.progress) {
        setAuthenticated(true)
        setSummary(computeSummary(p.data.progress))
      } else if (e.ok && e.data?.authenticated) {
        setAuthenticated(true)
      }
      if (e.ok && e.data) {
        setExams(e.data.exams)
        setAttempts(e.data.myAttempts ?? [])
      }
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-sage-light/25 p-6 flex items-center gap-3 text-sm text-brown-light" role="status">
        <Loader2 className="w-4 h-4 animate-spin text-sage-dark" aria-hidden="true" /> Loading your learning progress…
      </div>
    )
  }
  if (!authenticated) return null

  const examTitleById = new Map(exams.map((e) => [e.id, e]))

  return (
    <div className="bg-white rounded-3xl border border-sage-light/25 p-6">
      <h2 className="text-base font-bold text-brown-dark mb-4 flex items-center gap-2">
        <BookOpenCheck className="w-5 h-5 text-sage-dark" aria-hidden="true" /> My learning
      </h2>
      <div className="grid sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-cream/70 border border-sage-light/25 rounded-2xl px-4 py-3 text-center">
          <p className="text-2xl font-bold text-sage-dark tabular-nums">{summary.overallPercent}%</p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brown-light mt-0.5">HSK 1 progress</p>
        </div>
        <div className="bg-cream/70 border border-sage-light/25 rounded-2xl px-4 py-3 text-center">
          <p className="text-2xl font-bold text-sage-dark tabular-nums">
            {summary.completedModules}
            <span className="text-sm text-brown-light font-semibold"> / 40</span>
          </p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brown-light mt-0.5">modules done</p>
        </div>
        <div className="bg-cream/70 border border-sage-light/25 rounded-2xl px-4 py-3 text-center">
          <p className="text-2xl font-bold text-sage-dark tabular-nums">{summary.currentStage}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brown-light mt-0.5">current stage</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4 mb-2 text-sm">
        <Link href="/practice/hsk1" className="text-sage-dark font-semibold hover:underline cursor-pointer">
          Continue HSK 1 → Stage {summary.currentStage}
        </Link>
        <Link href="/hsk-exams" className="text-sage-dark font-semibold hover:underline cursor-pointer inline-flex items-center gap-1.5">
          <ClipboardList className="w-4 h-4" aria-hidden="true" /> Take a mock exam
        </Link>
      </div>
      {attempts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-sage-light/25">
          <p className="text-xs font-bold uppercase tracking-wider text-brown mb-2.5">Recent exam results</p>
          <div className="space-y-1.5">
            {attempts.slice(0, 4).map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-brown">{examTitleById.get(a.examId)?.title ?? 'Exam'}</span>
                <span className={`flex-shrink-0 font-bold tabular-nums inline-flex items-center gap-1 ${(a.passed ?? false) ? 'text-sage-dark' : 'text-peach-dark'}`}>
                  {(a.passed ?? false) && <Trophy className="w-3.5 h-3.5" aria-hidden="true" />}
                  {a.percent ?? '—'}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
