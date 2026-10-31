'use client'

// ---------------------------------------------------------------------------
// 🧩 QuestionsAdminTab — Admin → Exercise Builder (Parts 3.3 / 4.4)
//
// The shared question bank used by Practice module tests (when attached to a
// stage+skill) and by HSK exams (referenced by the exam builder). All six
// kinds with validated answer keys; keys stay server-side — the list only
// shows whether a key exists.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'

const KINDS = ['mcq', 'truefalse', 'fill', 'match', 'order', 'listen'] as const
const SKILLS = ['vocabulary', 'grammar', 'pronunciation', 'reading', 'listening'] as const
const KIND_LABELS: Record<string, string> = {
  mcq: 'Multiple choice',
  truefalse: 'True / False',
  fill: 'Fill in the blanks',
  match: 'Matching',
  order: 'Sentence arrangement',
  listen: 'Listening comprehension',
}

interface QuestionRow {
  id: string
  kind: string
  prompt: string
  hanzi: string
  pinyin: string
  optionCount: number
  matchCount: number
  tileCount: number
  hasKey: boolean
  explanation: string
  level: string
  skill: string
  stageNumber: number | null
  points: number
  difficulty: string
  audioFileId: string | null
  imageFileId: string | null
  passageId: string | null
  published: boolean
  sortOrder: number
}

interface QuestionForm {
  kind: string
  prompt: string
  hanzi: string
  pinyin: string
  options: string[]
  answerIndex: number | null
  matchLeft: string[]
  matchOptions: string[]
  tiles: string
  explanation: string
  level: string
  skill: string
  stageNumber: string
  points: number
  difficulty: string
  audioFileId: string
  imageFileId: string
  passageId: string
  published: boolean
  sortOrder: number
}

const EMPTY: QuestionForm = {
  kind: 'mcq',
  prompt: '',
  hanzi: '',
  pinyin: '',
  options: ['', '', '', ''],
  answerIndex: 0,
  matchLeft: ['', '', ''],
  matchOptions: ['', '', ''],
  tiles: '',
  explanation: '',
  level: 'hsk1',
  skill: 'vocabulary',
  stageNumber: '',
  points: 1,
  difficulty: 'easy',
  audioFileId: '',
  imageFileId: '',
  passageId: '',
  published: true,
  sortOrder: 0,
}

const field =
  'w-full bg-cream/60 border border-sage-light/40 rounded-xl px-4 py-2.5 text-sm text-brown placeholder:text-brown-light/60 focus:outline-none focus:border-sage'
const labelCls = 'block text-xs font-semibold uppercase tracking-wider text-brown mb-1.5'

export function QuestionsAdminTab({
  token,
  onToast,
}: {
  token: string
  onToast: (m: string) => void
}) {
  const [questions, setQuestions] = useState<QuestionRow[] | null>(null)
  const [filterLevel, setFilterLevel] = useState('')
  const [filterSkill, setFilterSkill] = useState('')
  const [query, setQuery] = useState('')
  const [form, setForm] = useState<QuestionForm>(EMPTY)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const params = new URLSearchParams()
    if (filterLevel) params.set('level', filterLevel)
    if (filterSkill) params.set('skill', filterSkill)
    if (query) params.set('query', query)
    try {
      const res = await fetch(`/api/admin/hsk-questions?${params.toString()}`, {
        headers: { 'x-admin-key': token },
        cache: 'no-store',
      })
      if (!res.ok) {
        setQuestions([])
        return
      }
      const data = await res.json()
      setQuestions(Array.isArray(data.questions) ? data.questions : [])
    } catch {
      setQuestions([])
    }
  }, [token, filterLevel, filterSkill, query])

  useEffect(() => {
    const t = setTimeout(() => void load(), 250)
    return () => clearTimeout(t)
  }, [load])

  const setOption = (i: number, v: string) =>
    setForm((f) => ({ ...f, options: f.options.map((o, oi) => (oi === i ? v : o)) }))
  const setMatchLeft = (i: number, v: string) =>
    setForm((f) => ({ ...f, matchLeft: f.matchLeft.map((o, oi) => (oi === i ? v : o)) }))
  const setMatchRight = (i: number, v: string) =>
    setForm((f) => ({ ...f, matchOptions: f.matchOptions.map((o, oi) => (oi === i ? v : o)) }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const body: Record<string, unknown> = {
        kind: form.kind,
        prompt: form.prompt,
        hanzi: form.hanzi,
        pinyin: form.pinyin,
        explanation: form.explanation,
        level: form.level,
        skill: form.skill,
        stageNumber: form.stageNumber ? Number(form.stageNumber) : null,
        points: form.points,
        difficulty: form.difficulty,
        audioFileId: form.audioFileId || null,
        imageFileId: form.imageFileId || null,
        passageId: form.passageId || null,
        published: form.published,
        sortOrder: form.sortOrder,
      }
      if (form.kind === 'match') {
        body.matchLeft = form.matchLeft.filter((x) => x.trim())
        body.matchOptions = form.matchOptions.filter((x) => x.trim())
      } else if (form.kind === 'order') {
        body.tiles = form.tiles.split('\n').map((t) => t.trim()).filter(Boolean)
      } else {
        body.options = form.options.filter((x) => x.trim())
        body.answerIndex = form.answerIndex
      }
      const url = editingId ? `/api/admin/hsk-questions/${editingId}` : '/api/admin/hsk-questions'
      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': token },
        body: JSON.stringify(body),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(d?.error || 'Save failed.')
        return
      }
      onToast(editingId ? 'Question updated' : 'Question created')
      setForm(EMPTY)
      setEditingId(null)
      void load()
    } catch {
      setError('Save failed.')
    } finally {
      setBusy(false)
    }
  }

  const editFromRow = async (row: QuestionRow) => {
    // fetch the full question (with key) from a dedicated endpoint for editing
    const res = await fetch(`/api/admin/hsk-questions/${row.id}`, {
      headers: { 'x-admin-key': token },
      cache: 'no-store',
    })
    if (!res.ok) {
      onToast('Could not load the question for editing')
      return
    }
    const data = await res.json()
    const q = data.question as Record<string, unknown>
    setEditingId(row.id)
    setForm({
      kind: String(q.kind),
      prompt: String(q.prompt),
      hanzi: String(q.hanzi ?? ''),
      pinyin: String(q.pinyin ?? ''),
      options: ((q.options as string[]) ?? []).length ? (q.options as string[]) : [''],
      answerIndex: (q.answerIndex as number | null) ?? null,
      matchLeft: ((q.matchLeft as string[]) ?? []).length ? (q.matchLeft as string[]) : ['', '', ''],
      matchOptions: ((q.matchOptions as string[]) ?? []).length ? (q.matchOptions as string[]) : ['', '', ''],
      tiles: ((q.tiles as string[]) ?? []).join('\n'),
      explanation: String(q.explanation ?? ''),
      level: String(q.level),
      skill: String(q.skill),
      stageNumber: q.stageNumber ? String(q.stageNumber) : '',
      points: Number(q.points ?? 1),
      difficulty: String(q.difficulty ?? 'easy'),
      audioFileId: String(q.audioFileId ?? ''),
      imageFileId: String(q.imageFileId ?? ''),
      passageId: String(q.passageId ?? ''),
      published: Boolean(q.published),
      sortOrder: Number(q.sortOrder ?? 0),
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const togglePublish = async (row: QuestionRow) => {
    const res = await fetch(`/api/admin/hsk-questions/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': token },
      body: JSON.stringify({ published: !row.published }),
    })
    if (res.ok) void load()
  }

  const remove = async (row: QuestionRow) => {
    if (!window.confirm('Delete this question?')) return
    const res = await fetch(`/api/admin/hsk-questions/${row.id}`, {
      method: 'DELETE',
      headers: { 'x-admin-key': token },
    })
    if (res.ok) {
      onToast('Question deleted')
      void load()
    }
  }

  return (
    <div className="space-y-6">
      {/* form */}
      <form onSubmit={submit} className="bg-white rounded-2xl border border-sage-light/30 p-5 space-y-4">
        <h3 className="text-sm font-bold text-brown-dark flex items-center gap-2">
          <Plus className="w-4 h-4 text-sage-dark" aria-hidden="true" />
          {editingId ? 'Edit question' : 'Create a question'}
        </h3>
        <div className="grid sm:grid-cols-4 gap-4">
          <div>
            <label className={labelCls} htmlFor="q-kind">Type</label>
            <select id="q-kind" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} className={field}>
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {KIND_LABELS[k]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="q-level">Level</label>
            <select id="q-level" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className={field}>
              <option value="hsk1">HSK 1</option>
              <option value="hsk2">HSK 2</option>
              <option value="hsk3">HSK 3</option>
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="q-skill">Skill</label>
            <select id="q-skill" value={form.skill} onChange={(e) => setForm({ ...form, skill: e.target.value })} className={field}>
              {SKILLS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="q-stage">Practice stage (optional)</label>
            <input id="q-stage" type="number" min={1} max={50} value={form.stageNumber} onChange={(e) => setForm({ ...form, stageNumber: e.target.value })} placeholder="e.g. 3" className={field} />
            <p className="text-[10px] text-brown-light mt-1">Set to use it in that stage’s module test.</p>
          </div>
        </div>

        <div>
          <label className={labelCls} htmlFor="q-prompt">Question / instruction</label>
          <input id="q-prompt" type="text" value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })} required maxLength={600} placeholder="e.g. What does this word mean?" className={field} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls} htmlFor="q-hanzi">Chinese text (optional)</label>
            <input id="q-hanzi" type="text" value={form.hanzi} onChange={(e) => setForm({ ...form, hanzi: e.target.value })} className={`${field} ct-hanzi`} />
          </div>
          <div>
            <label className={labelCls} htmlFor="q-pinyin">Pinyin (optional)</label>
            <input id="q-pinyin" type="text" value={form.pinyin} onChange={(e) => setForm({ ...form, pinyin: e.target.value })} className={field} />
          </div>
        </div>

        {form.kind !== 'match' && form.kind !== 'order' && (
          <div>
            <label className={labelCls}>Options — tick the correct one</label>
            <div className="space-y-2">
              {form.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="q-correct"
                    checked={form.answerIndex === i}
                    onChange={() => setForm({ ...form, answerIndex: i })}
                    aria-label={`Option ${i + 1} is correct`}
                    className="w-4 h-4 accent-[#A8C9A0] flex-shrink-0"
                  />
                  <input type="text" value={opt} onChange={(e) => setOption(i, e.target.value)} className={field} placeholder={`Option ${i + 1}`} />
                  {form.options.length > 2 && (
                    <button type="button" onClick={() => setForm((f) => ({ ...f, options: f.options.filter((_, oi) => oi !== i) }))} aria-label="Remove option" className="p-2 rounded-full bg-cream text-brown hover:bg-cream-dark cursor-pointer text-xs">
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            {form.options.length < 8 && (
              <button type="button" onClick={() => setForm((f) => ({ ...f, options: [...f.options, ''] }))} className="mt-2 text-xs font-semibold text-sage-dark hover:underline cursor-pointer">
                + Add option
              </button>
            )}
          </div>
        )}

        {form.kind === 'match' && (
          <div>
            <label className={labelCls}>Matching pairs — row i: left item ↔ its correct match</label>
            <div className="space-y-2">
              {form.matchLeft.map((left, i) => (
                <div key={i} className="grid grid-cols-2 gap-2">
                  <input type="text" value={left} onChange={(e) => setMatchLeft(i, e.target.value)} placeholder={`Left item ${i + 1} (Chinese)`} className={`${field} ct-hanzi`} />
                  <input type="text" value={form.matchOptions[i] ?? ''} onChange={(e) => setMatchRight(i, e.target.value)} placeholder={`Correct match ${i + 1} (English)`} className={field} />
                </div>
              ))}
            </div>
            {form.matchLeft.length < 8 && (
              <button type="button" onClick={() => setForm((f) => ({ ...f, matchLeft: [...f.matchLeft, ''], matchOptions: [...f.matchOptions, ''] }))} className="mt-2 text-xs font-semibold text-sage-dark hover:underline cursor-pointer">
                + Add pair
              </button>
            )}
          </div>
        )}

        {form.kind === 'order' && (
          <div>
            <label className={labelCls}>Correct sentence — one word per line (the app shuffles for display)</label>
            <textarea id="q-tiles" value={form.tiles} onChange={(e) => setForm({ ...form, tiles: e.target.value })} rows={3} className={`${field} ct-hanzi`} placeholder={'我\n买\n一本书'} />
          </div>
        )}

        <div className="grid sm:grid-cols-4 gap-4">
          <div>
            <label className={labelCls} htmlFor="q-points">Points</label>
            <input id="q-points" type="number" min={1} max={100} value={form.points} onChange={(e) => setForm({ ...form, points: Number(e.target.value) || 1 })} className={field} />
          </div>
          <div>
            <label className={labelCls} htmlFor="q-diff">Difficulty</label>
            <select id="q-diff" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} className={field}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="q-audio">Audio file ID (listening)</label>
            <input id="q-audio" type="text" value={form.audioFileId} onChange={(e) => setForm({ ...form, audioFileId: e.target.value })} placeholder="from File Manager" className={field} />
          </div>
          <div>
            <label className={labelCls} htmlFor="q-passage">Reading passage ID (optional)</label>
            <input id="q-passage" type="text" value={form.passageId} onChange={(e) => setForm({ ...form, passageId: e.target.value })} placeholder="from Reading Manager" className={field} />
          </div>
        </div>
        <div>
          <label className={labelCls} htmlFor="q-expl">Explanation (shown in review when enabled)</label>
          <input id="q-expl" type="text" value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} maxLength={1000} className={field} />
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer">
          <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="w-4 h-4 accent-[#A8C9A0]" />
          <span className="text-sm text-brown">Published</span>
        </label>

        {error && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={busy} className="bg-sage text-brown-dark px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-sage-dark cursor-pointer disabled:opacity-60 inline-flex items-center gap-2">
            {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            {editingId ? 'Save changes' : 'Create question'}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setForm(EMPTY) }} className="px-4 py-2.5 rounded-xl text-sm text-brown bg-cream hover:bg-cream-dark cursor-pointer">
              Cancel edit
            </button>
          )}
        </div>
      </form>

      {/* filters + list */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} aria-label="Filter by level" className="bg-white border border-sage-light/40 rounded-full px-4 py-2 text-sm text-brown cursor-pointer min-h-[38px]">
          <option value="">All levels</option>
          <option value="hsk1">HSK 1</option>
          <option value="hsk2">HSK 2</option>
          <option value="hsk3">HSK 3</option>
        </select>
        <select value={filterSkill} onChange={(e) => setFilterSkill(e.target.value)} aria-label="Filter by skill" className="bg-white border border-sage-light/40 rounded-full px-4 py-2 text-sm text-brown cursor-pointer min-h-[38px]">
          <option value="">All skills</option>
          {SKILLS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" aria-label="Search questions" className="flex-1 min-w-[160px] bg-white border border-sage-light/40 rounded-full px-4 py-2 text-sm text-brown placeholder:text-brown-light/60 focus:outline-none focus:ring-2 focus:ring-sage/40" />
        <button type="button" onClick={() => void load()} aria-label="Refresh" className="p-2.5 rounded-full bg-white border border-sage-light/40 text-brown hover:border-sage cursor-pointer">
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {questions === null ? (
        <p className="text-sm text-brown-light flex items-center gap-2 py-10 justify-center" role="status">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Loading questions…
        </p>
      ) : questions.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-sage-light/50">
          <p className="text-sm text-brown-light">No questions match — create the first one above.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
          {questions.map((q) => (
            <div key={q.id} className="bg-white rounded-xl border border-sage-light/25 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-brown-dark font-medium truncate">
                  {q.prompt} {q.hanzi && <span className="ct-hanzi">· {q.hanzi}</span>}
                </p>
                <p className="text-[11px] text-brown-light mt-0.5">
                  {KIND_LABELS[q.kind] ?? q.kind} · {q.level}
                  {q.stageNumber ? ` · stage ${q.stageNumber}` : ''} · {q.skill} · {q.points}p ·{' '}
                  {q.hasKey ? (
                    <span className="text-sage-dark font-semibold">answer key set</span>
                  ) : (
                    <span className="text-peach-dark font-semibold">no answer key!</span>
                  )}
                  {!q.published && <span className="ml-1 font-bold uppercase">draft</span>}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button type="button" onClick={() => void togglePublish(q)} className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-cream text-brown hover:bg-cream-dark cursor-pointer">
                  {q.published ? 'Unpublish' : 'Publish'}
                </button>
                <button type="button" onClick={() => void editFromRow(q)} aria-label="Edit" className="p-1.5 rounded-full bg-cream text-brown hover:bg-cream-dark cursor-pointer">
                  <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => void remove(q)} aria-label="Delete" className="p-1.5 rounded-full bg-peach-light/40 text-peach-dark hover:bg-peach/40 cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
