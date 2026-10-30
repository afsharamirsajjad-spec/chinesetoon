'use client'

// ---------------------------------------------------------------------------
// 📝 ExamsHub — صفحهٔ آزمون‌ها (/exams)
//
// جریان: فهرست آزمون‌های منتشرشده → اجرای آزمون (سؤال‌به‌سؤال، تایمر اختیاری)
// → نمره‌دهی سمت سرور → اعلام نمره + بازخورد سؤال‌به‌سؤال.
// امنیت: پاسخ درست هرگز در GET عمومی نیست؛ نمره‌دهی همیشه POST سمت سرور است
// (دستکاری کلاینت بی‌اثر) و rate-limit دارد.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  Clock,
  ListChecks,
  Loader2,
  RotateCcw,
  SearchX,
  Sparkles,
  Trophy,
  XCircle,
} from 'lucide-react'
import { resilientJsonFetch } from '@/lib/client-fetch'
import { siteContent } from '@/content/site-content'

const c = siteContent.learn.exams

interface ExamMeta {
  id: string
  slug: string
  title: string
  description: string
  level: string
  durationMin: number
  passPercent: number
  questionCount: number
}

interface PublicQuestion {
  q: string
  options: string[]
}

interface ExamDetail {
  id: string
  slug: string
  title: string
  description: string
  level: string
  durationMin: number
  passPercent: number
  questions: PublicQuestion[]
}

interface ReviewRow {
  q: string
  options: string[]
  answer: number
  picked: number | null
  correct: boolean
}

interface GradeResult {
  score: number
  maxScore: number
  percent: number
  passed: boolean
  review: ReviewRow[]
}

type Phase = 'list' | 'running' | 'grading' | 'result'

export function ExamsHub() {
  const [exams, setExams] = useState<ExamMeta[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)

  const [phase, setPhase] = useState<Phase>('list')
  const [exam, setExam] = useState<ExamDetail | null>(null)
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [index, setIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const [result, setResult] = useState<GradeResult | null>(null)
  const [error, setError] = useState('')

  // فهرست آزمون‌ها
  useEffect(() => {
    let cancelled = false
    fetch('/api/exams', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return
        setExams(Array.isArray(data?.exams) ? data.exams : [])
      })
      .catch(() => {
        if (!cancelled) {
          setExams([])
          setLoadFailed(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const startExam = useCallback(async (slug: string) => {
    setError('')
    const res = await resilientJsonFetch<{ exam?: ExamDetail }>(
      `/api/exams/${encodeURIComponent(slug)}`,
      { cache: 'no-store' }
    )
    if (!res.ok || !res.data?.exam) {
      setError('Could not load the exam — please try again.')
      return
    }
    const detail = res.data.exam
    setExam(detail)
    setAnswers(new Array(detail.questions.length).fill(null))
    setIndex(0)
    setResult(null)
    setSecondsLeft(detail.durationMin > 0 ? detail.durationMin * 60 : null)
    setPhase('running')
    window.scrollTo(0, 0)
  }, [])

  const submitExam = useCallback(async () => {
    if (!exam) return
    setPhase('grading')
    const res = await resilientJsonFetch<{
      score: number
      maxScore: number
      percent: number
      passed: boolean
      review: ReviewRow[]
    }>(`/api/exams/${encodeURIComponent(exam.slug)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    })
    if (!res.ok || !res.data) {
      setError('Could not grade the exam — please try again.')
      setPhase('running')
      return
    }
    setResult({
      score: res.data.score,
      maxScore: res.data.maxScore,
      percent: res.data.percent,
      passed: res.data.passed,
      review: res.data.review ?? [],
    })
    setSecondsLeft(null)
    setPhase('result')
    window.scrollTo(0, 0)
  }, [exam, answers])

  const answeredCount = answers.filter((a) => a !== null).length

  // ⏱️ تایمر آزمون زمان‌دار — کاهش هر ثانیه تا صفر
  useEffect(() => {
    if (phase !== 'running' || secondsLeft === null) return
    const iv = setInterval(() => {
      setSecondsLeft((s) => (s === null ? null : Math.max(0, s - 1)))
    }, 1000)
    return () => clearInterval(iv)
  }, [phase, secondsLeft === null])

  // ⏱️ زمان تمام شد → ارسال خودکار (در callback تایمر، نه sync در بدنهٔ effect)
  useEffect(() => {
    if (phase !== 'running' || secondsLeft !== 0) return
    const t = setTimeout(() => void submitExam(), 0)
    return () => clearTimeout(t)
  }, [phase, secondsLeft, submitExam])

  const backToList = () => {
    setPhase('list')
    setExam(null)
    setResult(null)
    setSecondsLeft(null)
    setError('')
  }

  const fmtTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div id="page-exams">
      {/* ================= هیرو ================= */}
      <section className="pt-32 pb-12 md:pt-40 md:pb-14 relative overflow-hidden bg-cream">
        <div
          aria-hidden="true"
          className="absolute -top-10 -left-20 w-72 h-72 bg-butter/25 rounded-full blur-3xl"
        ></div>
        <div className="char-bg top-12 right-[5%]" style={{ fontSize: '220px', opacity: 0.05 }} aria-hidden="true">
          试
        </div>
        <div className="max-w-4xl mx-auto px-6 relative text-center">
          <span className="inline-flex items-center gap-1.5 bg-sage-light/30 rounded-full px-4 py-1.5 mb-4 text-xs font-semibold uppercase tracking-widest text-sage-dark">
            <ClipboardList className="w-3.5 h-3.5" aria-hidden="true" /> {c.eyebrow}
          </span>
          <h1 className="text-3xl md:text-5xl font-bold text-brown-dark mb-4">{c.title}</h1>
          <p className="text-brown-light max-w-2xl mx-auto">{c.subtitle}</p>
        </div>
      </section>

      <section className="pb-28 pt-6">
        <div className="max-w-5xl mx-auto px-6">
          {error && (
            <p role="alert" className="mb-6 text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          {/* ================= ۱) فهرست آزمون‌ها ================= */}
          {phase === 'list' && (
            exams === null ? (
              <p className="text-sm text-brown-light flex items-center justify-center gap-2 py-16" role="status">
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Loading exams…
              </p>
            ) : exams.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-sage-light/50">
                <SearchX className="w-10 h-10 mx-auto mb-3 text-brown-light/50" aria-hidden="true" />
                <p className="text-sm text-brown-light">{loadFailed ? 'Could not load the exams — please refresh.' : c.noExams}</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {exams.map((e, i) => (
                  <div
                    key={e.id}
                    className="group bg-white rounded-2xl p-6 border border-sage-light/20 card-hover flex flex-col animate-ct-fadeInUp"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <span className="w-12 h-12 rounded-2xl bg-sage-light/30 flex items-center justify-center flex-shrink-0">
                        <ListChecks className="w-6 h-6 text-sage-dark" aria-hidden="true" />
                      </span>
                      {e.level && (
                        <span className="bg-cream rounded-full px-3 py-1 text-[11px] font-bold text-brown">{e.level}</span>
                      )}
                    </div>
                    <h2 className="text-base font-bold text-brown-dark mb-1.5">{e.title}</h2>
                    {e.description && (
                      <p className="text-sm text-brown-light leading-relaxed mb-4 flex-1">{e.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold mb-5">
                      <span className="bg-cream rounded-full px-2.5 py-1 text-brown">
                        {e.questionCount} {c.questionsLabel}
                      </span>
                      {e.durationMin > 0 && (
                        <span className="bg-cream rounded-full px-2.5 py-1 text-brown inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" aria-hidden="true" /> {e.durationMin} {c.minutesLabel}
                        </span>
                      )}
                      <span className="bg-butter/30 rounded-full px-2.5 py-1 text-brown">
                        {c.passLabel} ≥ {e.passPercent}%
                      </span>
                    </div>
                    <button
                      onClick={() => void startExam(e.slug)}
                      className="mt-auto self-start inline-flex items-center gap-1.5 bg-sage text-brown-dark px-5 py-2.5 rounded-full text-sm font-bold hover:bg-sage-dark transition-colors cursor-pointer min-h-[44px]"
                    >
                      {c.startLabel} <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )
          )}

          {/* ================= ۲) اجرای آزمون ================= */}
          {phase === 'running' && exam && (
            <div className="bg-white rounded-3xl border border-sage-light/20 shadow-sm overflow-hidden">
              <div className="h-2.5 bg-gradient-to-r from-sage via-butter to-peach" aria-hidden="true" />
              <div className="p-6 md:p-10">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-brown-dark truncate">{exam.title}</h2>
                    <p className="text-xs text-brown-light mt-0.5">
                      {c.questionOf.replace('{n}', String(index + 1)).replace('{total}', String(exam.questions.length))}
                    </p>
                  </div>
                  {secondsLeft !== null && (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-bold tabular-nums ${
                        secondsLeft <= 60 ? 'bg-peach-light/40 text-brown' : 'bg-cream text-brown'
                      }`}
                    >
                      <Clock className="w-4 h-4 text-sage-dark" aria-hidden="true" /> {c.timeLeft}: {fmtTime(secondsLeft)}
                    </span>
                  )}
                </div>

                {/* نوار پیشرفت */}
                <div className="h-2 bg-cream-dark rounded-full overflow-hidden mb-8" role="progressbar" aria-valuenow={index + 1} aria-valuemin={1} aria-valuemax={exam.questions.length}>
                  <div
                    className="h-full bg-sage rounded-full transition-all duration-300"
                    style={{ width: `${((index + 1) / exam.questions.length) * 100}%` }}
                  />
                </div>

                {/* سؤال فعلی */}
                {exam.questions[index] && (
                  <div className="animate-ct-fadeInUp">
                    <p className="text-lg md:text-xl font-semibold text-brown-dark leading-relaxed mb-6">
                      {exam.questions[index].q}
                    </p>
                    <div className="space-y-3" role="radiogroup" aria-label={exam.questions[index].q}>
                      {exam.questions[index].options.map((opt, oi) => {
                        const picked = answers[index] === oi
                        return (
                          <button
                            key={oi}
                            type="button"
                            role="radio"
                            aria-checked={picked}
                            onClick={() =>
                              setAnswers((prev) => prev.map((a, i) => (i === index ? oi : a)))
                            }
                            className={`w-full text-left rounded-2xl border px-5 py-4 text-sm transition-all cursor-pointer min-h-[52px] ${
                              picked
                                ? 'bg-sage-light/30 border-sage text-brown-dark font-semibold'
                                : 'bg-cream/40 border-sage-light/30 text-brown hover:border-sage hover:bg-sage-light/15'
                            }`}
                          >
                            <span className="inline-flex items-center gap-3">
                              <span
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${
                                  picked ? 'bg-sage text-brown-dark' : 'bg-white border border-sage-light/50 text-brown-light'
                                }`}
                              >
                                {String.fromCharCode(65 + oi)}
                              </span>
                              {opt}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* ناوبری */}
                <div className="flex flex-wrap items-center justify-between gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setIndex((i) => Math.max(0, i - 1))}
                    disabled={index === 0}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-brown px-4 py-2.5 rounded-full bg-cream hover:bg-cream-dark transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
                  >
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" /> {c.prevLabel}
                  </button>
                  {index < exam.questions.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setIndex((i) => Math.min(exam.questions.length - 1, i + 1))}
                      className="inline-flex items-center gap-1.5 bg-sage text-brown-dark px-6 py-2.5 rounded-full text-sm font-bold hover:bg-sage-dark transition-colors cursor-pointer min-h-[44px]"
                    >
                      {c.nextLabel} <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(c.submitConfirm.replace('{answered}', String(answeredCount)).replace('{total}', String(exam.questions.length)))) {
                          void submitExam()
                        }
                      }}
                      className="inline-flex items-center gap-1.5 bg-sage text-brown-dark px-6 py-2.5 rounded-full text-sm font-bold hover:bg-sage-dark transition-colors cursor-pointer min-h-[44px]"
                    >
                      <ListChecks className="w-4 h-4" aria-hidden="true" /> {c.submitLabel}
                    </button>
                  )}
                </div>
                {answeredCount < exam.questions.length && (
                  <p className="text-[11px] text-brown-light mt-4">
                    {exam.questions.length - answeredCount} unanswered — you can go back any time before submitting.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ================= ۳) در حال نمره‌دهی ================= */}
          {phase === 'grading' && (
            <div className="bg-white rounded-3xl border border-sage-light/20 p-16 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-sage-dark" aria-hidden="true" />
              <p className="text-sm text-brown-light">{c.grading}</p>
            </div>
          )}

          {/* ================= ۴) نتیجه و بازخورد ================= */}
          {phase === 'result' && exam && result && (
            <div className="animate-ct-fadeInUp space-y-6">
              <div
                className={`rounded-3xl border p-8 md:p-10 text-center ${
                  result.passed ? 'bg-sage-light/25 border-sage/30' : 'bg-peach-light/25 border-peach/40'
                }`}
              >
                <span
                  className={`w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center ${
                    result.passed ? 'bg-sage text-brown-dark' : 'bg-peach text-brown-dark'
                  }`}
                  aria-hidden="true"
                >
                  {result.passed ? <Trophy className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                </span>
                <h2 className="text-xl md:text-2xl font-bold text-brown-dark mb-2">
                  {result.passed ? c.passedTitle : c.failedTitle}
                </h2>
                <p className="text-xs font-semibold uppercase tracking-widest text-sage-dark mb-3">{c.scoreLine}</p>
                <p className="text-5xl md:text-6xl font-bold text-brown-dark tabular-nums leading-none">
                  {result.percent}
                  <span className="text-2xl text-brown-light font-semibold">%</span>
                </p>
                <p className="text-sm text-brown mt-3">
                  {result.score} / {result.maxScore} — {exam.title}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 mt-7">
                  <button
                    type="button"
                    onClick={() => void startExam(exam.slug)}
                    className="inline-flex items-center gap-1.5 bg-sage text-brown-dark px-6 py-2.5 rounded-full text-sm font-bold hover:bg-sage-dark transition-colors cursor-pointer min-h-[44px]"
                  >
                    <RotateCcw className="w-4 h-4" aria-hidden="true" /> {c.retakeLabel}
                  </button>
                  <button
                    type="button"
                    onClick={backToList}
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full text-sm font-semibold text-brown border border-sage-light/50 bg-white hover:border-sage transition-colors cursor-pointer min-h-[44px]"
                  >
                    {c.backLabel}
                  </button>
                </div>
              </div>

              {/* بازخورد سؤال‌به‌سؤال */}
              <div className="bg-white rounded-3xl border border-sage-light/20 shadow-sm overflow-hidden">
                <div className="h-2.5 bg-gradient-to-r from-peach via-butter to-sage" aria-hidden="true" />
                <div className="p-6 md:p-10">
                  <h3 className="text-base font-bold text-brown-dark mb-6 flex items-center gap-2">
                    <Sparkles className="w-4.5 h-4.5 text-sage-dark" aria-hidden="true" /> {c.reviewTitle}
                  </h3>
                  <ol className="space-y-4">
                    {result.review.map((r, i) => (
                      <li
                        key={i}
                        className={`rounded-2xl border p-5 ${
                          r.correct ? 'bg-sage-light/15 border-sage/25' : 'bg-peach-light/20 border-peach/35'
                        }`}
                      >
                        <p className="text-sm font-semibold text-brown-dark leading-relaxed mb-3">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white text-[11px] font-bold mr-2 border border-sage-light/40">
                            {i + 1}
                          </span>
                          {r.q}
                        </p>
                        <ul className="space-y-1.5 text-sm">
                          {r.options.map((opt, oi) => {
                            const isCorrect = oi === r.answer
                            const isPicked = oi === r.picked
                            return (
                              <li
                                key={oi}
                                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 ${
                                  isCorrect
                                    ? 'bg-sage/20 text-brown-dark font-semibold'
                                    : isPicked
                                      ? 'bg-peach/25 text-brown'
                                      : 'text-brown-light'
                                }`}
                              >
                                <span className="text-[11px] font-bold w-5">{String.fromCharCode(65 + oi)}</span>
                                <span className="min-w-0 flex-1">{opt}</span>
                                {isPicked && !isCorrect && (
                                  <span className="text-[10px] font-bold text-peach-dark whitespace-nowrap">
                                    {c.yourAnswer}
                                  </span>
                                )}
                                {isCorrect && (
                                  <span className="text-[10px] font-bold text-sage-dark whitespace-nowrap">
                                    {c.correctAnswer}
                                  </span>
                                )}
                                {isPicked && r.picked === null && (
                                  <span className="text-[10px] font-bold text-brown-light whitespace-nowrap">
                                    {c.unanswered}
                                  </span>
                                )}
                              </li>
                            )
                          })}
                        </ul>
                      </li>
                    ))}
                  </ol>
                  <div className="text-center mt-8">
                    <Link
                      href="/practice"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-sage-dark hover:underline cursor-pointer"
                    >
                      Practice more in the Practice Hub <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
