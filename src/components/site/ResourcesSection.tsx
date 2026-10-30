'use client'

import { useEffect, useState } from 'react'
import { FolderDown } from 'lucide-react'
import { siteContent } from '@/content/site-content'
import { formatResourceSize } from '@/lib/resources'

// ---------------------------------------------------------------------------
// 📚 بخش «کتابخانهٔ رایگان» — پایین صفحهٔ Learn (درخواست مالک: فایل عمومی)
// فهرست منابع منتشرشده از /api/resources می‌آید؛ اگر هیچ منبعی نباشد کل
// سکشن نمایش داده نمی‌شود. دانلود از مسیر /api/resources/[id]/file با
// Content-Disposition: attachment (شمارندهٔ دانلود همان‌جا زیاد می‌شود).
// ---------------------------------------------------------------------------

interface ResourceItem {
  id: string
  title: string
  description: string
  fileName: string
  fileSize: number
  mimeType: string
  downloads: number
  published?: boolean
}

const rc = siteContent.learn.resources

export function ResourcesSection() {
  const [items, setItems] = useState<ResourceItem[] | null>(null) // null = در حال لود

  useEffect(() => {
    let cancelled = false
    fetch('/api/resources', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return
        const list = Array.isArray(data?.resources) ? data.resources : []
        setItems(list.filter((r: ResourceItem) => r.published !== false))
      })
      .catch(() => {
        if (!cancelled) setItems([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  // هنوز در حال لود یا هیچ منبعی منتشر نشده → سکشن کلاً نمایش داده نشود
  if (items === null || items.length === 0) return null

  return (
    <section id="free-library" className="mt-20 scroll-mt-28" aria-labelledby="free-library-title">
      <div className="bg-white rounded-3xl border border-sage-light/20 shadow-sm overflow-hidden scroll-animate">
        {/* نوار گرادیانی بالای کارت — هماهنگ با بقیهٔ برند */}
        <div className="h-2.5 bg-gradient-to-r from-butter via-sage to-peach" aria-hidden="true" />

        <div className="p-8 md:p-12">
          {/* معرفی بخش */}
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="inline-flex items-center gap-1.5 bg-sage-light/30 rounded-full px-4 py-1.5 mb-4 text-xs font-semibold uppercase tracking-widest text-sage-dark">
              <FolderDown className="w-3.5 h-3.5" aria-hidden="true" /> {rc.eyebrow}
            </span>
            <h2 id="free-library-title" className="text-2xl md:text-3xl font-bold text-brown-dark mb-3">
              {rc.title}
            </h2>
            <p className="text-sm text-brown-light leading-relaxed">{rc.subtitle}</p>
          </div>

          <ul className="space-y-4">
            {items.map((r) => (
              <li
                key={r.id}
                className="bg-cream/60 border border-sage-light/25 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-sage/40 transition-colors"
              >
                <span
                  className="w-12 h-12 rounded-xl bg-sage-light/30 flex items-center justify-center flex-shrink-0"
                  aria-hidden="true"
                >
                  <FolderDown className="w-5 h-5 text-sage-dark" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-brown-dark">{r.title}</p>
                  {r.description && (
                    <p className="text-xs text-brown-light leading-relaxed mt-1">{r.description}</p>
                  )}
                  <p className="text-[11px] text-brown-light/70 mt-1.5">
                    {r.fileName} · {formatResourceSize(r.fileSize)} · {r.downloads}{' '}
                    {r.downloads === 1 ? 'download' : 'downloads'}
                  </p>
                </div>
                <a
                  href={`/api/resources/${r.id}/file`}
                  download={r.fileName || undefined}
                  className="bg-sage text-brown-dark px-5 py-2.5 rounded-full text-sm font-bold hover:bg-sage-dark transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 min-h-[44px] flex-shrink-0"
                >
                  <FolderDown className="w-4 h-4" aria-hidden="true" /> {rc.downloadLabel}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
