'use client'

// ---------------------------------------------------------------------------
// 🧭 PracticeHub — صفحهٔ مرکزی تمرین (/practice)
//
// ساختار:
//   ۱) داشبورد: سلام شخصی‌سازی‌شده + شمارندهٔ امروز/هدف + استریک + اقدام
//      «Continue» (آخرین فعالیت واقعی کاربر) — همهٔ آمار از سرور می‌آید و
//      هیچ عددی جعل نمی‌شود؛ مهمان: بنر شفاف «برای ذخیرهٔ پیشرفت وارد شو».
//   ۲) جست‌وجو + فیلتر دسته + مرتب‌سازی (پیشنهادی/اخیراً استفاده‌شده) —
//      روی متادیتای واقعی رجیستری کار می‌کند.
//   ۳) کارت فعالیت‌ها — هر کارت به «خودِ تمرین واقعی» می‌رسد (درخواست مالک:
//      فعالیت‌های تعاملی داخل همین صفحه تعبیه شده‌اند و کارت فقط به لنگرِ
//      پایین صفحه اسکرول می‌کند؛ تنها استثنا کتابخانهٔ درس‌ها در /learn).
//   ۴) فعالیت‌های تعبیه‌شده: کلمهٔ روز، بازی تُن‌ها، فلش‌کارت‌ها و آزمون سطح.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  Ear,
  Flame,
  Layers,
  Loader2,
  Search,
  SearchX,
  Sparkles,
  Sun,
  Target,
  UserRound,
} from 'lucide-react'
import { PRACTICE_ACTIVITIES, PRACTICE_CATEGORIES, type PracticeActivity } from '@/lib/practice/registry'
import { recordPractice } from '@/lib/practice/record'
import { WordOfDay } from '../WordOfDay'
import { ToneTrainer } from '../ToneTrainer'
import { Flashcards, type FlashCardData } from '../Flashcards'
import { LevelQuiz } from '../LevelQuiz'
import { appNavigate } from '@/lib/nav'
import type { PageKey } from '@/content/site-content'

const ICONS = {
  sun: Sun,
  layers: Layers,
  book: BookOpen,
  ear: Ear,
  target: Target,
  graduation: Sparkles,
} as const

interface ProgressSummary {
  authenticated: boolean
  user?: { firstName: string; lastName: string }
  goal: number
  todayCount: number
  streak: number
  doneToday?: string[]
  recent?: Array<{ activityKey: string; at: string }>
  totals?: Record<string, number>
}

type LoadState = 'loading' | 'ready' | 'failed'

export function PracticeHub() {
  const [progress, setProgress] = useState<ProgressSummary | null>(null)
  const [state, setState] = useState<LoadState>('loading')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [sort, setSort] = useState<'recommended' | 'recent'>('recommended')

  // 🃏 واژه‌های فلش‌کارت از دیتابیس (پنل ادمین) — تا وقتی خالی باشد نسخهٔ
  // پیش‌فرض فایل محتوا داخل خود Flashcards استفاده می‌شود
  const [cards, setCards] = useState<FlashCardData[] | null>(null)

  // 🧭 adapter ناوبری برای کامپوننت‌های تعبیه‌شده (CTA ثبت‌نام) — PageKey → مسیر
  const navigate = useCallback((page: PageKey) => {
    appNavigate(page === 'home' ? '/' : `/${page}`)
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch('/api/practice/progress', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ProgressSummary | null) => {
        if (cancelled) return
        setProgress(data ?? { authenticated: false, goal: 3, todayCount: 0, streak: 0 })
        setState('ready')
      })
      .catch(() => {
        if (!cancelled) {
          // پیشرفت نارسید — هاب همچنان کار می‌کند (فقط داشبورد خالی است)
          setProgress({ authenticated: false, goal: 3, todayCount: 0, streak: 0 })
          setState('failed')
        }
      })
    fetch('/api/learn/cards')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data.cards) && data.cards.length > 0) {
          setCards(
            data.cards.map(
              (c: { chinese: string; pinyin: string; meaning: string; example: string | null }) => ({
                chinese: c.chinese,
                pinyin: c.pinyin,
                meaning: c.meaning,
                example: c.example,
              })
            )
          )
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const doneToday = new Set(progress?.doneToday ?? [])
  const recentByKey = useMemo(() => {
    const map = new Map<string, string>()
    for (const r of progress?.recent ?? []) map.set(r.activityKey, r.at)
    return map
  }, [progress])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = PRACTICE_ACTIVITIES.filter((a) => {
      const matchesCategory = category === 'all' || a.category === category
      const matchesQuery =
        q === '' ||
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q)
      return matchesCategory && matchesQuery
    })
    if (sort === 'recent') {
      return [...list].sort((a, b) => {
        const ta = recentByKey.get(a.key) ?? ''
        const tb = recentByKey.get(b.key) ?? ''
        return tb.localeCompare(ta) // بدون تاریخ → ته لیست (ترتیب رجیستری حفظ می‌شود)
      })
    }
    return list
  }, [query, category, sort, recentByKey])

  const firstName = progress?.user?.firstName?.trim()
  const todayCount = progress?.todayCount ?? 0
  const goal = progress?.goal ?? 3
  const streak = progress?.streak ?? 0

  // اقدام ادامه — آخرین فعالیت واقعی کاربر؛ بدون تاریخ = «شروع تمرین»
  const continueActivity: PracticeActivity | null =
    progress?.recent?.length
      ? (PRACTICE_ACTIVITIES.find((a) => a.key === progress.recent![0].activityKey) ?? null)
      : null

  return (
    <div id="page-practice">
      {/* ================= هیروی تمرین ================= */}
      <section className="pt-32 pb-12 md:pt-40 md:pb-14 relative overflow-hidden bg-cream">
        <div
          aria-hidden="true"
          className="absolute -top-10 -left-20 w-72 h-72 bg-butter/25 rounded-full blur-3xl"
        ></div>
        <div className="char-bg top-12 right-[5%]" style={{ fontSize: '220px', opacity: 0.05 }} aria-hidden="true">
          练
        </div>

        <div className="max-w-4xl mx-auto px-6 relative">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 bg-sage-light/30 rounded-full px-4 py-1.5 mb-4 text-xs font-semibold uppercase tracking-widest text-sage-dark">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> Practice Hub
            </span>
            <h1 className="text-3xl md:text-5xl font-bold text-brown-dark mb-4">Practice Your Chinese</h1>
            <p className="text-brown-light max-w-2xl mx-auto">
              A little practice every day is how Mandarin sticks. Pick an activity below — words,
              tones, quizzes or listening — and keep your streak alive.
            </p>
          </div>

          {/* ---------- داشبورد ---------- */}
          <div className="bg-white rounded-3xl border border-sage-light/20 shadow-sm p-6 md:p-8">
            {state === 'loading' && (
              <p className="text-sm text-brown-light flex items-center justify-center gap-2 py-4" role="status">
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Loading your progress…
              </p>
            )}

            {state !== 'loading' && (
              <>
                {progress?.authenticated ? (
                  <p className="text-sm text-brown-light mb-5">
                    {firstName ? (
                      <>
                        Welcome back, <span className="font-semibold text-brown-dark">{firstName}</span> — ready for
                        today’s session?
                      </>
                    ) : (
                      'Ready for today’s session?'
                    )}
                  </p>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-5 bg-sage-light/20 border border-sage/25 rounded-2xl px-4 py-3">
                    <p className="text-sm text-brown flex items-center gap-2">
                      <UserRound className="w-4 h-4 text-sage-dark" aria-hidden="true" />
                      Sign in to save your progress, streak and daily goal.
                    </p>
                    <Link
                      href="/account"
                      className="bg-sage text-brown-dark px-5 py-2 rounded-full text-sm font-bold hover:bg-sage-dark transition-colors cursor-pointer min-h-[38px] inline-flex items-center"
                    >
                      Sign in
                    </Link>
                  </div>
                )}

                {/* چیپ‌های آمار — فقط اعداد واقعی سرور */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                  <div className="bg-cream/70 border border-sage-light/25 rounded-2xl px-4 py-3 text-center">
                    <p className="text-2xl font-bold text-sage-dark tabular-nums">
                      {Math.min(todayCount, goal)}
                      <span className="text-sm text-brown-light font-semibold"> / {goal}</span>
                    </p>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-brown-light mt-0.5">
                      activities today
                    </p>
                  </div>
                  <div className="bg-cream/70 border border-sage-light/25 rounded-2xl px-4 py-3 text-center">
                    <p className="text-2xl font-bold text-sage-dark tabular-nums flex items-center justify-center gap-1.5">
                      {streak > 0 && <Flame className="w-5 h-5 text-peach-dark" aria-hidden="true" />}
                      {streak}
                    </p>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-brown-light mt-0.5">
                      day streak
                    </p>
                  </div>
                  <div className="bg-cream/70 border border-sage-light/25 rounded-2xl px-4 py-3 text-center col-span-2 sm:col-span-1">
                    <p className="text-2xl font-bold text-sage-dark tabular-nums">
                      {doneToday.size}
                    </p>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-brown-light mt-0.5">
                      different activities today
                    </p>
                  </div>
                </div>

                {state === 'failed' && (
                  <p className="text-xs text-brown-light mb-4" role="note">
                    Progress couldn’t be loaded just now — all activities below still work.
                  </p>
                )}

                {/* اقدام اصلی — ادامه از آخرین فعالیت واقعی یا شروع تمرین */}
                {continueActivity ? (
                  <Link
                    href={continueActivity.href}
                    onClick={() => recordPractice(continueActivity.key)}
                    className="inline-flex items-center gap-2 bg-sage text-brown-dark px-7 py-3.5 rounded-full text-sm font-bold hover:bg-sage-dark hover:shadow-[0_8px_24px_rgba(141,181,133,0.45)] active:scale-[0.98] transition-all cursor-pointer min-h-[48px]"
                  >
                    Continue {continueActivity.title}
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                ) : (
                  <Link
                    href="#activities"
                    className="inline-flex items-center gap-2 bg-sage text-brown-dark px-7 py-3.5 rounded-full text-sm font-bold hover:bg-sage-dark hover:shadow-[0_8px_24px_rgba(141,181,133,0.45)] active:scale-[0.98] transition-all cursor-pointer min-h-[48px]"
                  >
                    Start Practicing
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* ================= فعالیت‌ها ================= */}
      <section id="activities" className="pb-24 pt-6 scroll-mt-32">
        <div className="max-w-7xl mx-auto px-6">
          {/* جست‌وجو + فیلتر دسته + مرتب‌سازی — روی متادیتای واقعی */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-8">
            <div className="relative flex-1 min-w-0">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-light/70 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search activities…"
                aria-label="Search practice activities"
                className="w-full bg-white border border-sage-light/40 rounded-full pl-11 pr-4 py-3 text-sm text-brown-dark placeholder:text-brown-light/60 focus:outline-none focus:ring-2 focus:ring-sage/40 focus:border-sage transition-colors"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by category">
              <button
                type="button"
                onClick={() => setCategory('all')}
                aria-pressed={category === 'all'}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer min-h-[38px] ${
                  category === 'all' ? 'bg-sage text-brown-dark' : 'bg-white border border-sage-light/40 text-brown hover:border-sage'
                }`}
              >
                All
              </button>
              {PRACTICE_CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCategory(c.key)}
                  aria-pressed={category === c.key}
                  title={c.hint}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer min-h-[38px] ${
                    category === c.key ? 'bg-sage text-brown-dark' : 'bg-white border border-sage-light/40 text-brown hover:border-sage'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <label className="sr-only" htmlFor="practice-sort">
              Sort activities
            </label>
            <select
              id="practice-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value === 'recent' ? 'recent' : 'recommended')}
              className="bg-white border border-sage-light/40 rounded-full px-4 py-2.5 text-sm text-brown focus:outline-none focus:ring-2 focus:ring-sage/40 focus:border-sage transition-colors cursor-pointer appearance-none min-h-[38px]"
            >
              <option value="recommended">Recommended</option>
              <option value="recent">Recently used</option>
            </select>
          </div>

          {/* شبکهٔ کارت‌ها */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-sage-light/50">
              <SearchX className="w-10 h-10 mx-auto mb-3 text-brown-light/50" aria-hidden="true" />
              <p className="text-sm text-brown-light">
                No activities match “{query}”. Try a different word or clear the filters.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((a, i) => {
                const Icon = ICONS[a.icon]
                const done = doneToday.has(a.key)
                const lastAt = recentByKey.get(a.key)
                return (
                  <Link
                    key={a.key}
                    href={a.href}
                    onClick={() => recordPractice(a.key)}
                    className={`group bg-white rounded-2xl p-6 border border-sage-light/20 card-hover flex flex-col animate-ct-fadeInUp ${
                      ['delay-100', 'delay-200'][i % 2] ?? ''
                    }`}
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <span className="w-12 h-12 rounded-2xl bg-sage-light/30 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-sage-dark" aria-hidden="true" />
                      </span>
                      {done && (
                        <span className="inline-flex items-center gap-1 bg-sage/20 text-sage-dark text-[11px] font-bold px-2.5 py-1 rounded-full">
                          ✓ done today
                        </span>
                      )}
                    </div>
                    <h2 className="text-base font-bold text-brown-dark mb-1.5 group-hover:text-sage-dark transition-colors">
                      {a.title}
                    </h2>
                    <p className="text-sm text-brown-light leading-relaxed mb-4 flex-1">{a.description}</p>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold mb-4">
                      <span className="bg-cream rounded-full px-2.5 py-1 text-brown">{a.level}</span>
                      <span className="bg-cream rounded-full px-2.5 py-1 text-brown">~{a.minutes} min</span>
                      {lastAt && (
                        <span className="bg-butter/30 rounded-full px-2.5 py-1 text-brown">
                          last practiced {new Date(lastAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                    <span className="mt-auto self-start inline-flex items-center gap-1.5 text-sm font-semibold text-sage-dark group-hover:gap-2.5 transition-all">
                      {a.action}
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ================= فعالیت‌های تعبیه‌شده — همه در همین صفحه ================= */}
      {/* 📅 کلمهٔ روز — سکشن تمام-عرض؛ جداکننده هم‌رنگ بخش قبلی (کرم) */}
      <div id="practice-daily-word" className="scroll-mt-24">
        <WordOfDay onNavigate={navigate} dividerFill="var(--color-cream)" />
      </div>

      {/* 👂 🃏 🧩 بازی تُن‌ها + فلش‌کارت‌ها + آزمون سطح — فاصلهٔ یکنواخت ۱۶؛
          لنگرهای مقصد کارت‌های tone-trainer/flashcards/level-quiz */}
      <section className="pb-28 pt-16">
        <div className="max-w-5xl mx-auto px-6 space-y-16">
          <div id="practice-tone-trainer" className="scroll-mt-28">
            <ToneTrainer />
          </div>
          <div id="practice-flashcards" className="scroll-mt-28">
            <Flashcards key={`cards-${cards?.length ?? 0}`} cards={cards ?? undefined} />
          </div>
          <div id="practice-level-quiz" className="scroll-mt-28">
            <LevelQuiz key="practice-level-quiz" onNavigate={navigate} />
          </div>
        </div>
      </section>
    </div>
  )
}
