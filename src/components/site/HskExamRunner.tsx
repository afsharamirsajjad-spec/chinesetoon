'use client'

// ---------------------------------------------------------------------------
// 📝 HskExamRunner — /hsk-exams/[slug] (Part 3.7/3.8)
//
// Professional exam interface: countdown driven by the SERVER deadline
// (startedAt/expiresAt — the browser clock is untrusted), question
// navigation, autosave every 15s and on every answer (recovers after
// refresh), reading passages shared across questions, submission confirm,
// score with per-skill breakdown and the answer review when the exam allows
// it. Time expiry auto-submits whatever was saved.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  RotateCcw,
  Save,
  Trophy,
  XCircle,
} from 'lucide-react'
import { resilientJsonFetch } from '@/lib/client-fetch'
import { PinyinText } from './pinyin'
import { siteContent } from '@/content/site-content'

const HANZI = 'ct-hanzi'

interface RunnerQuestion {
  id: string
  kind: string
  prompt: string
  hanzi: string
  pinyin: string
  options: string[]
  matchLeft: string[]
  tiles: string[]
  points: number
  skill: string
  audioUrl: string | null
  imageUrl: string | null
  passageId: string | null
}

interface RunnerPassage {
  id: string
  title: string
  lines: Array<{ hanzi: string; pinyin: string; english: string }>
  notes: Array<{ word: string; meaning: string }>
}

export interface ExamStartPayload {
  attemptId: string
  resumed: boolean
  exam: { slug: string; title: string; durationMin: number; passPercent: number; allowPause: boolean; audioReplayLimit: number }
  expiresAt: string | null
  startedAt: string
  savedAnswers: Record<string, string | string[] | null>
  questions: RunnerQuestion[]
  passages: RunnerPassage[]
}

interface ScoreData {
  total: number
  max: number
  percent: number
  passed: boolean
  correct: number
  wrong: number
  unanswered: number
  timeSpentSec: number
  bySkill: Record<string, { score: number; max: number }>
}

interface ReviewRow {
  id: string
  correct: boolean
  unanswered: boolean
  prompt: string
  hanzi: string
  pinyin: string
  options: string[]
  picked: string | string[] | null
  answer: string
  explanation: string
  skill: string
}

type Phase = 'loading' | 'running' | 'grading' | 'result' | 'error'

function fmtTime(sec: number): string {
  const s = Math.max(0, sec)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export function HskExamRunner({ slug }: { slug: string }) {
  const [phase, setPhase] = useState<Phase>('loading')
  const [error, setError] = useState('')
  const [exam, setExam] = useState<ExamStartPayload['exam'] | null>(null)
  const [attemptId, setAttemptId] = useState('')
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)
  const [questions, setQuestions] = useState<RunnerQuestion[]>([])
  const [passages, setPassages] = useState<RunnerPassage[]>([])
  const [answers, setAnswers] = useState<Record<string, string | string[] | null>>({})
  const [index, setIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const [savedFlash, setSavedFlash] = useState(false)
  const [score, setScore] = useState<ScoreData | null>(null)
  const [review, setReview] = useState<ReviewRow[]>([])
  const [autoSubmitted, setAutoSubmitted] = useState(false)
  const [showPassage, setShowPassage] = useState<string | null>(null)
  const submittingRef = useRef(false)

  const start = useCallback(async () => {
    setPhase('loading')
    setError('')
    const res = await resilientJsonFetch<ExamStartPayload>(`/api/hsk-exams/${encodeURIComponent(slug)}/attempt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    if (!res.ok || !res.data?.questions) {
      setError(res.ok ? 'This exam could not be started.' : res.message)
      setPhase('error')
      return
    }
    setExam(res.data.exam)
    setAttemptId(res.data.attemptId)
    setExpiresAt(res.data.expiresAt ? new Date(res.data.expiresAt) : null)
    setQuestions(res.data.questions)
    setPassages(res.data.passages ?? [])
    setAnswers(res.data.savedAnswers ?? {})
    if (res.data.expiresAt) {
      const remaining = Math.max(0, Math.round((new Date(res.data.expiresAt).getTime() - Date.now()) / 1000))
      setSecondsLeft(res.data.exam.durationMin > 0 ? remaining : null)
    } else {
      setSecondsLeft(null)
    }
    setPhase('running')
  }, [slug])

  useEffect(() => {
    const t = setTimeout(() => void start(), 0)
    return () => clearTimeout(t)
  }, [start])

  // ⏱️ countdown from the server deadline
  useEffect(() => {
    if (phase !== 'running' || secondsLeft === null) return
    const iv = setInterval(() => setSecondsLeft((s) => (s === null ? null : Math.max(0, s - 1))), 1000)
    return () => clearInterval(iv)
  }, [phase, secondsLeft === null])

  const submit = useCallback(
    async (auto: boolean) => {
      if (submittingRef.current) return
      submittingRef.current = true
      setPhase('grading')
      const res = await resilientJsonFetch<{
        score: ScoreData
        review: ReviewRow[]
        autoSubmitted: boolean
      }>(`/api/hsk-exams/attempts/${attemptId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })
      submittingRef.current = false
      if (!res.ok || !res.data?.score) {
        setError(res.ok ? 'Could not grade the exam.' : res.message)
        setPhase('error')
        return
      }
      setScore(res.data.score)
      setReview(res.data.review ?? [])
      setAutoSubmitted(auto || res.data.autoSubmitted)
      setSecondsLeft(null)
      setPhase('result')
      window.scrollTo(0, 0)
    },
    [attemptId, answers]
  )

  // auto-submit at zero
  useEffect(() => {
    if (phase !== 'running' || secondsLeft !== 0) return
    const t = setTimeout(() => void submit(true), 0)
    return () => clearTimeout(t)
  }, [phase, secondsLeft, submit])

  // autosave — every 15s while running
  useEffect(() => {
    if (phase !== 'running' || !attemptId) return
    const iv = setInterval(async () => {
      await resilientJsonFetch(`/api/hsk-exams/attempts/${attemptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })
    }, 15000)
    return () => clearInterval(iv)
  }, [phase, attemptId, answers])

  const setAnswer = (qid: string, value: string | string[] | null) => {
    setAnswers((prev) => ({ ...prev, [qid]: value }))
    // lightweight save indicator (the 15s autosave persists it)
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1200)
  }

  const setMatchAnswer = (qid: string, leftIdx: number, option: string) => {
    setAnswers((prev) => {
      const row = Array.isArray(prev[qid]) ? [...(prev[qid] as string[])] : []
      row[leftIdx] = option
      return { ...prev, [qid]: row }
    })
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1200)
  }

  const toggleTile = (qid: string, tile: string) => {
    setAnswers((prev) => {
      const row = Array.isArray(prev[qid]) ? [...(prev[qid] as string[])] : []
      const pos = row.indexOf(tile)
      if (pos >= 0) row.splice(pos, 1)
      else row.push(tile)
      return { ...prev, [qid]: row }
    })
  }

  const ex = questions[index]
  const answeredCount = useMemo(
    () => questions.filter((q) => answers[q.id] && (!Array.isArray(answers[q.id]) || (answers[q.id] as string[]).length > 0)).length,
    [questions, answers]
  )
  const passage = ex?.passageId ? passages.find((p) => p.id === ex.passageId) : null

  // ---------------- phases ----------------
  if (phase === 'loading') {
    return (
      <div className="bg-white rounded-3xl border border-sage-light/20 p-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-sage-dark" aria-hidden="true" />
        <p className="text-sm text-brown-light" role="status">Preparing the exam…</p>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="bg-white rounded-3xl border border-sage-light/20 p-10 text-center">
        <XCircle className="w-10 h-10 mx-auto mb-3 text-peach-dark" aria-hidden="true" />
        <p role="alert" className="text-sm text-brown mb-5">{error}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button type="button" onClick={() => void start()} className="bg-sage text-brown-dark px-6 py-2.5 rounded-full text-sm font-bold hover:bg-sage-dark transition-colors cursor-pointer min-h-[44px]">
            Try again
          </button>
          <Link href="/hsk-exams" className="px-6 py-2.5 rounded-full text-sm font-semibold text-brown border border-sage-light/50 bg-white hover:border-sage transition-colors cursor-pointer min-h-[44px]">
            Back to exams
          </Link>
        </div>
      </div>
    )
  }

  if (phase === 'grading') {
    return (
      <div className="bg-white rounded-3xl border border-sage-light/20 p-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-sage-dark" aria-hidden="true" />
        <p className="text-sm text-brown-light" role="status">Grading your exam…</p>
      </div>
    )
  }

  if (phase === 'result' && score && exam) {
    return (
      <div className="animate-ct-fadeInUp space-y-6">
        {autoSubmitted && (
          <div className="bg-peach-light/30 border border-peach/40 rounded-2xl px-5 py-3.5 flex items-center gap-2.5 text-sm text-brown" role="alert">
            <AlertTriangle className="w-4.5 h-4.5 text-peach-dark flex-shrink-0" aria-hidden="true" />
            Time was up — the exam was submitted automatically with your saved answers.
          </div>
        )}
        <div className={`rounded-3xl border p-8 md:p-10 text-center ${score.passed ? 'bg-sage-light/25 border-sage/30' : 'bg-peach-light/25 border-peach/40'}`}>
          <span className={`w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center ${score.passed ? 'bg-sage text-brown-dark' : 'bg-peach text-brown-dark'}`} aria-hidden="true">
            {score.passed ? <Trophy className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-brown-dark mb-2">{score.passed ? 'Exam passed!' : 'Not passed this time'}</h2>
          <p className="text-xs font-semibold uppercase tracking-widest text-sage-dark mb-3">{exam.title} · pass line {exam.passPercent}%</p>
          <p className="text-5xl md:text-6xl font-bold text-brown-dark tabular-nums leading-none">
            {score.percent}
            <span className="text-2xl text-brown-light font-semibold">%</span>
          </p>
          <p className="text-sm text-brown mt-3">
            {score.total} / {score.max} points · {score.correct} correct · {score.wrong} wrong · {score.unanswered} unanswered · {fmtTime(score.timeSpentSec)} spent
          </p>
          {Object.keys(score.bySkill).length > 1 && (
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {Object.entries(score.bySkill).map(([skill, s]) => (
                <span key={skill} className="bg-white/70 rounded-full px-3.5 py-1.5 text-xs font-bold text-brown">
                  {skill}: {s.score}/{s.max}
                </span>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-7">
            <Link href="/hsk-exams" className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full text-sm font-semibold text-brown border border-sage-light/50 bg-white hover:border-sage transition-colors cursor-pointer min-h-[44px]">
              <RotateCcw className="w-4 h-4" aria-hidden="true" /> Back to exams
            </Link>
          </div>
        </div>

        {review.length > 0 && (
          <div className="bg-white rounded-3xl border border-sage-light/20 shadow-sm overflow-hidden">
            <div className="h-2.5 bg-gradient-to-r from-sage via-butter to-peach" aria-hidden="true" />
            <div className="p-6 md:p-10">
              <h3 className="text-base font-bold text-brown-dark mb-6 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-sage-dark" aria-hidden="true" /> Answer review
              </h3>
              <ol className="space-y-4">
                {review.map((r, i) => (
                  <li key={r.id} className={`rounded-2xl border p-5 ${r.correct ? 'bg-sage-light/15 border-sage/25' : r.unanswered ? 'bg-cream/70 border-sage-light/30' : 'bg-peach-light/20 border-peach/35'}`}>
                    <p className="text-sm font-semibold text-brown-dark leading-relaxed mb-2">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full bg-white text-[11px] font-bold mr-2 border ${r.correct ? 'border-sage/40 text-sage-dark' : 'border-peach/40 text-peach-dark'}`}>
                        {i + 1}
                      </span>
                      {r.prompt}
                    </p>
                    {r.hanzi && <p className={`${HANZI} text-lg text-brown-dark mb-2`}>{r.hanzi}</p>}
                    {r.pinyin && <p className="text-xs mb-2"><PinyinText pinyin={r.pinyin} /></p>}
                    {!r.unanswered && !r.correct && r.picked !== null && (
                      <p className="text-xs text-peach-dark mb-1">
                        Your answer: {Array.isArray(r.picked) ? r.picked.join(' · ') : r.picked || '(empty)'}
                      </p>
                    )}
                    {r.unanswered && <p className="text-xs text-brown-light mb-1">Left unanswered.</p>}
                    {r.answer && (
                      <p className={`text-xs font-bold ${r.correct ? 'text-sage-dark' : 'text-sage-dark'}`}>
                        {r.correct ? 'Correct!' : `Correct answer: ${r.answer}`}
                      </p>
                    )}
                    {r.explanation && <p className="text-xs text-brown-light mt-1.5 leading-relaxed">{r.explanation}</p>}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (!ex || !exam) return null

  // ---------------- running ----------------
  const row = Array.isArray(answers[ex.id]) ? (answers[ex.id] as string[]) : []

  return (
    <div className="bg-white rounded-3xl border border-sage-light/20 shadow-sm overflow-hidden">
      <div className="h-2.5 bg-gradient-to-r from-sage via-butter to-peach" aria-hidden="true" />
      <div className="p-6 md:p-10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-brown-dark truncate">{exam.title}</h2>
            <p className="text-xs text-brown-light mt-0.5">
              Question {index + 1} of {questions.length} · {answeredCount} answered
            </p>
          </div>
          <div className="flex items-center gap-3">
            {savedFlash && (
              <span className="text-[11px] text-sage-dark font-semibold inline-flex items-center gap-1">
                <Save className="w-3.5 h-3.5" aria-hidden="true" /> saved
              </span>
            )}
            {secondsLeft !== null && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-bold tabular-nums ${secondsLeft <= 60 ? 'bg-peach-light/40 text-brown' : 'bg-cream text-brown'}`}
                role="timer"
              >
                <Clock className="w-4 h-4 text-sage-dark" aria-hidden="true" /> {fmtTime(secondsLeft)}
              </span>
            )}
          </div>
        </div>

        <div className="h-2 bg-cream-dark rounded-full overflow-hidden mb-7" role="progressbar" aria-valuenow={index + 1} aria-valuemin={1} aria-valuemax={questions.length}>
          <div className="h-full bg-sage rounded-full transition-all duration-300" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
        </div>

        {/* reading passage */}
        {passage && (
          <div className="mb-5">
            <button
              type="button"
              onClick={() => setShowPassage(showPassage === passage.id ? null : passage.id)}
              className="w-full text-left bg-cream/60 border border-sage-light/30 rounded-2xl px-5 py-3.5 text-sm font-semibold text-brown-dark hover:border-sage transition-colors cursor-pointer flex items-center justify-between gap-3"
            >
              📖 Reading passage: {passage.title}
              <span className="text-xs text-brown-light">{showPassage === passage.id ? 'hide' : 'show'}</span>
            </button>
            {showPassage === passage.id && (
              <div className="mt-3 space-y-3 bg-cream/40 rounded-2xl p-5 border border-sage-light/25 animate-ct-fadeInUp">
                {passage.lines.map((line, i) => (
                  <div key={i}>
                    <p className={`${HANZI} text-lg text-brown-dark leading-relaxed`}>{line.hanzi}</p>
                    {line.pinyin && <p className="text-xs"><PinyinText pinyin={line.pinyin} /></p>}
                    {line.english && <p className="text-xs text-brown-light">{line.english}</p>}
                  </div>
                ))}
                {passage.notes.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {passage.notes.map((n, i) => (
                      <span key={i} className="bg-sage-light/20 rounded-full px-3 py-1 text-xs text-brown">
                        <span className={`${HANZI} font-semibold`}>{n.word}</span> — {n.meaning}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div key={ex.id} className="animate-ct-fadeInUp">
          <p className="text-base md:text-lg font-semibold text-brown-dark leading-relaxed mb-5">{ex.prompt}</p>
          {ex.hanzi && (
            <div className="bg-cream/60 rounded-2xl px-5 py-5 mb-5 text-center">
              <p className={`${HANZI} text-2xl md:text-3xl text-brown-dark font-medium leading-relaxed`}>{ex.hanzi}</p>
              {ex.pinyin && <p className="mt-2 text-sm"><PinyinText pinyin={ex.pinyin} /></p>}
            </div>
          )}
          {ex.imageUrl && (
            <div className="mb-5 flex justify-center">
              { }
              <img src={ex.imageUrl} alt="" className="max-h-64 rounded-2xl border border-sage-light/30" />
            </div>
          )}
          {ex.kind === 'listen' && ex.audioUrl && (
            <div className="flex flex-col items-center gap-3 mb-6">
              <audio controls src={ex.audioUrl} className="w-full max-w-sm" aria-label="Listening audio">
                <track kind="captions" />
              </audio>
              <p className="text-xs text-brown-light">
                {exam.audioReplayLimit > 0 ? `Replays allowed: ${exam.audioReplayLimit}` : 'Play as many times as you need.'}
              </p>
            </div>
          )}

          {/* mcq / truefalse / fill / listen */}
          {(ex.kind === 'mcq' || ex.kind === 'truefalse' || ex.kind === 'fill' || ex.kind === 'listen') && (
            <div className="space-y-3" role="radiogroup" aria-label={ex.prompt}>
              {ex.options.map((opt, oi) => {
                const picked = answers[ex.id] === opt
                return (
                  <button
                    key={oi}
                    type="button"
                    role="radio"
                    aria-checked={picked}
                    onClick={() => setAnswer(ex.id, opt)}
                    className={`w-full text-left rounded-2xl border px-5 py-4 text-sm transition-all cursor-pointer min-h-[52px] ${
                      picked ? 'bg-sage-light/30 border-sage text-brown-dark font-semibold' : 'bg-cream/40 border-sage-light/30 text-brown hover:border-sage hover:bg-sage-light/15'
                    }`}
                  >
                    <span className="inline-flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${picked ? 'bg-sage text-brown-dark' : 'bg-white border border-sage-light/50 text-brown-light'}`}>
                        {String.fromCharCode(65 + oi)}
                      </span>
                      <span className={/[一-鿿]/.test(opt) ? `${HANZI} text-base` : ''}>{opt}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {/* match */}
          {ex.kind === 'match' && (
            <div className="space-y-3">
              {ex.matchLeft.map((left, li) => (
                <div key={li} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <span className={`${HANZI} text-lg text-brown-dark bg-cream/60 rounded-xl px-4 py-2.5 sm:min-w-[180px] text-center`}>{left}</span>
                  <select
                    value={(row[li] as string) ?? ''}
                    onChange={(e) => setMatchAnswer(ex.id, li, e.target.value)}
                    aria-label={`Match “${left}”`}
                    className="flex-1 bg-white border border-sage-light/40 rounded-xl px-4 py-2.5 text-sm text-brown focus:outline-none focus:ring-2 focus:ring-sage/40 focus:border-sage cursor-pointer min-h-[44px]"
                  >
                    <option value="">Choose…</option>
                    {ex.options.map((opt, oi) => (
                      <option key={oi} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* order */}
          {ex.kind === 'order' && (
            <div>
              <div className="min-h-[64px] bg-cream/60 border-2 border-dashed border-sage-light/50 rounded-2xl p-3 mb-4 flex flex-wrap gap-2 items-center" aria-label="Your sentence">
                {row.length === 0 && <span className="text-xs text-brown-light px-2">Tap the words below in the right order…</span>}
                {row.map((tile, ti) => (
                  <button
                    key={`${tile}-${ti}`}
                    type="button"
                    onClick={() => toggleTile(ex.id, tile)}
                    className={`${HANZI} bg-sage text-brown-dark rounded-xl px-3.5 py-2 text-base font-medium shadow-sm hover:bg-sage-dark transition-colors cursor-pointer`}
                  >
                    {tile}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {ex.tiles.map((tile) => {
                  const used = row.includes(tile) && tile !== '' && row.filter((t) => t === tile).length >= ex.tiles.filter((t) => t === tile).length
                  return (
                    <button
                      key={tile}
                      type="button"
                      onClick={() => toggleTile(ex.id, tile)}
                      disabled={used}
                      className={`${HANZI} rounded-xl px-3.5 py-2 text-base border transition-all cursor-pointer min-h-[44px] ${
                        used ? 'bg-cream-dark text-brown-light/50 border-transparent cursor-not-allowed' : 'bg-white border-sage-light/40 text-brown-dark hover:border-sage hover:bg-sage-light/15'
                      }`}
                    >
                      {tile}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-8">
          <button
            type="button"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brown px-4 py-2.5 rounded-full bg-cream hover:bg-cream-dark transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Previous
          </button>
          {index < questions.length - 1 ? (
            <button
              type="button"
              onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
              className="inline-flex items-center gap-1.5 bg-sage text-brown-dark px-6 py-2.5 rounded-full text-sm font-bold hover:bg-sage-dark transition-colors cursor-pointer min-h-[44px]"
            >
              Next <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(siteContent.learn.exams.submitConfirm.replace('{answered}', String(answeredCount)).replace('{total}', String(questions.length)))) {
                  void submit(false)
                }
              }}
              className="inline-flex items-center gap-1.5 bg-sage text-brown-dark px-6 py-2.5 rounded-full text-sm font-bold hover:bg-sage-dark transition-colors cursor-pointer min-h-[44px]"
            >
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Submit exam
            </button>
          )}
        </div>
        <p className="text-[11px] text-brown-light mt-4">
          {questions.length - answeredCount} unanswered — answers are saved automatically and recovered if the page reloads.
        </p>
      </div>
    </div>
  )
}
