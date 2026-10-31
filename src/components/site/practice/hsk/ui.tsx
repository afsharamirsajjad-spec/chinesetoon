'use client'

// ---------------------------------------------------------------------------
// 🧩 Shared UI pieces for the structured HSK practice pages — progress bars,
// breadcrumbs, status chips, audio buttons and lock badges. Styled with the
// site's brand tokens (sage/butter/peach/cream) to match the rest of Chinese
// Toon. Chinese text uses the .ct-hanzi font stack from globals.css.
// ---------------------------------------------------------------------------

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Loader2, Volume2 } from 'lucide-react'
import { speakChinese } from '@/lib/ct-speak'

export function ProgressBar({
  percent,
  className = '',
  label,
}: {
  percent: number
  className?: string
  label?: string
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)))
  return (
    <div
      className={`h-2 bg-cream-dark rounded-full overflow-hidden ${className}`}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className="h-full bg-gradient-to-r from-sage to-sage-dark rounded-full transition-all duration-500"
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}

export interface Crumb {
  label: string
  href?: string
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-brown-light mb-6">
      {items.map((c, i) => (
        <span key={i} className="inline-flex items-center gap-1">
          {i > 0 && <ChevronRight className="w-3 h-3 text-brown-light/50" aria-hidden="true" />}
          {c.href ? (
            <Link href={c.href} className="hover:text-sage-dark transition-colors cursor-pointer">
              {c.label}
            </Link>
          ) : (
            <span className="font-semibold text-brown">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}

export function StatusChip({ status }: { status: 'completed' | 'in-progress' | 'not-started' }) {
  const map = {
    completed: { text: '✓ Completed', cls: 'bg-sage/25 text-sage-dark' },
    'in-progress': { text: 'In progress', cls: 'bg-butter/35 text-brown' },
    'not-started': { text: 'Not started', cls: 'bg-cream text-brown-light' },
  } as const
  const s = map[status]
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${s.cls}`}>
      {s.text}
    </span>
  )
}

/** Replayable native-quality Mandarin audio via the site TTS engine */
export function SpeakButton({
  text,
  size = 'md',
  className = '',
}: {
  text: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const [playing, setPlaying] = useState(false)
  const [failed, setFailed] = useState(false)
  const dims = { sm: 'w-9 h-9', md: 'w-11 h-11', lg: 'w-16 h-16' }[size]
  const icon = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-8 h-8' }[size]
  const play = async () => {
    if (playing) return
    setPlaying(true)
    setFailed(false)
    try {
      const source = await speakChinese(text, { onEnd: () => setPlaying(false) })
      if (source === 'none') {
        setFailed(true)
        setPlaying(false)
      }
    } catch {
      setFailed(true)
      setPlaying(false)
    }
  }
  return (
    <span className="inline-flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => void play()}
        disabled={playing}
        aria-label={`Play audio: ${text}`}
        className={`${dims} rounded-full bg-sage-light/40 text-sage-dark hover:bg-sage hover:text-brown-dark transition-colors cursor-pointer disabled:opacity-60 inline-flex items-center justify-center flex-shrink-0 ${className}`}
      >
        {playing ? (
          <Loader2 className={`${icon} animate-spin`} aria-hidden="true" />
        ) : (
          <Volume2 className={icon} aria-hidden="true" />
        )}
      </button>
      {failed && <span className="text-[10px] text-brown-light">no audio available</span>}
    </span>
  )
}

export function LockBadge() {
  return (
    <span
      className="w-10 h-10 rounded-full bg-cream-dark flex items-center justify-center text-brown-light flex-shrink-0"
      aria-hidden="true"
    >
      🔒
    </span>
  )
}
