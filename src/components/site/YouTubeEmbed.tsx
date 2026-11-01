'use client'

// ---------------------------------------------------------------------------
// 🎬 YouTubeEmbed — پخش‌کنندهٔ یوتیوب با تشخیص خودکارِ ویدیوهای غیرقابل تعبیه
//
// مشکل: بعضی ویدیوها اجازهٔ تعبیه ندارند (یا محدودیت سنی/ورود دارند) — یوتیوب
// داخل فریم پیام «This content is blocked» یا دکمهٔ Sign in می‌دهد و کاربر
// به یوتیوب پرت می‌شود.
//
// راه‌حل: به‌جای iframe خام، از IFrame Player API استفاده می‌کنیم؛ رویداد
// onError (کدهای 100/101/150/2) یعنی «این ویدیو این‌جا پخش نمی‌شود» — بلافاصله
// کارت جایگزین با تصویر و دکمهٔ «Watch on YouTube» نشان داده می‌شود تا کاربر
// مسیر تمیز داشته باشد و در سایت گم نشود.
//
// CSP: اسکریپت‌های https://www.youtube.com/iframe_api و s.ytimg.com در
// script-src مجازند؛ خود فریم از youtube-nocookie است (frame-src).
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, PlayCircle } from 'lucide-react'

interface YTPlayer {
  destroy(): void
}

interface YTErrorEvent {
  data: number
}

interface YTNamespace {
  Player: new (
    el: HTMLElement,
    options: {
      videoId: string
      host?: string
      playerVars?: Record<string, string | number>
      events?: {
        onError?: (e: YTErrorEvent) => void
      }
    }
  ) => YTPlayer
}

declare global {
  interface Window {
    YT?: YTNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

// 🔄 بارگیری یک‌بارهٔ API — همهٔ نمونه‌ها یک promise مشترک دارند
let apiPromise: Promise<YTNamespace> | null = null

function loadYouTubeApi(): Promise<YTNamespace> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (apiPromise) return apiPromise
  apiPromise = new Promise<YTNamespace>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('YouTube API timeout')), 12_000)
    window.onYouTubeIframeAPIReady = () => {
      clearTimeout(timeout)
      if (window.YT?.Player) resolve(window.YT)
      else reject(new Error('YouTube API missing'))
    }
    const s = document.createElement('script')
    s.src = 'https://www.youtube.com/iframe_api'
    s.async = true
    s.onerror = () => {
      clearTimeout(timeout)
      reject(new Error('YouTube API failed to load'))
    }
    document.head.appendChild(s)
  })
  return apiPromise
}

export function YouTubeEmbed({ videoId, title }: { videoId: string; title: string }) {
  const holderRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const [failed, setFailed] = useState(false)
  const [apiBroken, setApiBroken] = useState(false)

  // الگوی رسمی ری‌اکت: تنظیم state هنگام تغییر prop در رندر (بدون setState داخل بدنهٔ effect)
  const [prevVideoId, setPrevVideoId] = useState(videoId)
  if (prevVideoId !== videoId) {
    setPrevVideoId(videoId)
    setFailed(false)
    setApiBroken(false)
  }

  useEffect(() => {
    let cancelled = false
    loadYouTubeApi()
      .then((YT) => {
        if (cancelled || !holderRef.current) return
        // جای‌گاه فریم — API خودش iframe را داخل این div می‌سازد
        holderRef.current.innerHTML = ''
        const mount = document.createElement('div')
        holderRef.current.appendChild(mount)
        playerRef.current = new YT.Player(mount, {
          videoId,
          host: 'https://www.youtube-nocookie.com',
          playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
          events: {
            onError: (e) => {
              // 100 = ویدیو پیدا نشد · 101/150 = سازنده تعبیه را بسته است · 2 = شناسهٔ نامعتبر
              if ([2, 100, 101, 150].includes(e.data)) setFailed(true)
            },
          },
        })
      })
      .catch(() => {
        // API لود نشد (شبکه/CSP) — iframe سادهٔ جایگزین نشان داده می‌شود
        if (!cancelled) setApiBroken(true)
      })
    return () => {
      cancelled = true
      try {
        playerRef.current?.destroy()
      } catch {
        /* پاک‌سازی بهترین‌تلاش */
      }
      playerRef.current = null
    }
  }, [videoId])

  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`
  const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`

  return (
    <div className="bg-black rounded-3xl overflow-hidden shadow-lg aspect-video relative">
      {failed ? (
        /* 🟡 ویدیو اجازهٔ تعبیه ندارد — کارت جایگزین با لینک مستقیم */
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-cream p-6 text-center">
          <div className="relative w-full max-w-md aspect-video rounded-2xl overflow-hidden shadow-md">
            <img src={thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <span className="absolute inset-0 flex items-center justify-center bg-black/40">
              <PlayCircle className="w-14 h-14 text-white" aria-hidden="true" />
            </span>
          </div>
          <p className="text-sm text-brown-dark font-semibold max-w-md">
            This video can’t play inside the site — its uploader restricted embedding.
          </p>
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-sage text-brown-dark px-6 py-3 rounded-full text-sm font-bold hover:bg-sage-dark transition-colors cursor-pointer min-h-[44px]"
          >
            Watch on YouTube <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
          </a>
        </div>
      ) : apiBroken ? (
        /* 🟡 API در دسترس نیست — iframe ساده (رفتار قبلی) */
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          className="w-full h-full border-0"
        />
      ) : (
        <div ref={holderRef} className="w-full h-full [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:border-0" />
      )}
    </div>
  )
}
