'use client'

// ---------------------------------------------------------------------------
// 🎬 VideosAdminTab — Admin → Teaching Videos (Part 6)
// Paste a YouTube URL (watch / youtu.be / shorts) → the ID is extracted and
// validated server-side; thumbnails come from YouTube automatically. Add,
// edit, reorder, publish/unpublish, delete, preview.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Pencil, PlayCircle, Plus, RefreshCw, Trash2 } from 'lucide-react'
import {
  VIDEO_LEVELS,
  VIDEO_CATEGORIES,
  VIDEO_LEVEL_LABELS,
  VIDEO_CATEGORY_LABELS,
} from '@/lib/videos'

interface VideoRow {
  id: string
  youtubeId: string
  title: string
  teacher: string
  level: string
  category: string
  description: string
  durationLabel: string
  sortOrder: number
  published: boolean
  thumbnailUrl: string
}

interface FormState {
  url: string
  title: string
  teacher: string
  level: string
  category: string
  description: string
  durationLabel: string
  sortOrder: number
  published: boolean
}

const EMPTY_FORM: FormState = {
  url: '',
  title: '',
  teacher: '',
  level: 'hsk1',
  category: 'general',
  description: '',
  durationLabel: '',
  sortOrder: 0,
  published: true,
}

export function VideosAdminTab({
  token,
  onToast,
}: {
  token: string
  onToast: (m: string) => void
}) {
  const [videos, setVideos] = useState<VideoRow[] | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/videos', {
        headers: { 'x-admin-key': token },
        cache: 'no-store',
      })
      if (!res.ok) {
        setVideos([])
        return
      }
      const data = await res.json()
      setVideos(Array.isArray(data.videos) ? data.videos : [])
    } catch {
      setVideos([])
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const url = editingId ? `/api/admin/videos/${editingId}` : '/api/admin/videos'
      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': token },
        body: JSON.stringify(form),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(d?.error || 'Save failed.')
        return
      }
      onToast(editingId ? 'Video updated' : 'Video added')
      setForm(EMPTY_FORM)
      setEditingId(null)
      void load()
    } catch {
      setError('Save failed.')
    } finally {
      setBusy(false)
    }
  }

  const edit = (v: VideoRow) => {
    setEditingId(v.id)
    setForm({
      url: `https://youtu.be/${v.youtubeId}`,
      title: v.title,
      teacher: v.teacher,
      level: v.level,
      category: v.category,
      description: v.description,
      durationLabel: v.durationLabel,
      sortOrder: v.sortOrder,
      published: v.published,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const togglePublish = async (v: VideoRow) => {
    const res = await fetch(`/api/admin/videos/${v.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': token },
      body: JSON.stringify({ published: !v.published }),
    })
    if (res.ok) {
      onToast(v.published ? 'Video unpublished' : 'Video published')
      void load()
    }
  }

  const remove = async (v: VideoRow) => {
    if (!window.confirm(`Delete “${v.title}”?`)) return
    const res = await fetch(`/api/admin/videos/${v.id}`, {
      method: 'DELETE',
      headers: { 'x-admin-key': token },
    })
    if (res.ok) {
      onToast('Video deleted')
      void load()
    }
  }

  const field =
    'w-full bg-cream/60 border border-sage-light/40 rounded-xl px-4 py-2.5 text-sm text-brown placeholder:text-brown-light/60 focus:outline-none focus:border-sage'
  const label = 'block text-xs font-semibold uppercase tracking-wider text-brown mb-1.5'

  return (
    <div className="space-y-6">
      {/* form */}
      <form onSubmit={submit} className="bg-white rounded-2xl border border-sage-light/30 p-5 space-y-4">
        <h3 className="text-sm font-bold text-brown-dark flex items-center gap-2">
          <Plus className="w-4 h-4 text-sage-dark" aria-hidden="true" />
          {editingId ? 'Edit video' : 'Add a teaching video'}
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={label} htmlFor="video-url">
              YouTube URL (watch / youtu.be / shorts)
            </label>
            <input
              id="video-url"
              type="text"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=…"
              required
              className={field}
            />
          </div>
          <div>
            <label className={label} htmlFor="video-title">
              Title
            </label>
            <input id="video-title" type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required maxLength={160} className={field} />
          </div>
          <div>
            <label className={label} htmlFor="video-teacher">
              Teacher name
            </label>
            <input id="video-teacher" type="text" value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })} maxLength={80} className={field} />
          </div>
          <div>
            <label className={label} htmlFor="video-level">
              HSK level
            </label>
            <select id="video-level" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className={field}>
              {VIDEO_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {VIDEO_LEVEL_LABELS[l]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="video-category">
              Category
            </label>
            <select id="video-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={field}>
              {VIDEO_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {VIDEO_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="video-duration">
              Duration (optional, display only)
            </label>
            <input id="video-duration" type="text" value={form.durationLabel} onChange={(e) => setForm({ ...form, durationLabel: e.target.value })} placeholder="e.g. 12:40" maxLength={40} className={field} />
          </div>
          <div>
            <label className={label} htmlFor="video-sort">
              Display order (lower = first)
            </label>
            <input id="video-sort" type="number" min={0} max={9999} value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) || 0 })} className={field} />
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="video-desc">
              Short description
            </label>
            <textarea id="video-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} maxLength={1200} className={field} />
          </div>
        </div>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="w-4 h-4 accent-[#A8C9A0]" />
          <span className="text-sm text-brown">Published (visible on the website)</span>
        </label>
        {error && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="bg-sage text-brown-dark px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-sage-dark transition-colors cursor-pointer disabled:opacity-60 inline-flex items-center gap-2"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            {editingId ? 'Save changes' : 'Add video'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null)
                setForm(EMPTY_FORM)
              }}
              className="px-4 py-2.5 rounded-xl text-sm text-brown bg-cream hover:bg-cream-dark cursor-pointer"
            >
              Cancel edit
            </button>
          )}
        </div>
      </form>

      {/* list */}
      {videos === null ? (
        <p className="text-sm text-brown-light flex items-center gap-2 py-10 justify-center" role="status">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Loading videos…
        </p>
      ) : videos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-sage-light/50">
          <p className="text-sm text-brown-light">No videos yet — add the first one above.</p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1">
          {videos.map((v) => (
            <div key={v.id} className="bg-white rounded-2xl border border-sage-light/25 p-4 flex flex-wrap items-center gap-4">
              { }
              <img src={v.thumbnailUrl} alt="" className="w-24 aspect-video object-cover rounded-xl flex-shrink-0 bg-cream-dark" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-brown-dark truncate">
                  {v.title} {!v.published && <span className="ml-2 text-[10px] font-bold uppercase bg-cream text-brown-light px-2 py-0.5 rounded-full">draft</span>}
                </p>
                <p className="text-[11px] text-brown-light mt-0.5">
                  {VIDEO_LEVEL_LABELS[v.level] ?? v.level} · {VIDEO_CATEGORY_LABELS[v.category] ?? v.category}
                  {v.teacher ? ` · ${v.teacher}` : ''} · order {v.sortOrder}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <a
                  href={`/teaching-videos/${v.id}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Preview ${v.title}`}
                  className="p-2 rounded-full bg-cream text-brown hover:bg-cream-dark cursor-pointer"
                >
                  <PlayCircle className="w-4 h-4" aria-hidden="true" />
                </a>
                <button type="button" onClick={() => edit(v)} aria-label={`Edit ${v.title}`} className="p-2 rounded-full bg-cream text-brown hover:bg-cream-dark cursor-pointer">
                  <Pencil className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => void togglePublish(v)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold bg-cream text-brown hover:bg-cream-dark cursor-pointer min-h-[32px]"
                >
                  {v.published ? 'Unpublish' : 'Publish'}
                </button>
                <button type="button" onClick={() => void remove(v)} aria-label={`Delete ${v.title}`} className="p-2 rounded-full bg-peach-light/40 text-peach-dark hover:bg-peach/40 cursor-pointer">
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
