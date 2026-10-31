'use client'

// ---------------------------------------------------------------------------
// 🗺️ HskStageOverview — /practice/hsk1/stage-N
//
// Shows one stage's four module cards (Vocabulary / Grammar / Pronunciation /
// Reading) with their own progress and status. Locked stages render a gate
// instead of the cards — the learning flow cannot be bypassed through direct
// URLs, and the server also rejects attempts for locked stages.
// ---------------------------------------------------------------------------

import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Ear,
  Layers,
  Loader2,
  Lock,
  ScrollText,
} from 'lucide-react'
import { getHsk1Stage } from '@/lib/practice/hsk/content'
import { HSK_MODULES, type HskModuleKind, type HskStageMeta } from '@/lib/practice/hsk/types'
import { isStageUnlocked } from '@/lib/practice/hsk/progress-utils'
import { Breadcrumbs, ProgressBar, StatusChip } from './ui'
import { useHskProgress } from './use-hsk-progress'
import { useStageContent } from './use-stage-content'

const MODULE_ICONS: Record<HskModuleKind, typeof BookOpen> = {
  vocabulary: BookOpen,
  grammar: Layers,
  pronunciation: Ear,
  reading: ScrollText,
}

export function HskStageOverview({ stage }: { stage: number }) {
  const meta = getHsk1Stage(stage)
  const { content, unpublished } = useStageContent(stage)
  const { status, authenticated, progress, summary } = useHskProgress()

  if (!meta && !content && unpublished) {
    return (
      <section className="pt-32 pb-28">
        <div className="max-w-3xl mx-auto px-6">
          <Breadcrumbs
            items={[
              { label: 'Practice', href: '/practice' },
              { label: 'HSK 1', href: '/practice/hsk1' },
              { label: `Stage ${stage}` },
            ]}
          />
          <div className="bg-white rounded-3xl border border-sage-light/20 shadow-sm p-10 text-center">
            <span className="w-16 h-16 rounded-full bg-cream-dark flex items-center justify-center mx-auto mb-5" aria-hidden="true">
              <Lock className="w-7 h-7 text-brown-light" />
            </span>
            <h1 className="text-xl md:text-2xl font-bold text-brown-dark mb-3">Stage {stage} is not published yet</h1>
            <p className="text-sm text-brown-light max-w-md mx-auto mb-8">
              Your teacher is still preparing this stage — check back soon.
            </p>
            <Link
              href="/practice/hsk1"
              className="inline-flex items-center gap-2 bg-sage text-brown-dark px-7 py-3.5 rounded-full text-sm font-bold hover:bg-sage-dark transition-colors cursor-pointer min-h-[48px]"
            >
              Back to all stages <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    )
  }

  if (!meta) return null

  const crumbs = [
    { label: 'Practice', href: '/practice' },
    { label: 'HSK 1', href: '/practice/hsk1' },
    { label: `Stage ${stage}` },
  ]

  if (status === 'loading') {
    return (
      <section className="pt-32 pb-28">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-sm text-brown-light flex items-center justify-center gap-2 py-20" role="status">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Loading stage…
          </p>
        </div>
      </section>
    )
  }

  const unlocked = isStageUnlocked(progress, stage)

  if (!unlocked) {
    return (
      <section className="pt-32 pb-28">
        <div className="max-w-3xl mx-auto px-6">
          <Breadcrumbs items={crumbs} />
          <div className="bg-white rounded-3xl border border-sage-light/20 shadow-sm p-10 text-center">
            <span className="w-16 h-16 rounded-full bg-cream-dark flex items-center justify-center mx-auto mb-5" aria-hidden="true">
              <Lock className="w-7 h-7 text-brown-light" />
            </span>
            <h1 className="text-xl md:text-2xl font-bold text-brown-dark mb-3">Stage {stage} is still locked</h1>
            <p className="text-sm text-brown-light max-w-md mx-auto mb-8">
              Finish all four modules of Stage {stage - 1} with at least 80% to unlock this stage.
              {summary.currentStage < stage && (
                <>
                  {' '}
                  Your current stage is <strong className="text-brown">Stage {summary.currentStage}</strong>.
                </>
              )}
            </p>
            <Link
              href={`/practice/hsk1/stage-${summary.currentStage}`}
              className="inline-flex items-center gap-2 bg-sage text-brown-dark px-7 py-3.5 rounded-full text-sm font-bold hover:bg-sage-dark transition-colors cursor-pointer min-h-[48px]"
            >
              Go to Stage {summary.currentStage} <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    )
  }

  const sp = progress.stages[String(stage)]
  const doneModules = HSK_MODULES.filter((m) => sp?.modules[m]?.completed).length
  const stagePercent = Math.round((doneModules / HSK_MODULES.length) * 100)
  const stageCompleted = doneModules === HSK_MODULES.length
  // DB-managed content wins over the bundled curriculum once loaded
  const stageMeta = content ?? meta

  return (
    <div id={`page-hsk1-stage-${stage}`}>
      {/* ================= stage hero ================= */}
      <section className="pt-32 pb-12 md:pt-40 md:pb-14 relative overflow-hidden bg-cream">
        <div aria-hidden="true" className="absolute -top-10 -left-20 w-72 h-72 bg-butter/25 rounded-full blur-3xl"></div>
        <div className="char-bg top-12 right-[5%]" style={{ fontSize: '200px', opacity: 0.05 }} aria-hidden="true">
          学
        </div>
        <div className="max-w-4xl mx-auto px-6 relative">
          <Breadcrumbs items={crumbs} />
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 bg-sage-light/30 rounded-full px-4 py-1.5 mb-4 text-xs font-semibold uppercase tracking-widest text-sage-dark">
              HSK 1 · Stage {stage}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-brown-dark mb-3">
              Stage {stage}: {stageMeta?.title ?? ''} <span className="ct-hanzi">{getStageHanzi(stage)}</span>
            </h1>
            <p className="text-brown-light max-w-2xl mx-auto mb-6">{stageMeta?.description ?? ''}</p>

            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between text-xs font-semibold text-brown-light mb-2">
                <span>{stageCompleted ? 'Stage completed 🎉' : `${doneModules} of 4 modules completed`}</span>
                <span className="tabular-nums">{stagePercent}%</span>
              </div>
              <ProgressBar percent={stagePercent} label={`Stage ${stage} progress`} />
            </div>
          </div>
        </div>
      </section>

      {/* ================= module cards ================= */}
      <section className="pb-28 pt-6">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-6">
            {HSK_MODULES.map((m) => {
              const Icon = MODULE_ICONS[m]
              const mp = sp?.modules[m]
              const moduleStatus = mp?.completed ? 'completed' : mp ? 'in-progress' : 'not-started'
              const blurb = moduleBlurb(stageMeta, m)
              return (
                <Link
                  key={m}
                  href={`/practice/hsk1/stage-${stage}/${m}`}
                  className="group bg-white rounded-2xl p-6 border border-sage-light/20 card-hover flex flex-col animate-ct-fadeInUp"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <span className="w-12 h-12 rounded-2xl bg-sage-light/30 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-sage-dark" aria-hidden="true" />
                    </span>
                    <StatusChip status={moduleStatus} />
                  </div>
                  <h2 className="text-base font-bold text-brown-dark mb-1.5 group-hover:text-sage-dark transition-colors">
                    {moduleTitle(m)}
                  </h2>
                  <p className="text-sm text-brown-light leading-relaxed mb-4 flex-1">{blurb}</p>
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-brown-light mb-1.5">
                      <span>{mp ? `Best score ${mp.bestPercent}%` : 'Not attempted yet'}</span>
                      {mp?.attempts ? <span className="tabular-nums">{mp.attempts} attempt{mp.attempts > 1 ? 's' : ''}</span> : null}
                    </div>
                    <ProgressBar percent={mp?.bestPercent ?? 0} label={`${m} progress`} />
                  </div>
                  <span className="self-start inline-flex items-center gap-1.5 text-sm font-semibold text-sage-dark group-hover:gap-2.5 transition-all">
                    {mp?.completed ? 'Review module' : mp ? 'Continue module' : 'Start module'}
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </span>
                </Link>
              )
            })}
          </div>

          {stageCompleted && stage < 10 && (
            <div className="mt-8 bg-sage-light/25 border border-sage/30 rounded-3xl p-6 text-center">
              <p className="text-sm font-bold text-brown-dark mb-3">Stage {stage} completed — Stage {stage + 1} is unlocked!</p>
              <Link
                href={`/practice/hsk1/stage-${stage + 1}`}
                className="inline-flex items-center gap-2 bg-sage text-brown-dark px-7 py-3 rounded-full text-sm font-bold hover:bg-sage-dark transition-colors cursor-pointer min-h-[44px]"
              >
                Continue to Stage {stage + 1} <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          )}

          <div className="mt-10 text-center">
            <Link
              href="/practice/hsk1"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brown hover:text-sage-dark transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back to all stages
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

function moduleTitle(m: HskModuleKind): string {
  const titles: Record<HskModuleKind, string> = {
    vocabulary: 'Vocabulary',
    grammar: 'Grammar',
    pronunciation: 'Pronunciation & Listening',
    reading: 'Reading',
  }
  return titles[m]
}

function moduleBlurb(meta: HskStageMeta | null, m: HskModuleKind): string {
  if (!meta) return ''
  switch (m) {
    case 'vocabulary':
      return `${meta.words.length} words with audio, examples and a test — including review of earlier stages.`
    case 'grammar':
      return meta.grammar.length > 0
        ? `${meta.grammar.length} topics: ${meta.grammar.map((g) => g.title).join(' · ')}.`
        : 'Grammar lessons for this stage.'
    case 'pronunciation':
      return meta.pronunciation.title
        ? `${meta.pronunciation.title} — listen, compare and pick the right tones and words.`
        : 'Pronunciation and listening practice.'
    case 'reading':
      return `${meta.readings.length} graded passage${meta.readings.length === 1 ? '' : 's'} with pinyin, translation and comprehension questions.`
  }
}

function getStageHanzi(stage: number): string {
  const labels = ['你好', '家人', '数字', '时间', '位置', '饮食', '学习', '家园', '爱好', '生活']
  return labels[stage - 1] ?? ''
}
