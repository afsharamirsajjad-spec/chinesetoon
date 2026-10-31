'use client'

// ---------------------------------------------------------------------------
// 🎬 VideosLibrary — public Teaching Samples grid (Part 6)
// Cards with thumbnail, teacher, level, category, description; filters by
// level and category; click-through to the dedicated watch page.
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Loader2, PlayCircle, SearchX } from 'lucide-react'
import { resilientJsonFetch } from '@/lib/client-fetch'
import { VIDEO_LEVELS, VIDEO_CATEGORIES, VIDEO_LEVEL_LABELS, VIDEO_CATEGORY_LABELS } from '@/lib/videos'

interface VideoCard {
  id: string
  title: string
  teacher: string
  level: string
  category: string
  description: string
  durationLabel: string
  thumbnailUrl: string
}

export function VideosLibrary() {
  const [videos, setVideos] = useState<VideoCard[] | null>(null)
  const [level, setLevel] = useState('')
  const [category, setCategory] = useState('')

  useEffect(() => {
    let cancelled = false
    const params = new URLSearchParams()
    if (level) params.set('level', level)
    if (category) params.set('category', category)
    resilientJsonFetch<{ videos: VideoCard[] }>(`/api/videos?${params.toString()}`, { cache: 'no-store' }).then(
      (res) => {
        if (!cancelled) setVideos(res.ok && res.data ? res.data.videos : [])
      }
    )
    return () => {
      cancelled = true
    }
  }, [level, category])

  const usedLevels = useMemo(() => {
    const set = new Set((videos ?? []).map((v) => v.level))
    return VIDEO_LEVELS.filter((l) => set.has(l))
  }, [videos])
  const usedCategories = useMemo(() => {
    const set = new Set((videos ?? []).map((v) => v.category))
    return VIDEO_CATEGORIES.filter((c) => set.has(c))
  }, [videos])

  return (
    <section className="pb-28 pt-6">
      <div className="max-w-7xl mx-auto px-6">
        {/* filters */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-8">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by level">
            <button
              type="button"
              onClick={() => setLevel('')}
              aria-pressed={level === ''}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer min-h-[38px] ${
                level === '' ? 'bg-sage text-brown-dark' : 'bg-white border border-sage-light/40 text-brown hover:border-sage'
              }`}
            >
              All levels
            </button>
            {usedLevels.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLevel(l)}
                aria-pressed={level === l}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer min-h-[38px] ${
                  level === l ? 'bg-sage text-brown-dark' : 'bg-white border border-sage-light/40 text-brown hover:border-sage'
                }`}
              >
                {VIDEO_LEVEL_LABELS[l] ?? l}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by category">
            <button
              type="button"
              onClick={() => setCategory('')}
              aria-pressed={category === ''}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer min-h-[38px] ${
                category === '' ? 'bg-butter text-brown-dark' : 'bg-white border border-sage-light/40 text-brown hover:border-sage'
              }`}
            >
              All categories
            </button>
            {usedCategories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                aria-pressed={category === c}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer min-h-[38px] ${
                  category === c ? 'bg-butter text-brown-dark' : 'bg-white border border-sage-light/40 text-brown hover:border-sage'
                }`}
              >
                {VIDEO_CATEGORY_LABELS[c] ?? c}
              </button>
            ))}
          </div>
        </div>

        {videos === null ? (
          <p className="text-sm text-brown-light flex items-center justify-center gap-2 py-16" role="status">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Loading videos…
          </p>
        ) : videos.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-sage-light/50">
            <SearchX className="w-10 h-10 mx-auto mb-3 text-brown-light/50" aria-hidden="true" />
            <p className="text-sm text-brown-light">No videos match these filters yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((v, i) => (
              <Link
                key={v.id}
                href={`/teaching-videos/${v.id}`}
                className="group bg-white rounded-2xl border border-sage-light/20 card-hover overflow-hidden flex flex-col animate-ct-fadeInUp"
                style={{ animationDelay: `${(i % 6) * 60}ms` }}
              >
                <div className="relative aspect-video bg-cream-dark">
                  { }
                  <img
                    src={v.thumbnailUrl}
                    alt={v.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <PlayCircle className="w-12 h-12 text-white drop-shadow-lg group-hover:scale-110 transition-transform" aria-hidden="true" />
                  </span>
                  {v.durationLabel && (
                    <span className="absolute bottom-2 right-2 bg-brown-dark/80 text-white text-[11px] font-bold px-2 py-0.5 rounded-md">
                      {v.durationLabel}
                    </span>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h2 className="text-base font-bold text-brown-dark mb-1 group-hover:text-sage-dark transition-colors">
                    {v.title}
                  </h2>
                  {v.teacher && <p className="text-xs font-semibold text-sage-dark mb-2">{v.teacher}</p>}
                  <p className="text-sm text-brown-light leading-relaxed mb-4 flex-1 line-clamp-3">{v.description}</p>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                    <span className="bg-cream rounded-full px-2.5 py-1 text-brown">{VIDEO_LEVEL_LABELS[v.level] ?? v.level}</span>
                    <span className="bg-cream rounded-full px-2.5 py-1 text-brown">{VIDEO_CATEGORY_LABELS[v.category] ?? v.category}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
