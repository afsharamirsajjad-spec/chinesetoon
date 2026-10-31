'use client'

// ---------------------------------------------------------------------------
// 🧩 HskModulePage — /practice/hsk1/stage-N/<vocabulary|grammar|pronunciation|reading>
//
// Dedicated page per learning module (never rendered inside /practice):
//   1. the teaching material for the module (client-safe curriculum content)
//   2. a "Start the test" action that mounts the shared ExerciseRunner
//   3. breadcrumbs + Back-to-stage navigation + completion status
// Locked stages show a gate (same rule as the stage overview, enforced again
// server-side when an attempt is submitted).
// ---------------------------------------------------------------------------

import Link from 'next/link'
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Lock, Play } from 'lucide-react'
import { useState } from 'react'
import { getHsk1Stage } from '@/lib/practice/hsk/content'
import { HSK_PASS_PERCENT, type HskModuleKind, type HskStageMeta } from '@/lib/practice/hsk/types'
import { isStageUnlocked } from '@/lib/practice/hsk/progress-utils'
import { PinyinText } from '../../pinyin'
import { Breadcrumbs, SpeakButton, ProgressBar } from './ui'
import { ExerciseRunner } from './ExerciseRunner'
import { useHskProgress } from './use-hsk-progress'
import { useStageContent } from './use-stage-content'

const HANZI = 'ct-hanzi'

export function HskModulePage({ stage, module }: { stage: number; module: HskModuleKind }) {
  const fallback = getHsk1Stage(stage)
  const { content, unpublished } = useStageContent(stage)
  const meta: HskStageMeta | null = content ?? fallback
  const { status, progress, summary, submit } = useHskProgress()
  const [quizOpen, setQuizOpen] = useState(false)
  const [quizKey, setQuizKey] = useState(0)

  const crumbs = [
    { label: 'Practice', href: '/practice' },
    { label: 'HSK 1', href: '/practice/hsk1' },
    { label: `Stage ${stage}`, href: `/practice/hsk1/stage-${stage}` },
    { label: MODULE_LABELS[module] },
  ]

  if (unpublished) {
    return (
      <section className="pt-32 pb-28">
        <div className="max-w-3xl mx-auto px-6">
          <Breadcrumbs items={crumbs} />
          <div className="bg-white rounded-3xl border border-sage-light/20 shadow-sm p-10 text-center">
            <span className="w-16 h-16 rounded-full bg-cream-dark flex items-center justify-center mx-auto mb-5" aria-hidden="true">
              <Lock className="w-7 h-7 text-brown-light" />
            </span>
            <h1 className="text-xl md:text-2xl font-bold text-brown-dark mb-3">This module is not published yet</h1>
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

  if (status === 'loading') {
    return (
      <section className="pt-32 pb-28">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-sm text-brown-light flex items-center justify-center gap-2 py-20" role="status">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Loading module…
          </p>
        </div>
      </section>
    )
  }

  if (!isStageUnlocked(progress, stage)) {
    return (
      <section className="pt-32 pb-28">
        <div className="max-w-3xl mx-auto px-6">
          <Breadcrumbs items={crumbs} />
          <div className="bg-white rounded-3xl border border-sage-light/20 shadow-sm p-10 text-center">
            <span className="w-16 h-16 rounded-full bg-cream-dark flex items-center justify-center mx-auto mb-5" aria-hidden="true">
              <Lock className="w-7 h-7 text-brown-light" />
            </span>
            <h1 className="text-xl md:text-2xl font-bold text-brown-dark mb-3">This module is still locked</h1>
            <p className="text-sm text-brown-light max-w-md mx-auto mb-8">
              Complete Stage {stage - 1} (all four modules at 80%+) to unlock it. Your current stage is{' '}
              <strong className="text-brown">Stage {summary.currentStage}</strong>.
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

  const mp = progress.stages[String(stage)]?.modules[module]
  const completed = mp?.completed ?? false

  const openQuiz = () => {
    setQuizKey((k) => k + 1)
    setQuizOpen(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div id={`page-hsk1-stage-${stage}-${module}`}>
      <section className="pt-32 pb-16 relative overflow-hidden bg-cream">
        <div aria-hidden="true" className="absolute -top-10 -left-20 w-72 h-72 bg-butter/25 rounded-full blur-3xl"></div>
        <div className="max-w-4xl mx-auto px-6 relative">
          <Breadcrumbs items={crumbs} />
          <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-brown-dark">
              Stage {stage} · {MODULE_LABELS[module]}
            </h1>
            {completed && (
              <span className="inline-flex items-center gap-1.5 bg-sage/20 text-sage-dark text-xs font-bold px-3 py-1.5 rounded-full">
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Completed
              </span>
            )}
          </div>
          <p className="text-sm text-brown-light mb-5">{MODULE_INTRO(module, meta)}</p>
          <div className="flex flex-wrap items-center gap-4">
            {!quizOpen && (
              <button
                type="button"
                onClick={openQuiz}
                className="inline-flex items-center gap-2 bg-sage text-brown-dark px-7 py-3.5 rounded-full text-sm font-bold hover:bg-sage-dark hover:shadow-[0_8px_24px_rgba(141,181,133,0.45)] active:scale-[0.98] transition-all cursor-pointer min-h-[48px]"
              >
                <Play className="w-4 h-4" aria-hidden="true" />
                {mp ? `Retake the test (best ${mp.bestPercent}%)` : `Start the test — pass at ${HSK_PASS_PERCENT}%`}
              </button>
            )}
            <Link
              href={`/practice/hsk1/stage-${stage}`}
              className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full text-sm font-semibold text-brown border border-sage-light/50 bg-white hover:border-sage transition-colors cursor-pointer min-h-[48px]"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back to Stage {stage}
            </Link>
          </div>
          {mp && (
            <div className="mt-5 max-w-sm">
              <div className="flex items-center justify-between text-[11px] font-semibold text-brown-light mb-1.5">
                <span>Module progress</span>
                <span className="tabular-nums">{mp.bestPercent}%</span>
              </div>
              <ProgressBar percent={mp.bestPercent} label={`${module} progress`} />
            </div>
          )}
        </div>
      </section>

      <section className="pb-28 -mt-6">
        <div className="max-w-4xl mx-auto px-6 space-y-10">
          {quizOpen && (
            <ExerciseRunner
              key={quizKey}
              stage={stage}
              module={module}
              quizTitle={`${MODULE_LABELS[module]} test`}
              backHref={`/practice/hsk1/stage-${stage}`}
              backLabel={`Back to Stage ${stage}`}
              submit={submit}
              onPassed={() => setQuizOpen(false)}
            />
          )}

          {/* ================= teaching material ================= */}
          {module === 'vocabulary' && <VocabularyTeaching meta={meta} />}
          {module === 'grammar' && <GrammarTeaching meta={meta} />}
          {module === 'pronunciation' && <PronunciationTeaching meta={meta} />}
          {module === 'reading' && <ReadingTeaching meta={meta} />}
        </div>
      </section>
    </div>
  )
}

const MODULE_LABELS: Record<HskModuleKind, string> = {
  vocabulary: 'Vocabulary',
  grammar: 'Grammar',
  pronunciation: 'Pronunciation & Listening',
  reading: 'Reading',
}

function MODULE_INTRO(m: HskModuleKind, meta: HskStageMeta): string {
  switch (m) {
    case 'vocabulary':
      return `Study the ${meta.words.length} words of this stage — tap any speaker to hear native-style audio — then take the test.`
    case 'grammar':
      return 'Read the explanations and examples first; the test includes sentence building. Common beginner mistakes are marked for each topic.'
    case 'pronunciation':
      return `${meta.pronunciation.title}. Listen to the demos as often as you need — the test is by ear.`
    case 'reading':
      return 'Read each passage (hanzi, pinyin and English line by line), then answer the comprehension questions.'
  }
}

// ---------------------------------------------------------------------------
// Vocabulary — word cards with audio + example sentences
// ---------------------------------------------------------------------------

function VocabularyTeaching({ meta }: { meta: HskStageMeta }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-brown-dark mb-4">The words of Stage {meta.stage}</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {meta.words.map((w) => (
          <div key={w.hanzi} className="bg-white rounded-2xl border border-sage-light/20 p-5 card-hover">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className={`${HANZI} text-3xl text-brown-dark font-medium leading-tight`}>{w.hanzi}</p>
                <p className="mt-1 text-sm">
                  <PinyinText pinyin={w.pinyin} />
                </p>
              </div>
              <SpeakButton text={w.hanzi} />
            </div>
            <p className="text-sm text-brown mb-1">{w.meaning}</p>
            <span className="inline-block bg-cream text-brown-light text-[10px] font-bold uppercase tracking-wide rounded-full px-2.5 py-1 mb-3">
              {w.category}
            </span>
            <div className="bg-cream/60 rounded-xl px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className={`${HANZI} text-base text-brown-dark`}>{w.example}</p>
                  <p className="text-xs mt-1">
                    <PinyinText pinyin={w.examplePinyin} />
                  </p>
                  <p className="text-xs text-brown-light mt-1">{w.exampleEnglish}</p>
                </div>
                <SpeakButton text={w.example} size="sm" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Grammar — explanations, structure, examples, common mistakes
// ---------------------------------------------------------------------------

function GrammarTeaching({ meta }: { meta: HskStageMeta }) {
  return (
    <div className="space-y-6">
      {meta.grammar.map((g) => (
        <div key={g.id} className="bg-white rounded-3xl border border-sage-light/20 shadow-sm overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-sage via-butter to-peach" aria-hidden="true" />
          <div className="p-6 md:p-8">
            <h2 className="text-lg font-bold text-brown-dark mb-2">{g.title}</h2>
            <p className="text-sm text-brown leading-relaxed mb-4">{g.explanation}</p>
            <p className="inline-block bg-sage-light/25 text-brown-dark text-sm font-semibold rounded-xl px-4 py-2 mb-5">
              {g.structure}
            </p>
            <div className="space-y-3 mb-5">
              {g.examples.map((e, i) => (
                <div key={i} className="bg-cream/60 rounded-2xl px-5 py-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className={`${HANZI} text-lg text-brown-dark`}>{e.hanzi}</p>
                    <p className="text-xs mt-1">
                      <PinyinText pinyin={e.pinyin} />
                    </p>
                    <p className="text-xs text-brown-light mt-1">{e.english}</p>
                  </div>
                  <SpeakButton text={e.hanzi} size="sm" />
                </div>
              ))}
            </div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-peach-dark mb-2">Common mistakes</h3>
            <ul className="space-y-2">
              {g.mistakes.map((m, i) => (
                <li key={i} className="text-sm rounded-xl border border-peach/30 bg-peach-light/15 px-4 py-3">
                  <span className={`${HANZI} text-peach-dark line-through mr-2`}>{m.wrong}</span>
                  <span className={`${HANZI} text-sage-dark font-semibold mr-2`}>{m.right}</span>
                  <span className="text-brown-light text-xs">— {m.note}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Pronunciation — lesson sections + playable tone demos and listening words
// ---------------------------------------------------------------------------

function PronunciationTeaching({ meta }: { meta: HskStageMeta }) {
  const lesson = meta.pronunciation
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-sage-light/20 shadow-sm overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-sage via-butter to-peach" aria-hidden="true" />
        <div className="p-6 md:p-8">
          <h2 className="text-lg font-bold text-brown-dark mb-2">{lesson.title}</h2>
          <p className="text-sm text-brown leading-relaxed">{lesson.intro}</p>
        </div>
      </div>

      {lesson.sections.map((s, i) => (
        <div key={i} className="bg-white rounded-3xl border border-sage-light/20 p-6 md:p-8">
          <h3 className="text-base font-bold text-brown-dark mb-2">{s.title}</h3>
          <p className="text-sm text-brown leading-relaxed mb-4">{s.body}</p>
          {s.items && (
            <ul className="space-y-2">
              {s.items.map((item, j) => (
                <li key={j} className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-cream/60 rounded-xl px-4 py-3">
                  <span className={`${HANZI} text-base text-brown-dark font-medium`}>{item.label}</span>
                  {item.note && <span className="text-xs text-brown-light">— {item.note}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

      <div className="bg-white rounded-3xl border border-sage-light/20 p-6 md:p-8">
        <h3 className="text-base font-bold text-brown-dark mb-1">Tone demos — train your ear</h3>
        <p className="text-sm text-brown-light mb-4">Play each syllable and repeat it out loud. Same sound, four meanings.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {lesson.toneDemos.map((d) => (
            <div key={d.pinyin} className="bg-cream/60 rounded-2xl px-4 py-4 text-center">
              <p className={`${HANZI} text-3xl text-brown-dark mb-1`}>{d.hanzi}</p>
              <p className="text-sm mb-1">
                <PinyinText pinyin={d.pinyin} />
              </p>
              <p className="text-xs text-brown-light mb-3">{d.meaning} · tone {d.tone}</p>
              <div className="flex justify-center">
                <SpeakButton text={d.hanzi} size="sm" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-sage-light/20 p-6 md:p-8">
        <h3 className="text-base font-bold text-brown-dark mb-1">Listening words of this stage</h3>
        <p className="text-sm text-brown-light mb-4">These words appear in the test — listen and repeat each one.</p>
        <div className="flex flex-wrap gap-3">
          {lesson.listeningWords.map((w) => (
            <div key={w.hanzi} className="bg-cream/60 rounded-2xl px-4 py-3 flex items-center gap-3">
              <div>
                <p className={`${HANZI} text-xl text-brown-dark`}>{w.hanzi}</p>
                <p className="text-xs">
                  <PinyinText pinyin={w.pinyin} />
                </p>
              </div>
              <SpeakButton text={w.hanzi} size="sm" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Reading — passages with hanzi/pinyin/English lines + vocabulary notes
// ---------------------------------------------------------------------------

function ReadingTeaching({ meta }: { meta: HskStageMeta }) {
  return (
    <div className="space-y-8">
      {meta.readings.map((p, pi) => (
        <div key={p.id} className="bg-white rounded-3xl border border-sage-light/20 shadow-sm overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-sage via-butter to-peach" aria-hidden="true" />
          <div className="p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <h2 className="text-lg font-bold text-brown-dark">
                Passage {pi + 1}: {p.title}
              </h2>
              <span className="bg-cream text-brown-light text-[11px] font-bold uppercase tracking-wide rounded-full px-3 py-1">
                {p.form === 'dialogue' ? '对话 · Dialogue' : '短文 · Text'}
              </span>
            </div>
            <div className="space-y-3 mb-6">
              {p.lines.map((line, i) => (
                <div key={i} className="bg-cream/60 rounded-2xl px-5 py-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className={`${HANZI} text-lg md:text-xl text-brown-dark leading-relaxed`}>{line.hanzi}</p>
                    <p className="text-xs md:text-sm mt-1">
                      <PinyinText pinyin={line.pinyin} />
                    </p>
                    <p className="text-xs text-brown-light mt-1">{line.english}</p>
                  </div>
                  <SpeakButton text={line.hanzi} size="sm" />
                </div>
              ))}
            </div>
            {p.notes && p.notes.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-brown-light mb-2">Vocabulary notes</h3>
                <ul className="flex flex-wrap gap-2">
                  {p.notes.map((n, i) => (
                    <li key={i} className="bg-sage-light/20 rounded-full px-3.5 py-1.5 text-xs text-brown">
                      <span className={`${HANZI} font-semibold`}>{n.word}</span> — {n.meaning}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
