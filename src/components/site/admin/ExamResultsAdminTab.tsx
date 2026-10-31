'use client'

// ---------------------------------------------------------------------------
// 📊 ExamResultsAdminTab — Admin → Exam Results (Part 3.9)
// Attempts list with filters (exam, level, date range, student), aggregate
// stats (attempts / average / pass rate), most-missed questions, and CSV
// export for Excel.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useState } from 'react'
import { Download, Loader2, RefreshCw } from 'lucide-react'

interface AttemptRow {
  id: string
  examTitle: string
  level: string
  examType: string
  studentName: string
  studentEmail: string
  status: string
  percent: number | null
  passed: boolean | null
  timeSpentSec: number | null
  startedAt: string
  submittedAt: string | null
}

interface ResultsData {
  attempts: AttemptRow[]
  aggregates: { attempts: number; graded: number; averagePercent: number; passRate: number }
  missedQuestions: Array<{ id: string; prompt: string; asked: number; missed: number; missedRate: number }>
}

export function ExamResultsAdminTab({
  token,
  exams,
}: {
  token: string
  exams: Array<{ id: string; title: string }>
}) {
  const [data, setData] = useState<ResultsData | null>(null)
  const [examId, setExamId] = useState('')
  const [level, setLevel] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [student, setStudent] = useState('')

  const params = useCallback(() => {
    const p = new URLSearchParams()
    if (examId) p.set('examId', examId)
    if (level) p.set('level', level)
    if (from) p.set('from', from)
    if (to) p.set('to', to)
    if (student) p.set('student', student)
    return p.toString()
  }, [examId, level, from, to, student])

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/exam-results?${params()}`, {
        headers: { 'x-admin-key': token },
        cache: 'no-store',
      })
      if (!res.ok) {
        setData(null)
        return
      }
      setData(await res.json())
    } catch {
      setData(null)
    }
  }, [token, params])

  useEffect(() => {
    const t = setTimeout(() => void load(), 250)
    return () => clearTimeout(t)
  }, [load])

  const field =
    'bg-white border border-sage-light/40 rounded-full px-4 py-2 text-sm text-brown focus:outline-none focus:ring-2 focus:ring-sage/40 min-h-[38px]'

  return (
    <div className="space-y-6">
      {/* filters */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={examId} onChange={(e) => setExamId(e.target.value)} aria-label="Filter by exam" className={field}>
          <option value="">All exams</option>
          {exams.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title}
            </option>
          ))}
        </select>
        <select value={level} onChange={(e) => setLevel(e.target.value)} aria-label="Filter by level" className={field}>
          <option value="">All levels</option>
          <option value="hsk1">HSK 1</option>
          <option value="hsk2">HSK 2</option>
          <option value="hsk3">HSK 3</option>
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" className={field} />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" className={field} />
        <input type="search" value={student} onChange={(e) => setStudent(e.target.value)} placeholder="Student…" aria-label="Search student" className={field} />
        <button type="button" onClick={() => void load()} aria-label="Refresh" className="p-2.5 rounded-full bg-white border border-sage-light/40 text-brown hover:border-sage cursor-pointer">
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
        </button>
        <a
          href={`/api/admin/exam-results?${params()}&format=csv`}
          className="inline-flex items-center gap-1.5 bg-sage text-brown-dark px-4 py-2 rounded-full text-xs font-bold hover:bg-sage-dark cursor-pointer min-h-[38px]"
        >
          <Download className="w-3.5 h-3.5" aria-hidden="true" /> Export CSV
        </a>
      </div>

      {/* aggregates */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl border border-sage-light/25 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-sage-dark tabular-nums">{data.aggregates.attempts}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brown-light mt-0.5">attempts</p>
          </div>
          <div className="bg-white rounded-2xl border border-sage-light/25 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-sage-dark tabular-nums">{data.aggregates.averagePercent}%</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brown-light mt-0.5">average</p>
          </div>
          <div className="bg-white rounded-2xl border border-sage-light/25 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-sage-dark tabular-nums">{data.aggregates.passRate}%</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brown-light mt-0.5">pass rate</p>
          </div>
          <div className="bg-white rounded-2xl border border-sage-light/25 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-sage-dark tabular-nums">{data.aggregates.graded}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brown-light mt-0.5">graded</p>
          </div>
        </div>
      )}

      {/* most missed */}
      {data && data.missedQuestions.length > 0 && (
        <div className="bg-white rounded-2xl border border-sage-light/25 p-5">
          <h3 className="text-sm font-bold text-brown-dark mb-3">Most-missed questions</h3>
          <div className="space-y-1.5">
            {data.missedQuestions.map((q) => (
              <div key={q.id} className="flex items-center justify-between gap-3 text-xs bg-cream/60 rounded-xl px-3.5 py-2">
                <span className="truncate text-brown-dark">
                  <span className="ct-hanzi">{q.prompt}</span>
                </span>
                <span className="flex-shrink-0 font-bold text-brown">
                  {q.missed}/{q.asked} ({q.missedRate}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* attempts */}
      {data === null ? (
        <p className="text-sm text-brown-light flex items-center gap-2 py-10 justify-center" role="status">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Loading results…
        </p>
      ) : data.attempts.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-sage-light/50">
          <p className="text-sm text-brown-light">No exam attempts match these filters yet.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
          {data.attempts.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-sage-light/25 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-brown-dark font-medium truncate">
                  {a.examTitle} — {a.studentName}
                  {a.status === 'expired' && <span className="ml-2 text-[10px] font-bold uppercase text-peach-dark">auto-submitted</span>}
                </p>
                <p className="text-[11px] text-brown-light mt-0.5">
                  {a.studentEmail || 'guest'} · {a.level} ·{' '}
                  {a.submittedAt
                    ? new Date(a.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                    : a.startedAt}
                  {a.timeSpentSec ? ` · ${Math.floor(a.timeSpentSec / 60)}m ${a.timeSpentSec % 60}s` : ''}
                </p>
              </div>
              <span className={`text-sm font-bold tabular-nums flex-shrink-0 ${(a.passed ?? false) ? 'text-sage-dark' : 'text-peach-dark'}`}>
                {a.percent ?? '—'}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
