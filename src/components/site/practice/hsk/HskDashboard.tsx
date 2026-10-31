'use client'

// ---------------------------------------------------------------------------
// 🎯 HskDashboard — /practice/hsk1
//
// HSK level hub: HSK 1 with its 10 progressively-unlocking stage cards, plus
// HSK 2 / HSK 3 as "Coming Soon" until the admin authors them (the same page
// then renders their stages — stages come from the DB with the bundled
// curriculum as fallback, so the owner can extend the course without code).
// ---------------------------------------------------------------------------

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Layers,
  Loader2,
  Lock,
  ScrollText,
  Ear,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { HSK1_STAGES, HSK1_MODULE_INFO, HSK1_TOTAL_WORDS } from '@/lib/practice/hsk/content'
import { HSK_MODULES, type HskModuleKind } from '@/lib/practice/hsk/types'
import { isStageUnlocked } from '@/lib/practice/hsk/progress-utils'
import { resilientJsonFetch } from '@/lib/client-fetch'
import type { LevelOverview } from '@/lib/practice/hsk/db-content'
import { ProgressBar, StatusChip } from './ui'
import { useHskProgress } from './use-hsk-progress'

const MODULE_ICONS: Record<HskModuleKind, typeof BookOpen> = {
  vocabulary: BookOpen,
  grammar: Layers,
  pronunciation: Ear,
  reading: ScrollText,
}

const LEVEL_TABS = [
  { key: 'hsk1', label: 'HSK 1', ready: true },
  { key: 'hsk2', label: 'HSK 2', ready: false },
  { key: 'hsk3', label: 'HSK 3', ready: false },
] as const

type LevelKey = (typeof LEVEL_TABS)[number]['key']

export function HskDashboard() {
  const { status, authenticated, firstName, progress, summary } = useHskProgress()
  const [level, setLevel] = useState<LevelKey>('hsk1')
  const [overview, setOverview] = useState<LevelOverview | null>(null)
  const [overviewLoading, setOverviewLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setOverviewLoading(true)
    resilientJsonFetch<LevelOverview>(`/api/practice/hsk/overview?level=${level}`, { cache: 'no-store' }).then(
      (res) => {
        if (cancelled) return
        setOverview(res.ok && res.data ? res.data : null)
        setOverviewLoading(false)
      }
    )
    return () => {
      cancelled = true
    }
  }, [level])

  // HSK 1 stage list — DB-first when available, bundled curriculum otherwise
  const stages: Array<{
    stage: number
    title: string
    description: string
    words: number
    grammar: number
    readings: number
    published: boolean
    manuallyUnlocked: boolean
  }> =
    overview && overview.stages.length > 0
      ? overview.stages.map((s) => ({
          stage: s.stageNumber,
          title: s.title,
          description: s.description,
          words: s.wordCount,
          grammar: s.grammarCount,
          readings: s.readingCount,
          published: s.published,
          manuallyUnlocked: s.manuallyUnlocked,
        }))
      : level === 'hsk1'
        ? HSK1_STAGES.map((s) => ({
            stage: s.stage,
            title: s.title,
            description: s.description,
            words: s.words.length,
            grammar: s.grammar.length,
            readings: s.readings.length,
            published: true,
            manuallyUnlocked: false,
          }))
        : []
  const totalWords = overview?.totalWords || (level === 'hsk1' ? HSK1_TOTAL_WORDS : 0)

  return (
    <div id="page-hsk1">
      {/* ================= hero ================= */}
      <section className="pt-32 pb-12 md:pt-40 md:pb-14 relative overflow-hidden bg-cream">
        <div aria-hidden="true" className="absolute -top-10 -left-20 w-72 h-72 bg-butter/25 rounded-full blur-3xl"></div>
        <div className="char-bg top-12 right-[5%]" style={{ fontSize: '220px', opacity: 0.05 }} aria-hidden="true">
          汉
        </div>
        <div className="max-w-4xl mx-auto px-6 relative">
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-1.5 bg-sage-light/30 rounded-full px-4 py-1.5 mb-4 text-xs font-semibold uppercase tracking-widest text-sage-dark">
              <GraduationCap className="w-3.5 h-3.5" aria-hidden="true" /> Structured Practice
            </span>
            <h1 className="text-3xl md:text-5xl font-bold text-brown-dark mb-4">
              HSK Practice <span className="ct-hanzi">汉语水平考试</span>
            </h1>
            <p className="text-brown-light max-w-2xl mx-auto">
              Progressive stages of vocabulary, grammar, pronunciation and graded reading. Pass each
              module (80%+) to unlock the next stage.
            </p>
          </div>

          {/* level tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-8" role="group" aria-label="Choose HSK level">
            {LEVEL_TABS.map((l) => (
              <button
                key={l.key}
                type="button"
                onClick={() => setLevel(l.key)}
                aria-pressed={level === l.key}
                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all cursor-pointer min-h-[42px] ${
                  level === l.key
                    ? 'bg-sage text-brown-dark shadow-[0_4px_16px_rgba(141,181,133,0.35)]'
                    : 'bg-white border border-sage-light/40 text-brown hover:border-sage'
                }`}
              >
                {l.label}
                {!l.ready && <span className="ml-1.5 text-[10px] font-semibold uppercase opacity-70">soon</span>}
              </button>
            ))}
          </div>

          {/* coming soon */}
          {level !== 'hsk1' && !overviewLoading && stages.length === 0 && (
            <div className="bg-white rounded-3xl border border-sage-light/20 shadow-sm p-12 text-center">
              <span className="w-16 h-16 rounded-full bg-cream-dark flex items-center justify-center mx-auto mb-5 text-3xl" aria-hidden="true">
                {level === 'hsk2' ? '🈶' : '🧧'}
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-brown-dark mb-3">
                {level === 'hsk2' ? 'HSK 2' : 'HSK 3'} — Coming Soon
              </h2>
              <p className="text-sm text-brown-light max-w-md mx-auto mb-6">
                We are preparing the {level === 'hsk2' ? 'HSK 2' : 'HSK 3'} curriculum with the same
                progressive stage system. Master HSK 1 first — you will be ready.
              </p>
              <button
                type="button"
                onClick={() => setLevel('hsk1')}
                className="inline-flex items-center gap-2 bg-sage text-brown-dark px-6 py-3 rounded-full text-sm font-bold hover:bg-sage-dark transition-colors cursor-pointer min-h-[44px]"
              >
                Back to HSK 1 <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          )}

          {overviewLoading && level !== 'hsk1' && (
            <p className="text-sm text-brown-light flex items-center justify-center gap-2 py-10" role="status">
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Loading…
            </p>
          )}

          {/* ---------- HSK 1 dashboard ---------- */}
          {(level === 'hsk1' || stages.length > 0) && (
            <div className="bg-white rounded-3xl border border-sage-light/20 shadow-sm p-6 md:p-8">
              {status === 'loading' ? (
                <p className="text-sm text-brown-light flex items-center justify-center gap-2 py-6" role="status">
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Loading your progress…
                </p>
              ) : (
                <>
                  {!authenticated && (
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-5 bg-sage-light/20 border border-sage/25 rounded-2xl px-4 py-3">
                      <p className="text-sm text-brown flex items-center gap-2">
                        <UserRound className="w-4 h-4 text-sage-dark" aria-hidden="true" />
                        {status === 'failed'
                          ? 'Progress could not be loaded just now — you can still practice.'
                          : 'You are not signed in — progress is kept in this browser only. Sign in to save it to your account.'}
                      </p>
                      <Link
                        href="/account"
                        className="bg-sage text-brown-dark px-5 py-2 rounded-full text-sm font-bold hover:bg-sage-dark transition-colors cursor-pointer min-h-[38px] inline-flex items-center"
                      >
                        Sign in
                      </Link>
                    </div>
                  )}
                  {authenticated && (
                    <p className="text-sm text-brown-light mb-5">
                      {firstName ? (
                        <>
                          Welcome back, <span className="font-semibold text-brown-dark">{firstName}</span> — keep going!
                        </>
                      ) : (
                        'Keep going!'
                      )}
                    </p>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                    <div className="bg-cream/70 border border-sage-light/25 rounded-2xl px-4 py-3 text-center">
                      <p className="text-2xl font-bold text-sage-dark tabular-nums">{summary.overallPercent}%</p>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-brown-light mt-0.5">overall</p>
                    </div>
                    <div className="bg-cream/70 border border-sage-light/25 rounded-2xl px-4 py-3 text-center">
                      <p className="text-2xl font-bold text-sage-dark tabular-nums">
                        {summary.completedModules}
                        <span className="text-sm text-brown-light font-semibold"> / {stages.length * 4}</span>
                      </p>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-brown-light mt-0.5">modules done</p>
                    </div>
                    <div className="bg-cream/70 border border-sage-light/25 rounded-2xl px-4 py-3 text-center">
                      <p className="text-2xl font-bold text-sage-dark tabular-nums">
                        {summary.completedStages}
                        <span className="text-sm text-brown-light font-semibold"> / {stages.length}</span>
                      </p>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-brown-light mt-0.5">stages done</p>
                    </div>
                    <div className="bg-cream/70 border border-sage-light/25 rounded-2xl px-4 py-3 text-center">
                      <p className="text-2xl font-bold text-sage-dark tabular-nums">{totalWords}</p>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-brown-light mt-0.5">words</p>
                    </div>
                  </div>

                  <ProgressBar percent={summary.overallPercent} label="Overall HSK 1 progress" className="mb-5" />

                  {summary.currentStage <= stages.length && (
                    <Link
                      href={`/practice/hsk1/stage-${summary.currentStage}`}
                      className="inline-flex items-center gap-2 bg-sage text-brown-dark px-7 py-3.5 rounded-full text-sm font-bold hover:bg-sage-dark hover:shadow-[0_8px_24px_rgba(141,181,133,0.45)] active:scale-[0.98] transition-all cursor-pointer min-h-[48px]"
                    >
                      {summary.completedModules > 0 ? `Continue with Stage ${summary.currentStage}` : 'Start Stage 1'}
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ================= stage cards ================= */}
      {stages.length > 0 && (
        <section className="pb-28 pt-6">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-xl font-bold text-brown-dark mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sage-dark" aria-hidden="true" /> The {stages.length} stages
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stages.map((stage, i) => {
                const unlocked =
                  (stage.manuallyUnlocked || isStageUnlocked(progress, stage.stage)) && stage.published
                const sp = progress.stages[String(stage.stage)]
                const doneModules = HSK_MODULES.filter((m) => sp?.modules[m]?.completed).length
                const attemptedModules = HSK_MODULES.filter((m) => (sp?.modules[m]?.attempts ?? 0) > 0).length
                const percent = Math.round((doneModules / HSK_MODULES.length) * 100)
                const status =
                  doneModules === HSK_MODULES.length ? 'completed' : attemptedModules > 0 ? 'in-progress' : 'not-started'
                const isCurrent = summary.currentStage === stage.stage && status !== 'completed'

                const card = (
                  <div
                    className={`group bg-white rounded-2xl p-6 border border-sage-light/20 flex flex-col animate-ct-fadeInUp h-full ${
                      unlocked ? 'card-hover' : 'opacity-70'
                    }`}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <span
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 font-bold text-lg ${
                          unlocked ? 'bg-sage-light/30 text-sage-dark' : 'bg-cream-dark text-brown-light'
                        }`}
                      >
                        {unlocked ? stage.stage : <Lock className="w-5 h-5" aria-hidden="true" />}
                      </span>
                      <span className="flex flex-col items-end gap-1.5">
                        <StatusChip status={status} />
                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 bg-butter/40 text-brown text-[11px] font-bold px-2.5 py-1 rounded-full">
                            ← you are here
                          </span>
                        )}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-brown-dark mb-1.5 group-hover:text-sage-dark transition-colors">
                      Stage {stage.stage} — {stage.title}
                    </h3>
                    <p className="text-sm text-brown-light leading-relaxed mb-4 flex-1">{stage.description}</p>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold mb-3">
                      <span className="bg-cream rounded-full px-2.5 py-1 text-brown">{stage.words} words</span>
                      <span className="bg-cream rounded-full px-2.5 py-1 text-brown">{stage.grammar} grammar topics</span>
                      <span className="bg-cream rounded-full px-2.5 py-1 text-brown">{stage.readings} readings</span>
                    </div>
                    {unlocked ? (
                      <>
                        <ProgressBar percent={percent} label={`Stage ${stage.stage} progress`} className="mb-2" />
                        <span className="mt-3 self-start inline-flex items-center gap-1.5 text-sm font-semibold text-sage-dark group-hover:gap-2.5 transition-all">
                          {doneModules > 0 ? 'Continue stage' : 'Open stage'}
                          <ArrowRight className="w-4 h-4" aria-hidden="true" />
                        </span>
                      </>
                    ) : (
                      <p className="text-xs text-brown-light mt-auto">
                        {stage.published
                          ? `Complete all four modules of Stage ${stage.stage - 1} to unlock.`
                          : 'This stage is not published yet.'}
                      </p>
                    )}
                  </div>
                )

                return unlocked ? (
                  <Link key={stage.stage} href={`/practice/hsk1/stage-${stage.stage}`} className="h-full">
                    {card}
                  </Link>
                ) : (
                  <div key={stage.stage} aria-disabled="true" className="h-full cursor-not-allowed">
                    {card}
                  </div>
                )
              })}
            </div>

            {/* module legend */}
            <div className="mt-10 bg-white rounded-2xl border border-sage-light/20 p-6">
              <h3 className="text-sm font-bold text-brown-dark mb-3">Every stage has four modules</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {HSK_MODULES.map((m) => {
                  const Icon = MODULE_ICONS[m]
                  return (
                    <div key={m} className="flex items-start gap-3">
                      <span className="w-9 h-9 rounded-xl bg-sage-light/30 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4.5 h-4.5 text-sage-dark" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-brown-dark">{HSK1_MODULE_INFO[m].label}</p>
                        <p className="text-xs text-brown-light leading-relaxed">{HSK1_MODULE_INFO[m].blurb}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
