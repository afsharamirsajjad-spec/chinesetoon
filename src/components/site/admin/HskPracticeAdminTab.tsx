'use client'

// ---------------------------------------------------------------------------
// 📚 HskPracticeAdminTab — Admin → HSK Practice (Part 4.2/4.3)
//
// Stage manager (create/edit/reorder/publish/lock/unlock/delete per HSK
// level) + per-stage content managers for Vocabulary, Grammar,
// Pronunciation and Reading. The admin can also preview any stage as a
// student (direct link to /practice/hsk1/stage-N).
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useState } from 'react'
import { ExternalLink, Eye, Loader2, Lock, Pencil, Plus, RefreshCw, Trash2, Unlock } from 'lucide-react'

interface StageRow {
  id: string
  level: string
  stageNumber: number
  title: string
  description: string
  published: boolean
  manuallyUnlocked: boolean
  wordCount: number
  grammarCount: number
  readingCount: number
  pronunciationCount: number
}

const LEVELS = ['hsk1', 'hsk2', 'hsk3'] as const
const LEVEL_LABELS: Record<string, string> = { hsk1: 'HSK 1', hsk2: 'HSK 2', hsk3: 'HSK 3' }

const field =
  'w-full bg-cream/60 border border-sage-light/40 rounded-xl px-4 py-2.5 text-sm text-brown placeholder:text-brown-light/60 focus:outline-none focus:border-sage'
const labelCls = 'block text-xs font-semibold uppercase tracking-wider text-brown mb-1.5'

export function HskPracticeAdminTab({
  token,
  onToast,
}: {
  token: string
  onToast: (m: string) => void
}) {
  const [level, setLevel] = useState<string>('hsk1')
  const [stages, setStages] = useState<StageRow[] | null>(null)
  const [editing, setEditing] = useState<StageRow | 'new' | null>(null)
  const [form, setForm] = useState({ stageNumber: 1, title: '', description: '', published: true, manuallyUnlocked: false })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/hsk/stages?level=${level}`, {
        headers: { 'x-admin-key': token },
        cache: 'no-store',
      })
      if (!res.ok) {
        setStages([])
        return
      }
      const data = await res.json()
      setStages(Array.isArray(data.stages) ? data.stages : [])
    } catch {
      setStages([])
    }
  }, [token, level])

  useEffect(() => {
    void load()
  }, [load])

  const openNew = () => {
    const nextNumber = (stages?.length ?? 0) + 1
    setForm({ stageNumber: nextNumber, title: '', description: '', published: true, manuallyUnlocked: false })
    setEditing('new')
    setError('')
  }

  const openEdit = (s: StageRow) => {
    setForm({ stageNumber: s.stageNumber, title: s.title, description: s.description, published: s.published, manuallyUnlocked: s.manuallyUnlocked })
    setEditing(s)
    setError('')
  }

  const save = async () => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      if (editing === 'new') {
        const res = await fetch('/api/admin/hsk/stages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-key': token },
          body: JSON.stringify({ ...form, level }),
        })
        const d = await res.json().catch(() => ({}))
        if (!res.ok) {
          setError(d?.error || 'Create failed')
          return
        }
        onToast('Stage created')
      } else if (editing) {
        const res = await fetch(`/api/admin/hsk/stages/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'x-admin-key': token },
          body: JSON.stringify(form),
        })
        const d = await res.json().catch(() => ({}))
        if (!res.ok) {
          setError(d?.error || 'Save failed')
          return
        }
        onToast('Stage updated')
      }
      setEditing(null)
      void load()
    } finally {
      setBusy(false)
    }
  }

  const toggle = async (s: StageRow, patch: { published?: boolean; manuallyUnlocked?: boolean }) => {
    const res = await fetch(`/api/admin/hsk/stages/${s.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': token },
      body: JSON.stringify(patch),
    })
    if (res.ok) void load()
    else onToast('Update failed')
  }

  const remove = async (s: StageRow) => {
    if (!window.confirm(`Delete Stage ${s.stageNumber} “${s.title}” and ALL its words, lessons and readings?`)) return
    const res = await fetch(`/api/admin/hsk/stages/${s.id}`, {
      method: 'DELETE',
      headers: { 'x-admin-key': token },
    })
    if (res.ok) {
      onToast('Stage deleted')
      void load()
    }
  }

  return (
    <div className="space-y-6">
      {/* level tabs */}
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="HSK level">
        {LEVELS.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLevel(l)}
            aria-pressed={level === l}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer min-h-[38px] ${
              level === l ? 'bg-sage text-brown-dark' : 'bg-white border border-sage-light/40 text-brown hover:border-sage'
            }`}
          >
            {LEVEL_LABELS[l]}
          </button>
        ))}
        <button
          type="button"
          onClick={() => void load()}
          aria-label="Refresh"
          className="p-2.5 rounded-full bg-white border border-sage-light/40 text-brown hover:border-sage cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* stage editor */}
      {editing && (
        <div className="bg-white rounded-2xl border border-sage-light/30 p-5 space-y-4">
          <h3 className="text-sm font-bold text-brown-dark">
            {editing === 'new' ? `New ${LEVEL_LABELS[level]} stage` : `Edit Stage ${editing.stageNumber}`}
          </h3>
          <div className="grid sm:grid-cols-4 gap-4">
            <div>
              <label className={labelCls} htmlFor="stage-num">Stage number</label>
              <input id="stage-num" type="number" min={1} max={50} value={form.stageNumber} onChange={(e) => setForm({ ...form, stageNumber: Number(e.target.value) || 1 })} className={field} />
            </div>
            <div className="sm:col-span-3">
              <label className={labelCls} htmlFor="stage-title">Title</label>
              <input id="stage-title" type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Hello! First Words" className={field} />
            </div>
            <div className="sm:col-span-4">
              <label className={labelCls} htmlFor="stage-desc">Description</label>
              <textarea id="stage-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className={field} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="w-4 h-4 accent-[#A8C9A0]" />
              <span className="text-sm text-brown">Published (visible to students)</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer" title="Students can access this stage without finishing the previous one">
              <input type="checkbox" checked={form.manuallyUnlocked} onChange={(e) => setForm({ ...form, manuallyUnlocked: e.target.checked })} className="w-4 h-4 accent-[#A8C9A0]" />
              <span className="text-sm text-brown">Always unlocked</span>
            </label>
          </div>
          {error && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => void save()} disabled={busy} className="bg-sage text-brown-dark px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-sage-dark cursor-pointer disabled:opacity-60 inline-flex items-center gap-2">
              {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              Save stage
            </button>
            <button type="button" onClick={() => setEditing(null)} className="px-4 py-2.5 rounded-xl text-sm text-brown bg-cream hover:bg-cream-dark cursor-pointer">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* stage list */}
      {stages === null ? (
        <p className="text-sm text-brown-light flex items-center gap-2 py-10 justify-center" role="status">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Loading stages…
        </p>
      ) : (
        <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1">
          {stages.length === 0 && (
            <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-sage-light/50">
              <p className="text-sm text-brown-light mb-3">No stages for {LEVEL_LABELS[level]} yet.</p>
              <button type="button" onClick={openNew} className="bg-sage text-brown-dark px-4 py-2 rounded-xl text-sm font-bold hover:bg-sage-dark cursor-pointer inline-flex items-center gap-2">
                <Plus className="w-4 h-4" aria-hidden="true" /> Create the first stage
              </button>
            </div>
          )}
          {stages.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl border border-sage-light/25 p-4 flex flex-wrap items-center gap-4">
              <span className="w-10 h-10 rounded-xl bg-sage-light/30 text-sage-dark font-bold flex items-center justify-center flex-shrink-0">
                {s.stageNumber}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-brown-dark truncate">
                  {s.title}
                  {!s.published && <span className="ml-2 text-[10px] font-bold uppercase bg-cream text-brown-light px-2 py-0.5 rounded-full">draft</span>}
                  {s.manuallyUnlocked && <span className="ml-2 text-[10px] font-bold uppercase bg-butter/40 text-brown px-2 py-0.5 rounded-full">always unlocked</span>}
                </p>
                <p className="text-[11px] text-brown-light mt-0.5">
                  {s.wordCount} words · {s.grammarCount} grammar · {s.pronunciationCount} pronunciation · {s.readingCount} readings
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 flex-shrink-0">
                <a
                  href={`/practice/hsk1/stage-${s.stageNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  title="Preview as a student"
                  aria-label={`Preview stage ${s.stageNumber}`}
                  className="p-2 rounded-full bg-cream text-brown hover:bg-cream-dark cursor-pointer"
                >
                  <Eye className="w-4 h-4" aria-hidden="true" />
                </a>
                <button
                  type="button"
                  onClick={() => void toggle(s, { manuallyUnlocked: !s.manuallyUnlocked })}
                  title={s.manuallyUnlocked ? 'Lock to normal progression' : 'Unlock for everyone'}
                  aria-label={s.manuallyUnlocked ? 'Lock stage' : 'Unlock stage'}
                  className="p-2 rounded-full bg-cream text-brown hover:bg-cream-dark cursor-pointer"
                >
                  {s.manuallyUnlocked ? <Unlock className="w-4 h-4" aria-hidden="true" /> : <Lock className="w-4 h-4" aria-hidden="true" />}
                </button>
                <button
                  type="button"
                  onClick={() => void toggle(s, { published: !s.published })}
                  className="px-3 py-1.5 rounded-full text-xs font-bold bg-cream text-brown hover:bg-cream-dark cursor-pointer min-h-[32px]"
                >
                  {s.published ? 'Unpublish' : 'Publish'}
                </button>
                <button type="button" onClick={() => openEdit(s)} aria-label={`Edit stage ${s.stageNumber}`} className="p-2 rounded-full bg-cream text-brown hover:bg-cream-dark cursor-pointer">
                  <Pencil className="w-4 h-4" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => void remove(s)} aria-label={`Delete stage ${s.stageNumber}`} className="p-2 rounded-full bg-peach-light/40 text-peach-dark hover:bg-peach/40 cursor-pointer">
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
          {stages.length > 0 && (
            <button type="button" onClick={openNew} className="bg-sage text-brown-dark px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-sage-dark cursor-pointer inline-flex items-center gap-2">
              <Plus className="w-4 h-4" aria-hidden="true" /> Add stage
            </button>
          )}
        </div>
      )}

      <p className="text-[11px] text-brown-light flex items-center gap-1.5">
        <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
        Content (vocabulary, grammar, pronunciation, reading) of each stage is managed inside the stage’s module pages — select a stage above to open its content below.
      </p>

      <StageContentManager token={token} onToast={onToast} stages={stages ?? []} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Per-stage content manager — Vocabulary / Grammar / Pronunciation / Reading
// ---------------------------------------------------------------------------

type ContentKind = 'words' | 'grammar' | 'pronunciations' | 'readings'
const CONTENT_TABS: Array<{ key: ContentKind; label: string }> = [
  { key: 'words', label: 'Vocabulary' },
  { key: 'grammar', label: 'Grammar' },
  { key: 'pronunciations', label: 'Pronunciation' },
  { key: 'readings', label: 'Reading' },
]

function StageContentManager({
  token,
  onToast,
  stages,
}: {
  token: string
  onToast: (m: string) => void
  stages: StageRow[]
}) {
  const [stageId, setStageId] = useState('')
  const [kind, setKind] = useState<ContentKind>('words')
  const [items, setItems] = useState<Array<Record<string, unknown>> | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (stages.length > 0 && !stages.some((s) => s.id === stageId)) {
      setStageId(stages[0].id)
    }
    if (stages.length === 0) setStageId('')
  }, [stages, stageId])

  const load = useCallback(async () => {
    if (!stageId) {
      setItems([])
      return
    }
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/hsk/${kind}?stageId=${stageId}`, {
        headers: { 'x-admin-key': token },
        cache: 'no-store',
      })
      if (!res.ok) {
        setItems([])
        return
      }
      const data = await res.json()
      setItems(Array.isArray(data.items) ? data.items : [])
    } catch {
      setItems([])
    } finally {
      setBusy(false)
    }
  }, [token, kind, stageId])

  useEffect(() => {
    void load()
  }, [load])

  const quickAddWord = async () => {
    const hanzi = window.prompt('Word (hanzi):')
    if (!hanzi) return
    const pinyin = window.prompt('Pinyin (with tone marks):') ?? ''
    const meaning = window.prompt('English meaning:') ?? ''
    const res = await fetch('/api/admin/hsk/words', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': token },
      body: JSON.stringify({ stageId, hanzi, pinyin, meaning, category: 'other', sortOrder: (items?.length ?? 0), published: true }),
    })
    const d = await res.json().catch(() => ({}))
    if (res.ok) {
      onToast('Word added — edit details inline')
      void load()
    } else {
      onToast(d?.error || 'Could not add the word')
    }
  }

  const quickAddGrammar = async () => {
    const title = window.prompt('Grammar topic title:')
    if (!title) return
    const res = await fetch('/api/admin/hsk/grammar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': token },
      body: JSON.stringify({ stageId, title, explanation: '', structure: '', examples: [], mistakes: [], sortOrder: (items?.length ?? 0), published: true }),
    })
    const d = await res.json().catch(() => ({}))
    if (res.ok) {
      onToast('Grammar topic added — add examples next')
      void load()
    } else {
      onToast(d?.error || 'Could not add the topic')
    }
  }

  const quickAddReading = async () => {
    const title = window.prompt('Passage title:')
    if (!title) return
    const res = await fetch('/api/admin/hsk/readings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': token },
      body: JSON.stringify({ stageId, title, form: 'text', lines: [], notes: [], sortOrder: (items?.length ?? 0), published: true }),
    })
    const d = await res.json().catch(() => ({}))
    if (res.ok) {
      onToast('Passage added — add its lines next')
      void load()
    } else {
      onToast(d?.error || 'Could not add the passage')
    }
  }

  const quickAddPronunciation = async () => {
    const title = window.prompt('Pronunciation lesson title:')
    if (!title) return
    const res = await fetch('/api/admin/hsk/pronunciations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': token },
      body: JSON.stringify({ stageId, title, intro: '', sections: [], sortOrder: (items?.length ?? 0), published: true }),
    })
    const d = await res.json().catch(() => ({}))
    if (res.ok) {
      onToast('Pronunciation lesson added')
      void load()
    } else {
      onToast(d?.error || 'Could not add the lesson')
    }
  }

  const togglePublished = async (item: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/hsk/${kind}/${String(item.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': token },
      body: JSON.stringify({ published: !item.published }),
    })
    if (res.ok) void load()
  }

  const removeItem = async (item: Record<string, unknown>) => {
    const title = String(item.hanzi ?? item.title ?? 'this item')
    if (!window.confirm(`Delete “${title}”?`)) return
    const res = await fetch(`/api/admin/hsk/${kind}/${String(item.id)}`, {
      method: 'DELETE',
      headers: { 'x-admin-key': token },
    })
    if (res.ok) {
      onToast('Deleted')
      void load()
    }
  }

  const titleOf = (item: Record<string, unknown>): string => {
    switch (kind) {
      case 'words':
        return `${String(item.hanzi)} (${String(item.pinyin)}) — ${String(item.meaning)}`
      case 'grammar':
        return String(item.title)
      case 'pronunciations':
        return String(item.title)
      case 'readings':
        return `${String(item.title)} (${String(item.form)})`
    }
  }

  const subOf = (item: Record<string, unknown>): string => {
    switch (kind) {
      case 'words':
        return String(item.example || 'no example yet')
      case 'grammar':
        return `${(Array.isArray(item.examples) ? item.examples.length : 0)} examples · ${(Array.isArray(item.mistakes) ? item.mistakes.length : 0)} mistakes`
      case 'pronunciations':
        return `${(Array.isArray(item.sections) ? item.sections.length : 0)} sections`
      case 'readings':
        return `${(Array.isArray(item.lines) ? item.lines.length : 0)} lines`
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-sage-light/30 p-5 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-sm font-bold text-brown-dark">Stage content</h3>
        <select
          value={stageId}
          onChange={(e) => setStageId(e.target.value)}
          aria-label="Choose stage"
          className="bg-cream/60 border border-sage-light/40 rounded-xl px-3.5 py-2 text-sm text-brown cursor-pointer min-h-[38px]"
        >
          {stages.map((s) => (
            <option key={s.id} value={s.id}>
              Stage {s.stageNumber} — {s.title}
            </option>
          ))}
          {stages.length === 0 && <option value="">No stages yet</option>}
        </select>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Content type">
          {CONTENT_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setKind(t.key)}
              aria-pressed={kind === t.key}
              className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer min-h-[36px] ${
                kind === t.key ? 'bg-sage text-brown-dark' : 'bg-cream text-brown hover:bg-cream-dark'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {!stageId ? (
        <p className="text-xs text-brown-light">Create a stage first, then manage its content here.</p>
      ) : busy ? (
        <p className="text-sm text-brown-light flex items-center gap-2 py-6" role="status">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Loading…
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {kind === 'words' && (
              <button type="button" onClick={() => void quickAddWord()} className="bg-sage text-brown-dark px-4 py-2 rounded-xl text-sm font-bold hover:bg-sage-dark cursor-pointer inline-flex items-center gap-2">
                <Plus className="w-4 h-4" aria-hidden="true" /> Add word
              </button>
            )}
            {kind === 'grammar' && (
              <button type="button" onClick={() => void quickAddGrammar()} className="bg-sage text-brown-dark px-4 py-2 rounded-xl text-sm font-bold hover:bg-sage-dark cursor-pointer inline-flex items-center gap-2">
                <Plus className="w-4 h-4" aria-hidden="true" /> Add grammar topic
              </button>
            )}
            {kind === 'pronunciations' && (
              <button type="button" onClick={() => void quickAddPronunciation()} className="bg-sage text-brown-dark px-4 py-2 rounded-xl text-sm font-bold hover:bg-sage-dark cursor-pointer inline-flex items-center gap-2">
                <Plus className="w-4 h-4" aria-hidden="true" /> Add pronunciation lesson
              </button>
            )}
            {kind === 'readings' && (
              <button type="button" onClick={() => void quickAddReading()} className="bg-sage text-brown-dark px-4 py-2 rounded-xl text-sm font-bold hover:bg-sage-dark cursor-pointer inline-flex items-center gap-2">
                <Plus className="w-4 h-4" aria-hidden="true" /> Add passage
              </button>
            )}
            <p className="text-[11px] text-brown-light">
              Tip: add items here quickly, then edit their details (examples, pinyin, lines…) with the pencil — the edit form opens the full JSON editor.
            </p>
          </div>

          {(items ?? []).length === 0 ? (
            <p className="text-xs text-brown-light bg-cream/60 rounded-xl px-4 py-3">Nothing here yet — add the first one above.</p>
          ) : (
            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
              {(items ?? []).map((item) => (
                <ContentItemRow
                  key={String(item.id)}
                  item={item}
                  kind={kind}
                  token={token}
                  onToast={onToast}
                  onReload={load}
                  onToggle={() => void togglePublished(item)}
                  onDelete={() => void removeItem(item)}
                  title={titleOf(item)}
                  sub={subOf(item)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ContentItemRow({
  item,
  kind,
  token,
  onToast,
  onReload,
  onToggle,
  onDelete,
  title,
  sub,
}: {
  item: Record<string, unknown>
  kind: ContentKind
  token: string
  onToast: (m: string) => void
  onReload: () => void
  onToggle: () => void
  onDelete: () => void
  title: string
  sub: string
}) {
  const [editing, setEditing] = useState(false)
  const [json, setJson] = useState('')
  const [busy, setBusy] = useState(false)

  const EDITABLE_FIELDS: Record<ContentKind, string[]> = {
    words: ['hanzi', 'pinyin', 'meaning', 'category', 'example', 'examplePinyin', 'exampleEnglish', 'audioFileId', 'imageFileId', 'sortOrder'],
    grammar: ['title', 'explanation', 'structure', 'examples', 'mistakes', 'sortOrder'],
    pronunciations: ['title', 'intro', 'sections', 'audioFileId', 'sortOrder'],
    readings: ['title', 'form', 'lines', 'notes', 'audioFileId', 'sortOrder'],
  }

  const openEdit = () => {
    const fields = EDITABLE_FIELDS[kind]
    const obj: Record<string, unknown> = {}
    for (const f of fields) obj[f] = item[f]
    setJson(JSON.stringify(obj, null, 2))
    setEditing(true)
  }

  const save = async () => {
    setBusy(true)
    try {
      const parsed = JSON.parse(json) as Record<string, unknown>
      const res = await fetch(`/api/admin/hsk/${kind}/${String(item.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': token },
        body: JSON.stringify(parsed),
      })
      const d = await res.json().catch(() => ({}))
      if (res.ok) {
        onToast('Saved')
        setEditing(false)
        onReload()
      } else {
        onToast(d?.error || 'Save failed — check the JSON')
      }
    } catch {
      onToast('Invalid JSON')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-xl border border-sage-light/25 px-4 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-brown-dark font-medium truncate">
            {title} {!item.published && <span className="ml-1 text-[10px] font-bold uppercase bg-cream text-brown-light px-1.5 py-0.5 rounded">draft</span>}
          </p>
          <p className="text-[11px] text-brown-light truncate ct-hanzi">{sub}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button type="button" onClick={openEdit} aria-label="Edit" className="p-1.5 rounded-full bg-cream text-brown hover:bg-cream-dark cursor-pointer">
            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button type="button" onClick={onToggle} className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-cream text-brown hover:bg-cream-dark cursor-pointer">
            {item.published ? 'Unpublish' : 'Publish'}
          </button>
          <button type="button" onClick={onDelete} aria-label="Delete" className="p-1.5 rounded-full bg-peach-light/40 text-peach-dark hover:bg-peach/40 cursor-pointer">
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
      {editing && (
        <div className="mt-3 space-y-2">
          <textarea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            rows={10}
            spellCheck={false}
            className="w-full bg-cream/60 border border-sage-light/40 rounded-xl px-4 py-3 text-xs font-mono text-brown focus:outline-none focus:border-sage"
            aria-label="Edit item as JSON"
          />
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => void save()} disabled={busy} className="bg-sage text-brown-dark px-4 py-2 rounded-xl text-sm font-bold hover:bg-sage-dark cursor-pointer disabled:opacity-60 inline-flex items-center gap-2">
              {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              Save
            </button>
            <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 rounded-xl text-sm text-brown bg-cream hover:bg-cream-dark cursor-pointer">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
