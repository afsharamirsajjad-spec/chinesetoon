'use client'

// ---------------------------------------------------------------------------
// 📝 HskExamHub — /hsk-exams (Part 3.1)
// Exams grouped by HSK level with duration / question count / pass line, the
// signed-in student's best & average scores per exam, resumable attempts and
// per-attempt history. Guests see a sign-in hint (free exams stay playable).
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ClipboardList, Clock, ListChecks, Loader2, Lock, PlayCircle, SearchX, Trophy, UserRound } from 'lucide-react'
import { resilientJsonFetch } from '@/lib/client-fetch'

interface ExamRow {
  id: string
  slug: string
  title: string
  description: string
  level: string
  examType: string
  durationMin: number
  passPercent: number
  access: string
  questionCount: number
}

interface MyAttempt {
  examId: string
  id: string
  percent: number | null
  passed: boolean | null
  status: string
  submittedAt: string | null
  scoreJson: string | null
}

interface HubData {
  exams: ExamRow[]
  myAttempts: MyAttempt[]
  resumable: Array<{ examId: string; attemptId: string; expiresAt: string | null }>
  authenticated: boolean
  firstName?: string
}

const LEVEL_LABELS: Record<string, string> = { hsk1: 'HSK 1', hsk2: 'HSK 2', hsk3: 'HSK 3' }
const TYPE_LABELS: Record<string, string> = {
  mock: 'Full Mock Exam',
  listening: 'Listening Practice',
  reading: 'Reading Practice',
  vocabulary: 'Vocabulary Test',
  grammar: 'Grammar Test',
  timed: 'Timed Practice',
  untimed: 'Untimed Practice',
}

function timeLeftOf(expiresAt: string | null): string {
  if (!expiresAt) return ''
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (ms <= 0) return 'expired'
  const min = Math.floor(ms / 60000)
  return min >= 60 ? `${Math.floor(min / 60)}h ${min % 60}m left` : `${min}m left`
}

export function HskExamHub() {
  const [data, setData] = useState<HubData | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [level, setLevel] = useState('')

  const load = useCallback(async () => {
    const res = await resilientJsonFetch<HubData>('/api/hsk-exams', { cache: 'no-store' })
    if (res.ok && res.data) {
      setData(res.data)
    } else {
      setData({ exams: [], myAttempts: [], resumable: [], authenticated: false })
      setLoadFailed(true)
    }
  }, [])

  useEffect(() => {
    // ⏱️ deferred — setState must not run synchronously inside the effect body
    const t = setTimeout(() => void load(), 0)
    return () => clearTimeout(t)
  }, [load])

  const byLevel = useMemo(() => {
    const map = new Map<string, ExamRow[]>()
    for (const e of data?.exams ?? []) {
      const list = map.get(e.level) ?? []
      list.push(e)
      map.set(e.level, list)
    }
    return [...map.entries()]
  }, [data])

  const statsFor = useCallback(
    (examId: string) => {
      const attempts = (data?.myAttempts ?? []).filter((a) => a.examId === examId && a.percent !== null)
      if (attempts.length === 0) return null
      const percents = attempts.map((a) => a.percent ?? 0)
      const best = Math.max(...percents)
      const avg = Math.round(percents.reduce((s, p) => s + p, 0) / percents.length)
      return { count: attempts.length, best, avg, passed: attempts.some((a) => a.passed) }
    },
    [data]
  )

  return (
    <div id="page-hsk-exams">
      <section className="pt-32 pb-12 md:pt-40 md:pb-14 relative overflow-hidden bg-cream">
        <div aria-hidden="true" className="absolute -top-10 -left-20 w-72 h-72 bg-butter/25 rounded-full blur-3xl"></div>
        <div className="char-bg top-12 right-[5%]" style={{ fontSize: '220px', opacity: 0.05 }} aria-hidden="true">
          考
        </div>
        <div className="max-w-4xl mx-auto px-6 relative text-center">
          <span className="inline-flex items-center gap-1.5 bg-sage-light/30 rounded-full px-4 py-1.5 mb-4 text-xs font-semibold uppercase tracking-widest text-sage-dark">
            <ClipboardList className="w-3.5 h-3.5" aria-hidden="true" /> HSK Exam Preparation
          </span>
          <h1 className="text-3xl md:text-5xl font-bold text-brown-dark mb-4">HSK Mock Exams</h1>
          <p className="text-brown-light max-w-2xl mx-auto">
            Real exam conditions — server-enforced timers, autosaved progress and full answer review.
            Practice is where you learn; this is where you rehearse the real test.
          </p>
          {data && !data.authenticated && (
            <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-3 bg-sage-light/20 border border-sage/25 rounded-2xl px-4 py-3">
              <p className="text-sm text-brown flex items-center gap-2">
                <UserRound className="w-4 h-4 text-sage-dark" aria-hidden="true" />
                Sign in to keep your exam history, scores and resumable attempts.
              </p>
              <Link href="/account" className="bg-sage text-brown-dark px-4 py-2 rounded-full text-sm font-bold hover:bg-sage-dark transition-colors cursor-pointer min-h-[36px] inline-flex items-center">
                Sign in
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="pb-28 pt-6">
        <div className="max-w-5xl mx-auto px-6">
          {data === null ? (
            <p className="text-sm text-brown-light flex items-center justify-center gap-2 py-16" role="status">
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Loading exams…
            </p>
          ) : data.exams.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-sage-light/50">
              <SearchX className="w-10 h-10 mx-auto mb-3 text-brown-light/50" aria-hidden="true" />
              <p className="text-sm text-brown-light">
                {loadFailed ? 'Could not load the exams — please refresh.' : 'No exams have been published yet — check back soon.'}
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {/* level filter */}
              <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by level">
                <button
                  type="button"
                  onClick={() => setLevel('')}
                  aria-pressed={level === ''}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer min-h-[38px] ${level === '' ? 'bg-sage text-brown-dark' : 'bg-white border border-sage-light/40 text-brown hover:border-sage'}`}
                >
                  All levels
                </button>
                {byLevel.map(([lv]) => (
                  <button
                    key={lv}
                    type="button"
                    onClick={() => setLevel(lv)}
                    aria-pressed={level === lv}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer min-h-[38px] ${level === lv ? 'bg-sage text-brown-dark' : 'bg-white border border-sage-light/40 text-brown hover:border-sage'}`}
                  >
                    {LEVEL_LABELS[lv] ?? lv}
                  </button>
                ))}
              </div>

              {byLevel
                .filter(([lv]) => level === '' || level === lv)
                .map(([lv, exams]) => (
                  <div key={lv}>
                    <h2 className="text-lg font-bold text-brown-dark mb-4">{LEVEL_LABELS[lv] ?? lv}</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                      {exams.map((e) => {
                        const stats = statsFor(e.id)
                        const resume = data.resumable.find((r) => r.examId === e.id)
                        return (
                          <div key={e.id} className="group bg-white rounded-2xl p-6 border border-sage-light/20 card-hover flex flex-col animate-ct-fadeInUp">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <span className="w-12 h-12 rounded-2xl bg-sage-light/30 flex items-center justify-center flex-shrink-0">
                                <ListChecks className="w-6 h-6 text-sage-dark" aria-hidden="true" />
                              </span>
                              <div className="flex flex-wrap items-center gap-2 justify-end">
                                <span className="bg-cream rounded-full px-3 py-1 text-[11px] font-bold text-brown">
                                  {TYPE_LABELS[e.examType] ?? e.examType}
                                </span>
                                {e.access === 'restricted' && !data.authenticated && (
                                  <span className="bg-peach-light/50 rounded-full px-2.5 py-1 text-[11px] font-bold text-brown inline-flex items-center gap-1">
                                    <Lock className="w-3 h-3" aria-hidden="true" /> sign in
                                  </span>
                                )}
                              </div>
                            </div>
                            <h3 className="text-base font-bold text-brown-dark mb-1.5">{e.title}</h3>
                            {e.description && <p className="text-sm text-brown-light leading-relaxed mb-4 flex-1">{e.description}</p>}
                            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold mb-4">
                              <span className="bg-cream rounded-full px-2.5 py-1 text-brown">{e.questionCount} questions</span>
                              {e.durationMin > 0 && (
                                <span className="bg-cream rounded-full px-2.5 py-1 text-brown inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3" aria-hidden="true" /> {e.durationMin} min
                                </span>
                              )}
                              <span className="bg-butter/30 rounded-full px-2.5 py-1 text-brown">pass ≥ {e.passPercent}%</span>
                            </div>
                            {stats && (
                              <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-brown mb-4 bg-cream/70 rounded-xl px-3.5 py-2.5">
                                <span className="inline-flex items-center gap-1">
                                  <Trophy className="w-3.5 h-3.5 text-sage-dark" aria-hidden="true" /> best {stats.best}%
                                </span>
                                <span>avg {stats.avg}%</span>
                                <span>{stats.count} attempt{stats.count > 1 ? 's' : ''}</span>
                                {stats.passed && <span className="text-sage-dark font-bold">✓ passed</span>}
                              </div>
                            )}
                            <div className="mt-auto flex flex-wrap items-center gap-3">
                              <Link
                                href={`/hsk-exams/${e.slug}`}
                                className="inline-flex items-center gap-1.5 bg-sage text-brown-dark px-5 py-2.5 rounded-full text-sm font-bold hover:bg-sage-dark transition-colors cursor-pointer min-h-[44px]"
                              >
                                <PlayCircle className="w-4 h-4" aria-hidden="true" />
                                {resume ? `Resume (${timeLeftOf(resume.expiresAt)})` : stats ? 'Retake exam' : 'Start exam'}
                                <ArrowRight className="w-4 h-4" aria-hidden="true" />
                              </Link>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}

              {/* attempt history */}
              {data.authenticated && data.myAttempts.length > 0 && (
                <div className="bg-white rounded-3xl border border-sage-light/20 p-6">
                  <h2 className="text-base font-bold text-brown-dark mb-4">My recent results</h2>
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {data.myAttempts.slice(0, 12).map((a) => {
                      const exam = data.exams.find((e) => e.id === a.examId)
                      return (
                        <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sage-light/25 px-4 py-2.5">
                          <p className="text-sm text-brown-dark font-semibold truncate">
                            {exam?.title ?? 'Exam'}
                            {a.status === 'expired' && <span className="ml-2 text-[10px] font-bold uppercase text-peach-dark">auto-submitted</span>}
                          </p>
                          <div className="flex items-center gap-3 text-xs">
                            {a.submittedAt && (
                              <span className="text-brown-light">
                                {new Date(a.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                              </span>
                            )}
                            <span className={`font-bold tabular-nums ${(a.passed ?? false) ? 'text-sage-dark' : 'text-peach-dark'}`}>
                              {a.percent ?? '—'}%
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
