'use client'

// ---------------------------------------------------------------------------
// 📝 HskExamsAdminTab — Admin → HSK Exam Management (Part 3.6)
// Full exam builder: title/level/type/duration/pass line, question selection
// from the shared bank (with drag-free reorder), exam rules (randomization,
// pause, review, answer visibility, audio replay limit, access) and
// publish/unpublish.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'

interface ExamRow {
  id: string
  slug: string
  title: string
  description: string
  level: string
  examType: string
  durationMin: number
  passPercent: number
  questionIds: string[]
  questionCount: number
  questionsKeyed: number
  randomizeQuestions: boolean
  randomizeOptions: boolean
  allowPause: boolean
  allowReview: boolean
  showCorrectAnswers: boolean
  showExplanations: boolean
  audioReplayLimit: number
  access: string
  published: boolean
  sortOrder: number
}

interface BankQuestion {
  id: string
  prompt: string
  hanzi: string
  kind: string
  level: string
  skill: string
  hasKey: boolean
  published: boolean
}

const EXAM_TYPES = ['mock', 'listening', 'reading', 'vocabulary', 'grammar', 'timed', 'untimed'] as const
const TYPE_LABELS: Record<string, string> = {
  mock: 'Full Mock Exam',
  listening: 'Listening Practice',
  reading: 'Reading Practice',
  vocabulary: 'Vocabulary Test',
  grammar: 'Grammar Test',
  timed: 'Timed Practice',
  untimed: 'Untimed Practice',
}

const field =
  'w-full bg-cream/60 border border-sage-light/40 rounded-xl px-4 py-2.5 text-sm text-brown placeholder:text-brown-light/60 focus:outline-none focus:border-sage'
const labelCls = 'block text-xs font-semibold uppercase tracking-wider text-brown mb-1.5'

interface FormState {
  slug: string
  title: string
  description: string
  level: string
  examType: string
  durationMin: number
  passPercent: number
  randomizeQuestions: boolean
  randomizeOptions: boolean
  allowPause: boolean
  allowReview: boolean
  showCorrectAnswers: boolean
  showExplanations: boolean
  audioReplayLimit: number
  access: string
  published: boolean
  sortOrder: number
}

const EMPTY: FormState = {
  slug: '',
  title: '',
  description: '',
  level: 'hsk1',
  examType: 'mock',
  durationMin: 0,
  passPercent: 60,
  randomizeQuestions: false,
  randomizeOptions: false,
  allowPause: true,
  allowReview: true,
  showCorrectAnswers: true,
  showExplanations: false,
  audioReplayLimit: 0,
  access: 'free',
  published: false,
  sortOrder: 0,
}

export function HskExamsAdminTab({
  token,
  onToast,
}: {
  token: string
  onToast: (m: string) => void
}) {
  const [exams, setExams] = useState<ExamRow[] | null>(null)
  const [bank, setBank] = useState<BankQuestion[]>([])
  const [form, setForm] = useState<FormState>(EMPTY)
  const [picked, setPicked] = useState<string[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [bankLevel, setBankLevel] = useState('hsk1')
  const [bankSkill, setBankSkill] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/hsk-exams', { headers: { 'x-admin-key': token }, cache: 'no-store' })
      if (!res.ok) {
        setExams([])
        return
      }
      const data = await res.json()
      setExams(Array.isArray(data.exams) ? data.exams : [])
    } catch {
      setExams([])
    }
  }, [token])

  const loadBank = useCallback(async () => {
    const params = new URLSearchParams({ level: bankLevel })
    if (bankSkill) params.set('skill', bankSkill)
    try {
      const res = await fetch(`/api/admin/hsk-questions?${params.toString()}`, {
        headers: { 'x-admin-key': token },
        cache: 'no-store',
      })
      if (!res.ok) return
      const data = await res.json()
      setBank(Array.isArray(data.questions) ? data.questions : [])
    } catch {
      setBank([])
    }
  }, [token, bankLevel, bankSkill])

  useEffect(() => {
    void load()
  }, [load])
  useEffect(() => {
    void loadBank()
  }, [loadBank])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const body = { ...form, questionIds: picked }
      const url = editingId ? `/api/admin/hsk-exams/${editingId}` : '/api/admin/hsk-exams'
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
      onToast(editingId ? 'Exam updated' : 'Exam created')
      setForm(EMPTY)
      setPicked([])
      setEditingId(null)
      void load()
    } catch {
      setError('Save failed.')
    } finally {
      setBusy(false)
    }
  }

  const editFromRow = (row: ExamRow) => {
    setEditingId(row.id)
    setForm({
      slug: row.slug,
      title: row.title,
      description: row.description,
      level: row.level,
      examType: row.examType,
      durationMin: row.durationMin,
      passPercent: row.passPercent,
      randomizeQuestions: row.randomizeQuestions,
      randomizeOptions: row.randomizeOptions,
      allowPause: row.allowPause,
      allowReview: row.allowReview,
      showCorrectAnswers: row.showCorrectAnswers,
      showExplanations: row.showExplanations,
      audioReplayLimit: row.audioReplayLimit,
      access: row.access,
      published: row.published,
      sortOrder: row.sortOrder,
    })
    setPicked(row.questionIds)
    setBankLevel(row.level)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const movePicked = (i: number, dir: -1 | 1) => {
    setPicked((prev) => {
      const next = [...prev]
      const j = i + dir
      if (j < 0 || j >= next.length) return prev
      const t = next[i]
      next[i] = next[j]
      next[j] = t
      return next
    })
  }

  const togglePublish = async (row: ExamRow) => {
    const res = await fetch(`/api/admin/hsk-exams/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': token },
      body: JSON.stringify({ published: !row.published }),
    })
    if (res.ok) {
      onToast(row.published ? 'Exam unpublished' : 'Exam published')
      void load()
    }
  }

  const remove = async (row: ExamRow) => {
    if (!window.confirm(`Delete exam “${row.title}”? Past attempts and their results are kept.`)) return
    const res = await fetch(`/api/admin/hsk-exams/${row.id}`, {
      method: 'DELETE',
      headers: { 'x-admin-key': token },
    })
    if (res.ok) {
      onToast('Exam deleted')
      void load()
    }
  }

  const bankById = new Map(bank.map((q) => [q.id, q]))

  return (
    <div className="space-y-6">
      {/* builder */}
      <form onSubmit={submit} className="bg-white rounded-2xl border border-sage-light/30 p-5 space-y-4">
        <h3 className="text-sm font-bold text-brown-dark flex items-center gap-2">
          <Plus className="w-4 h-4 text-sage-dark" aria-hidden="true" />
          {editingId ? 'Edit exam' : 'Create an exam'}
        </h3>
        <div className="grid sm:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="e-title">Title</label>
            <input id="e-title" type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required maxLength={160} className={field} />
          </div>
          <div>
            <label className={labelCls} htmlFor="e-slug">Slug (URL)</label>
            <input id="e-slug" type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required placeholder="hsk1-mock-1" className={field} />
          </div>
          <div>
            <label className={labelCls} htmlFor="e-type">Exam type</label>
            <select id="e-type" value={form.examType} onChange={(e) => setForm({ ...form, examType: e.target.value })} className={field}>
              {EXAM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="e-level">Level</label>
            <select id="e-level" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className={field}>
              <option value="hsk1">HSK 1</option>
              <option value="hsk2">HSK 2</option>
              <option value="hsk3">HSK 3</option>
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="e-duration">Duration (minutes, 0 = untimed)</label>
            <input id="e-duration" type="number" min={0} max={300} value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: Number(e.target.value) || 0 })} className={field} />
          </div>
          <div>
            <label className={labelCls} htmlFor="e-pass">Passing score (%)</label>
            <input id="e-pass" type="number" min={1} max={100} value={form.passPercent} onChange={(e) => setForm({ ...form, passPercent: Number(e.target.value) || 60 })} className={field} />
          </div>
          <div>
            <label className={labelCls} htmlFor="e-access">Access</label>
            <select id="e-access" value={form.access} onChange={(e) => setForm({ ...form, access: e.target.value })} className={field}>
              <option value="free">Free for everyone</option>
              <option value="restricted">Signed-in students only</option>
            </select>
          </div>
          <div className="sm:col-span-4">
            <label className={labelCls} htmlFor="e-desc">Description</label>
            <input id="e-desc" type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={1500} className={field} />
          </div>
        </div>

        {/* rules */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {([
            ['randomizeQuestions', 'Randomize question order'],
            ['randomizeOptions', 'Randomize answer options'],
            ['allowPause', 'Allow pause / resume'],
            ['allowReview', 'Allow answer review after submission'],
            ['showCorrectAnswers', 'Show correct answers in review'],
            ['showExplanations', 'Show explanations in review'],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2.5 cursor-pointer bg-cream/50 rounded-xl px-3.5 py-2.5">
              <input
                type="checkbox"
                checked={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                className="w-4 h-4 accent-[#A8C9A0]"
              />
              <span className="text-xs text-brown">{label}</span>
            </label>
          ))}
          <div className="bg-cream/50 rounded-xl px-3.5 py-2.5">
            <label className={labelCls} htmlFor="e-replay">Audio replay limit (0 = unlimited)</label>
            <input id="e-replay" type="number" min={0} max={20} value={form.audioReplayLimit} onChange={(e) => setForm({ ...form, audioReplayLimit: Number(e.target.value) || 0 })} className={field} />
          </div>
          <div className="bg-cream/50 rounded-xl px-3.5 py-2.5">
            <label className={labelCls} htmlFor="e-sort">Display order</label>
            <input id="e-sort" type="number" min={0} max={9999} value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) || 0 })} className={field} />
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer bg-cream/50 rounded-xl px-3.5 py-2.5">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="w-4 h-4 accent-[#A8C9A0]" />
            <span className="text-xs text-brown font-semibold">Published</span>
          </label>
        </div>

        {/* question picker */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <p className={labelCls + ' mb-0'}>Question bank</p>
              <select value={bankLevel} onChange={(e) => setBankLevel(e.target.value)} aria-label="Bank level" className="bg-white border border-sage-light/40 rounded-full px-3 py-1.5 text-xs text-brown cursor-pointer">
                <option value="hsk1">HSK 1</option>
                <option value="hsk2">HSK 2</option>
                <option value="hsk3">HSK 3</option>
              </select>
              <select value={bankSkill} onChange={(e) => setBankSkill(e.target.value)} aria-label="Bank skill" className="bg-white border border-sage-light/40 rounded-full px-3 py-1.5 text-xs text-brown cursor-pointer">
                <option value="">All skills</option>
                <option value="vocabulary">vocabulary</option>
                <option value="grammar">grammar</option>
                <option value="listening">listening</option>
                <option value="reading">reading</option>
              </select>
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {bank.length === 0 && <p className="text-xs text-brown-light bg-cream/60 rounded-xl px-3.5 py-3">No published questions for this filter — create some in the Exercise Builder.</p>}
              {bank.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setPicked((prev) => (prev.includes(q.id) ? prev : [...prev, q.id]))}
                  disabled={picked.includes(q.id)}
                  className={`w-full text-left rounded-xl border px-3.5 py-2.5 text-xs transition-all cursor-pointer ${
                    picked.includes(q.id)
                      ? 'bg-sage-light/20 border-sage/30 text-brown-light'
                      : 'bg-white border-sage-light/40 text-brown-dark hover:border-sage'
                  }`}
                >
                  <span className="ct-hanzi">{q.hanzi ? q.hanzi + ' · ' : ''}</span>
                  {q.prompt.slice(0, 70)}
                  <span className="text-brown-light"> · {q.skill}</span>
                  {!q.hasKey && <span className="ml-1 font-bold text-peach-dark">no key</span>}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className={labelCls}>Selected questions ({picked.length}) — in exam order</p>
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {picked.length === 0 && <p className="text-xs text-brown-light bg-cream/60 rounded-xl px-3.5 py-3">Click questions on the left to add them.</p>}
              {picked.map((id, i) => {
                const q = bankById.get(id)
                return (
                  <div key={id} className="flex items-center gap-2 rounded-xl border border-sage-light/40 px-3 py-2 bg-white">
                    <span className="text-[11px] font-bold text-brown-light w-5">{i + 1}.</span>
                    <span className="text-xs text-brown-dark truncate flex-1">
                      <span className="ct-hanzi">{q?.hanzi ? q.hanzi + ' · ' : ''}</span>
                      {q?.prompt.slice(0, 60) ?? id}
                    </span>
                    <button type="button" onClick={() => movePicked(i, -1)} aria-label="Move up" className="p-1 rounded-full bg-cream text-brown hover:bg-cream-dark cursor-pointer">
                      <ArrowUp className="w-3 h-3" aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => movePicked(i, 1)} aria-label="Move down" className="p-1 rounded-full bg-cream text-brown hover:bg-cream-dark cursor-pointer">
                      <ArrowDown className="w-3 h-3" aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => setPicked((prev) => prev.filter((x) => x !== id))} aria-label="Remove" className="p-1 rounded-full bg-peach-light/40 text-peach-dark hover:bg-peach/40 cursor-pointer">
                      <Trash2 className="w-3 h-3" aria-hidden="true" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {error && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={busy} className="bg-sage text-brown-dark px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-sage-dark cursor-pointer disabled:opacity-60 inline-flex items-center gap-2">
            {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            {editingId ? 'Save exam' : 'Create exam'}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setForm(EMPTY); setPicked([]) }} className="px-4 py-2.5 rounded-xl text-sm text-brown bg-cream hover:bg-cream-dark cursor-pointer">
              Cancel edit
            </button>
          )}
        </div>
      </form>

      {/* list */}
      {exams === null ? (
        <p className="text-sm text-brown-light flex items-center gap-2 py-10 justify-center" role="status">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Loading exams…
        </p>
      ) : exams.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-sage-light/50">
          <p className="text-sm text-brown-light">No exams yet — create the first one above.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
          {exams.map((row) => (
            <div key={row.id} className="bg-white rounded-xl border border-sage-light/25 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-brown-dark font-medium truncate">
                  {row.title}
                  {!row.published && <span className="ml-2 text-[10px] font-bold uppercase bg-cream text-brown-light px-2 py-0.5 rounded-full">draft</span>}
                </p>
                <p className="text-[11px] text-brown-light mt-0.5">
                  {row.level} · {TYPE_LABELS[row.examType] ?? row.examType} · {row.questionCount} questions
                  {row.questionCount > 0 && row.questionsKeyed < row.questionCount && (
                    <span className="text-peach-dark font-semibold"> ({row.questionCount - row.questionsKeyed} without key!)</span>
                  )}
                  {row.durationMin > 0 ? ` · ${row.durationMin} min` : ' · untimed'} · pass ≥{row.passPercent}%
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button type="button" onClick={() => void togglePublish(row)} className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-cream text-brown hover:bg-cream-dark cursor-pointer">
                  {row.published ? 'Unpublish' : 'Publish'}
                </button>
                <button type="button" onClick={() => editFromRow(row)} aria-label="Edit" className="p-1.5 rounded-full bg-cream text-brown hover:bg-cream-dark cursor-pointer">
                  <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => void remove(row)} aria-label="Delete" className="p-1.5 rounded-full bg-peach-light/40 text-peach-dark hover:bg-peach/40 cursor-pointer">
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
