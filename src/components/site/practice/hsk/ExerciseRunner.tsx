'use client'

// ---------------------------------------------------------------------------
// 🧩 ExerciseRunner — the shared quiz engine for all four HSK modules
//
// Fetches the module's 10 exercises from the API (no answer keys reach the
// browser), runs them one by one, then submits to the server for grading.
// The correct answer is never revealed before submission — only in the
// per-question review AFTER the server has graded the attempt.
//
// Supported exercise kinds: mcq · truefalse · fill · match · order · listen
// (listen exercises replay through the site TTS engine as often as needed).
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  ListChecks,
  RotateCcw,
  Trophy,
  XCircle,
} from 'lucide-react'
import { resilientJsonFetch } from '@/lib/client-fetch'
import { PinyinText } from '../../pinyin'
import { SpeakButton } from './ui'
import type { useHskProgress } from './use-hsk-progress'
import type { ClientExercise, GradeResult, HskModuleKind, ReviewRow, SubmittedAnswer } from '@/lib/practice/hsk/types'

type Phase = 'loading' | 'running' | 'grading' | 'result' | 'error'

const HANZI = 'ct-hanzi'

interface ExerciseRunnerProps {
  stage: number
  module: HskModuleKind
  quizTitle: string
  backHref: string
  backLabel: string
  submit: ReturnType<typeof useHskProgress>['submit']
  onPassed?: () => void
}

export function ExerciseRunner({ stage, module, quizTitle, backHref, backLabel, submit, onPassed }: ExerciseRunnerProps) {
  const [phase, setPhase] = useState<Phase>('loading')
  const [exercises, setExercises] = useState<ClientExercise[]>([])
  const [answers, setAnswers] = useState<SubmittedAnswer[]>([])
  const [index, setIndex] = useState(0)
  const [result, setResult] = useState<GradeResult | null>(null)
  const [error, setError] = useState('')
  const loadRunRef = useRef(0)

  const load = useCallback(async () => {
    const runId = ++loadRunRef.current
    setPhase('loading')
    setError('')
    const res = await resilientJsonFetch<{ exercises: ClientExercise[] }>(
      `/api/practice/hsk/hsk1/${stage}/${module}`,
      { cache: 'no-store' }
    )
    // a newer load (retake / remount) superseded this one — discard its result
    if (runId !== loadRunRef.current) return
    if (!res.ok || !res.data?.exercises?.length) {
      setError(res.ok ? 'No exercises found for this module.' : res.message)
      setPhase('error')
      return
    }
    setExercises(res.data.exercises)
    setAnswers(new Array(res.data.exercises.length).fill(null))
    setIndex(0)
    setResult(null)
    setPhase('running')
  }, [stage, module])

  useEffect(() => {
    // ⏱️ deferred — setState must not run synchronously inside the effect body.
    // StrictMode's double-invoke is safe: cleanup clears the first timeout.
    const t = setTimeout(() => void load(), 0)
    return () => clearTimeout(t)
  }, [load])

  const ex = exercises[index]
  const answeredCount = useMemo(
    () => answers.filter((a) => (Array.isArray(a) ? a.every((v) => v !== null) : a !== null)).length,
    [answers]
  )

  const setAnswer = (value: SubmittedAnswer) =>
    setAnswers((prev) => prev.map((a, i) => (i === index ? value : a)))

  const setMatchAnswer = (leftIdx: number, optionIdx: number) =>
    setAnswers((prev) => {
      const row = prev[index]
      const arr = Array.isArray(row) ? [...row] : new Array(ex?.matchLeft?.length ?? 0).fill(null)
      arr[leftIdx] = optionIdx
      return prev.map((a, i) => (i === index ? arr : a))
    })

  const toggleTile = (tileIdx: number) =>
    setAnswers((prev) => {
      const row = prev[index]
      const arr = Array.isArray(row) ? [...row] : []
      const pos = arr.indexOf(tileIdx)
      if (pos >= 0) arr.splice(pos, 1)
      else arr.push(tileIdx)
      return prev.map((a, i) => (i === index ? arr : a))
    })

  const handleSubmit = useCallback(async () => {
    if (!exercises.length) return
    setPhase('grading')
    const outcome = await submit(stage, module, answers)
    if (!outcome.ok || !outcome.result) {
      setError(outcome.message ?? 'Could not grade the attempt — please try again.')
      setPhase('error')
      return
    }
    if (outcome.result.passed) onPassed?.()
    setResult(outcome.result)
    setPhase('result')
    window.scrollTo(0, 0)
  }, [exercises.length, submit, stage, module, answers, onPassed])

  const retake = () => void load()

  // ------------------------------------------------------------------
  // phases
  // ------------------------------------------------------------------
  if (phase === 'loading') {
    return (
      <div className="bg-white rounded-3xl border border-sage-light/20 p-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-sage-dark" aria-hidden="true" />
        <p className="text-sm text-brown-light" role="status">Loading the exercises…</p>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="bg-white rounded-3xl border border-sage-light/20 p-10 text-center">
        <XCircle className="w-10 h-10 mx-auto mb-3 text-peach-dark" aria-hidden="true" />
        <p role="alert" className="text-sm text-brown mb-5">{error}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={retake}
            className="inline-flex items-center gap-1.5 bg-sage text-brown-dark px-6 py-2.5 rounded-full text-sm font-bold hover:bg-sage-dark transition-colors cursor-pointer min-h-[44px]"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" /> Try again
          </button>
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full text-sm font-semibold text-brown border border-sage-light/50 bg-white hover:border-sage transition-colors cursor-pointer min-h-[44px]"
          >
            {backLabel}
          </Link>
        </div>
      </div>
    )
  }

  if (phase === 'grading') {
    return (
      <div className="bg-white rounded-3xl border border-sage-light/20 p-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-sage-dark" aria-hidden="true" />
        <p className="text-sm text-brown-light" role="status">Checking your answers…</p>
      </div>
    )
  }

  if (phase === 'result' && result) {
    return (
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
          <h3 className="text-xl md:text-2xl font-bold text-brown-dark mb-2">
            {result.passed ? 'Module completed!' : 'Almost there!'}
          </h3>
          <p className="text-xs font-semibold uppercase tracking-widest text-sage-dark mb-3">Your score</p>
          <p className="text-5xl md:text-6xl font-bold text-brown-dark tabular-nums leading-none">
            {result.percent}
            <span className="text-2xl text-brown-light font-semibold">%</span>
          </p>
          <p className="text-sm text-brown mt-3">
            {result.score} / {result.max} correct — {result.passed ? '80% or more passes this module.' : 'You need 80% to pass. Review and try again!'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-7">
            <button
              type="button"
              onClick={retake}
              className="inline-flex items-center gap-1.5 bg-sage text-brown-dark px-6 py-2.5 rounded-full text-sm font-bold hover:bg-sage-dark transition-colors cursor-pointer min-h-[44px]"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" /> Retake
            </button>
            <Link
              href={backHref}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full text-sm font-semibold text-brown border border-sage-light/50 bg-white hover:border-sage transition-colors cursor-pointer min-h-[44px]"
            >
              {backLabel}
            </Link>
          </div>
        </div>

        {/* per-question review — answers revealed only now, after grading */}
        <div className="bg-white rounded-3xl border border-sage-light/20 shadow-sm overflow-hidden">
          <div className="h-2.5 bg-gradient-to-r from-sage via-butter to-peach" aria-hidden="true" />
          <div className="p-6 md:p-10">
            <h3 className="text-base font-bold text-brown-dark mb-6 flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-sage-dark" aria-hidden="true" /> Answer review
            </h3>
            <ol className="space-y-4">
              {result.review.map((row, i) => (
                <ReviewItem key={row.id} row={row} n={i + 1} />
              ))}
            </ol>
          </div>
        </div>
      </div>
    )
  }

  if (!ex) return null

  // ------------------------------------------------------------------
  // running — one question at a time
  // ------------------------------------------------------------------
  return (
    <div className="bg-white rounded-3xl border border-sage-light/20 shadow-sm overflow-hidden">
      <div className="h-2.5 bg-gradient-to-r from-sage via-butter to-peach" aria-hidden="true" />
      <div className="p-6 md:p-10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h3 className="text-lg font-bold text-brown-dark">{quizTitle}</h3>
          <span className="text-xs text-brown-light font-semibold tabular-nums">
            Question {index + 1} of {exercises.length}
          </span>
        </div>

        <div
          className="h-2 bg-cream-dark rounded-full overflow-hidden mb-8"
          role="progressbar"
          aria-valuenow={index + 1}
          aria-valuemin={1}
          aria-valuemax={exercises.length}
        >
          <div
            className="h-full bg-sage rounded-full transition-all duration-300"
            style={{ width: `${((index + 1) / exercises.length) * 100}%` }}
          />
        </div>

        <div key={ex.id} className="animate-ct-fadeInUp">
          <p className="text-base md:text-lg font-semibold text-brown-dark leading-relaxed mb-5">{ex.prompt}</p>

          {/* Chinese prompt display */}
          {ex.hanzi && (
            <div className="bg-cream/60 rounded-2xl px-5 py-5 mb-5 text-center">
              <p className={`${HANZI} text-2xl md:text-3xl text-brown-dark font-medium leading-relaxed`}>{ex.hanzi}</p>
              {ex.pinyin && (
                <p className="mt-2 text-sm">
                  <PinyinText pinyin={ex.pinyin} />
                </p>
              )}
            </div>
          )}

          {/* image-based questions */}
          {ex.imageUrl && (
            <div className="mb-5 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ex.imageUrl} alt="" className="max-h-64 rounded-2xl border border-sage-light/30" />
            </div>
          )}

          {/* audio for listen exercises — uploaded file first, TTS fallback */}
          {ex.kind === 'listen' && (ex.audioUrl || ex.audio) && (
            <div className="flex flex-col items-center gap-3 mb-6">
              {ex.audioUrl ? (
                <audio controls src={ex.audioUrl} className="w-full max-w-sm" aria-label="Listening audio">
                  <track kind="captions" />
                </audio>
              ) : (
                <SpeakButton text={ex.audio ?? ''} size="lg" />
              )}
              <p className="text-xs text-brown-light">
                {ex.audioUrl ? 'Play the audio as many times as you need.' : 'Tap to listen — replay as many times as you need.'}
              </p>
            </div>
          )}

          {/* ---- mcq / truefalse / fill: option buttons ---- */}
          {(ex.kind === 'mcq' || ex.kind === 'truefalse' || ex.kind === 'fill') && (
            <div className="space-y-3" role="radiogroup" aria-label={ex.prompt}>
              {(ex.options ?? []).map((opt, oi) => {
                const picked = answers[index] === oi
                return (
                  <button
                    key={oi}
                    type="button"
                    role="radio"
                    aria-checked={picked}
                    onClick={() => setAnswer(oi)}
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
                      <span className={/[一-鿿]/.test(opt) ? `${HANZI} text-base` : ''}>{opt}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {/* ---- listen: same option buttons (audio above) ---- */}
          {ex.kind === 'listen' && (
            <div className="space-y-3" role="radiogroup" aria-label={ex.prompt}>
              {(ex.options ?? []).map((opt, oi) => {
                const picked = answers[index] === oi
                return (
                  <button
                    key={oi}
                    type="button"
                    role="radio"
                    aria-checked={picked}
                    onClick={() => setAnswer(oi)}
                    className={`w-full text-left rounded-2xl border px-5 py-4 text-sm transition-all cursor-pointer min-h-[52px] ${
                      picked
                        ? 'bg-sage-light/30 border-sage text-brown-dark font-semibold'
                        : 'bg-cream/40 border-sage-light/30 text-brown hover:border-sage hover:bg-sage-light/15'
                    }`}
                  >
                    <span className={`inline-flex items-center gap-3 ${/[一-鿿]/.test(opt) ? `${HANZI} text-base` : ''}`}>
                      {opt}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {/* ---- match: one dropdown per left item ---- */}
          {ex.kind === 'match' && ex.matchLeft && (
            <div className="space-y-3">
              {ex.matchLeft.map((left, li) => {
                const row = Array.isArray(answers[index]) ? (answers[index] as number[]) : []
                const value = typeof row[li] === 'number' ? row[li] : ''
                return (
                  <div key={li} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <span className={`${HANZI} text-lg text-brown-dark bg-cream/60 rounded-xl px-4 py-2.5 sm:min-w-[180px] text-center`}>
                      {left}
                    </span>
                    <select
                      value={value}
                      onChange={(e) => setMatchAnswer(li, e.target.value === '' ? -1 : Number(e.target.value))}
                      aria-label={`Match “${left}”`}
                      className="flex-1 bg-white border border-sage-light/40 rounded-xl px-4 py-2.5 text-sm text-brown focus:outline-none focus:ring-2 focus:ring-sage/40 focus:border-sage cursor-pointer min-h-[44px]"
                    >
                      <option value="">Choose…</option>
                      {(ex.options ?? []).map((opt, oi) => (
                        <option key={oi} value={oi}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                )
              })}
            </div>
          )}

          {/* ---- order: tap tiles to build the sentence ---- */}
          {ex.kind === 'order' && ex.tiles && (
            <div>
              <div
                className="min-h-[64px] bg-cream/60 border-2 border-dashed border-sage-light/50 rounded-2xl p-3 mb-4 flex flex-wrap gap-2 items-center"
                aria-label="Your sentence"
              >
                {(Array.isArray(answers[index]) ? (answers[index] as number[]) : []).map((tileIdx) => (
                  <button
                    key={tileIdx}
                    type="button"
                    onClick={() => toggleTile(tileIdx)}
                    className={`${HANZI} bg-sage text-brown-dark rounded-xl px-3.5 py-2 text-base font-medium shadow-sm hover:bg-sage-dark transition-colors cursor-pointer`}
                  >
                    {ex.tiles?.[tileIdx]}
                  </button>
                ))}
                {(Array.isArray(answers[index]) ? (answers[index] as number[]) : []).length === 0 && (
                  <span className="text-xs text-brown-light px-2">Tap the words below in the right order…</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {ex.tiles.map((tile, ti) => {
                  const used = Array.isArray(answers[index]) && (answers[index] as number[]).includes(ti)
                  return (
                    <button
                      key={ti}
                      type="button"
                      onClick={() => toggleTile(ti)}
                      disabled={used}
                      aria-pressed={used}
                      className={`${HANZI} rounded-xl px-3.5 py-2 text-base border transition-all cursor-pointer min-h-[44px] ${
                        used
                          ? 'bg-cream-dark text-brown-light/50 border-transparent cursor-not-allowed'
                          : 'bg-white border-sage-light/40 text-brown-dark hover:border-sage hover:bg-sage-light/15'
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
          {index < exercises.length - 1 ? (
            <button
              type="button"
              onClick={() => setIndex((i) => Math.min(exercises.length - 1, i + 1))}
              className="inline-flex items-center gap-1.5 bg-sage text-brown-dark px-6 py-2.5 rounded-full text-sm font-bold hover:bg-sage-dark transition-colors cursor-pointer min-h-[44px]"
            >
              Next <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Submit ${answeredCount} of ${exercises.length} answered questions for grading?`)) {
                  void handleSubmit()
                }
              }}
              className="inline-flex items-center gap-1.5 bg-sage text-brown-dark px-6 py-2.5 rounded-full text-sm font-bold hover:bg-sage-dark transition-colors cursor-pointer min-h-[44px]"
            >
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Submit answers
            </button>
          )}
        </div>
        {answeredCount < exercises.length && (
          <p className="text-[11px] text-brown-light mt-4">
            {exercises.length - answeredCount} unanswered — you can move back and forth before submitting.
          </p>
        )}
      </div>
    </div>
  )
}

function ReviewItem({ row, n }: { row: ReviewRow; n: number }) {
  const ex = row.exercise
  return (
    <li className={`rounded-2xl border p-5 ${row.correct ? 'bg-sage-light/15 border-sage/25' : 'bg-peach-light/20 border-peach/35'}`}>
      <p className="text-sm font-semibold text-brown-dark leading-relaxed mb-2">
        <span
          className={`inline-flex items-center justify-center w-6 h-6 rounded-full bg-white text-[11px] font-bold mr-2 border ${
            row.correct ? 'border-sage/40 text-sage-dark' : 'border-peach/40 text-peach-dark'
          }`}
        >
          {n}
        </span>
        {ex.prompt}
      </p>
      {ex.hanzi && (
        <p className={`${HANZI} text-lg text-brown-dark mb-2`}>{ex.hanzi}</p>
      )}
      <p className={`text-xs font-bold flex items-center gap-1.5 ${row.correct ? 'text-sage-dark' : 'text-peach-dark'}`}>
        {row.correct ? (
          <>
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Correct
          </>
        ) : (
          <>
            <XCircle className="w-4 h-4" aria-hidden="true" /> {row.note}
          </>
        )}
      </p>
    </li>
  )
}
