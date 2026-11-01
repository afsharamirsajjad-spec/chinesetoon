'use client'

// ---------------------------------------------------------------------------
// 🎬 TeachingVideosSection — بخش «ویدیوهای آموزشی» در صفحهٔ Learn
//
// درخواست مالک: ویدیوهای یوتیوب در تب Learn بیایند. جدیدترین ویدیوهای منتشرشده
// (تا ۶ کارت) + دکمهٔ «همهٔ ویدیوها» به کتابخانهٔ کامل /teaching-videos.
// ویدیو در پنل ادمین (تب Teaching Videos) مدیریت می‌شود؛ خالی = سکشن رندر نمی‌شود.
// ---------------------------------------------------------------------------

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, PlayCircle } from 'lucide-react'
import { resilientJsonFetch } from '@/lib/client-fetch'
import { VIDEO_LEVEL_LABELS } from '@/lib/videos'

interface VideoCard {
  id: string
  title: string
  teacher: string
  level: string
  description: string
  thumbnailUrl: string
}

export function TeachingVideosSection() {
  const [videos, setVideos] = useState<VideoCard[] | null>(null)

  useEffect(() => {
    let cancelled = false
    resilientJsonFetch<{ videos: VideoCard[] }>('/api/videos', { cache: 'no-store' }).then((res) => {
      if (!cancelled) setVideos(res.ok && res.data ? res.data.videos : [])
    })
    return () => {
      cancelled = true
    }
  }, [])

  // هنوز در حال لود یا هیچ ویدیویی منتشر نشده — سکشن دیده نمی‌شود
  if (videos === null || videos.length === 0) return null
  const shown = videos.slice(0, 6)

  return (
    <section id="learn-videos" className="pt-20 scroll-mt-28">
      <div className="text-center max-w-2xl mx-auto mb-8 scroll-animate">
        <h2 className="text-3xl md:text-4xl font-bold text-brown-dark mb-3">Teaching Videos</h2>
        <p className="text-brown-light">
          Watch real teaching samples — grammar, pronunciation and sample classes from our teachers.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shown.map((v, i) => (
          <Link
            key={v.id}
            href={`/teaching-videos/${v.id}`}
            className={`group bg-white rounded-2xl overflow-hidden border border-sage-light/20 card-hover animate-ct-fadeInUp ${
              ['', 'delay-100', 'delay-200'][i % 3]
            }`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="relative aspect-video bg-cream-dark">
              {/* 🖼️ thumbnail از خود یوتیوب می‌آید (lazy) */}
              <img
                src={v.thumbnailUrl}
                alt=""
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="w-12 h-12 rounded-full bg-white/90 text-sage-dark flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                  <PlayCircle className="w-7 h-7" aria-hidden="true" />
                </span>
              </span>
            </div>
            <div className="p-5">
              <h3 className="text-base font-semibold text-brown-dark mb-1 group-hover:text-sage-dark transition-colors">
                {v.title}
              </h3>
              <p className="text-xs text-brown-light mb-2">
                {VIDEO_LEVEL_LABELS[v.level] ?? v.level}
                {v.teacher ? ` · ${v.teacher}` : ''}
              </p>
              {v.description && (
                <p className="text-sm text-brown-light line-clamp-2">{v.description}</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {videos.length > shown.length && (
        <div className="text-center mt-10">
          <Link
            href="/teaching-videos"
            className="inline-flex items-center gap-2 bg-white border border-sage-light/50 text-brown px-6 py-3 rounded-full text-sm font-semibold hover:border-sage hover:text-sage-dark transition-all cursor-pointer"
          >
            View all videos <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      )}
    </section>
  )
}
