'use client'

// ---------------------------------------------------------------------------
// 📚 بخش «تکالیف من» در حساب کاربری دانش‌پذیر (AccountPage)
//
//  • تکالیف فعال استاد: عنوان/کلاس/مهلت/توضیح + دانلود پیوست‌ها
//  • ارسال/به‌روزرسانی پاسخ: فایل‌ها (تا ۵ فایل، ۱۵MB) + یادداشت
//  • وضعیت پاسخ خود + بازخورد متنی استاد
//  • 401 → بی‌صدا خالی (بخش فقط برای کاربر واردشده رندر می‌شود)
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  BookOpenCheck,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Send,
  TriangleAlert,
} from 'lucide-react'

interface HomeworkFileLike {
  id: string
  name: string
  mime: string
  size: number
}

interface MySubmission {
  id: string
  note: string
  feedback: string | null
  feedbackAt: string | null
  submittedAt: string
  files: HomeworkFileLike[]
}

interface HomeworkItem {
  id: string
  title: string
  description: string
  className: string
  dueAt: string | null
  createdAt: string
  files: HomeworkFileLike[]
  mySubmission: MySubmission | null
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

export function AccountHomework({ onToast }: { onToast: (m: string) => void }) {
  const [items, setItems] = useState<HomeworkItem[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  // ارسال پاسخ — هر تکلیف فرم خودش را دارد
  const [uploadingFor, setUploadingFor] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [uploadErr, setUploadErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const res = await fetch('/api/homework', { cache: 'no-store' })
      if (!res.ok) {
        // 401 یا خطا → بخش خالی (پنل فقط برای کاربر واردشده است)
        setItems(null)
        setLoadError(res.status !== 401)
        return
      }
      const data = (await res.json()) as { homework: HomeworkItem[] }
      setItems(data.homework)
    } catch {
      setItems(null)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const startSubmission = (item: HomeworkItem) => {
    setUploadingFor(item.id)
    setNote(item.mySubmission?.note ?? '')
    setFiles([])
    setUploadErr('')
  }

  const cancelSubmission = () => {
    setUploadingFor(null)
    setNote('')
    setFiles([])
    setUploadErr('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const submit = async (item: HomeworkItem) => {
    if (uploadingFor !== item.id) return
    if (files.length === 0 && !note.trim()) {
      setUploadErr('Add a note or at least one file.')
      return
    }
    setUploadingFor(`busy:${item.id}`)
    setUploadErr('')
    try {
      const fd = new FormData()
      fd.append('note', note.trim())
      files.forEach((f) => fd.append('files', f))
      const res = await fetch(`/api/homework/${encodeURIComponent(item.id)}/submit`, {
        method: 'POST',
        body: fd,
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setUploadErr(data?.error || 'Could not submit your homework.')
        setUploadingFor(item.id)
        return
      }
      onToast('Homework submitted!')
      cancelSubmission()
      void load()
    } catch {
      setUploadErr('Could not submit your homework.')
      setUploadingFor(item.id)
    }
  }

  return (
    <div className="mt-8 bg-white rounded-3xl p-8 md:p-10 shadow-lg border border-sage-light/20">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-brown-dark flex items-center gap-2.5">
          <span className="w-10 h-10 rounded-xl bg-sage-light/30 flex items-center justify-center flex-shrink-0">
            <BookOpenCheck className="w-5 h-5 text-sage-dark" />
          </span>
          Homework
        </h2>
        <button
          type="button"
          onClick={() => void load()}
          className="text-xs font-semibold text-brown-light hover:text-brown-dark transition-colors cursor-pointer inline-flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {loading && !items ? (
        <div className="py-6 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-sage-dark" />
        </div>
      ) : loadError ? (
        <p className="text-sm text-brown-light text-center py-4">
          Could not load homework right now — please try again later.
        </p>
      ) : !items || items.length === 0 ? (
        <p className="text-sm text-brown-light text-center py-4">
          No homework yet — new assignments from your teacher will appear here.
        </p>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => {
            const busy = uploadingFor === `busy:${item.id}`
            const open = uploadingFor === item.id
            const sub = item.mySubmission
            const overdue = item.dueAt ? new Date(item.dueAt).getTime() < Date.now() : false
            return (
              <li key={item.id} className="bg-cream/50 border border-sage-light/30 rounded-2xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-brown-dark">{item.title}</p>
                    <p className="text-xs text-brown-light mt-1">
                      {item.className ? `${item.className} · ` : ''}Posted {fmtDate(item.createdAt)}
                      {item.dueAt ? ` · Due ${fmtDate(item.dueAt)}` : ''}
                    </p>
                  </div>
                  {/* وضعیت پاسخ من */}
                  {sub ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-sage-dark bg-sage-light/25 border border-sage/30 rounded-full px-3 py-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Submitted
                    </span>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-bold rounded-full px-3 py-1.5 border ${
                        overdue
                          ? 'text-peach-dark bg-peach/15 border-peach/40'
                          : 'text-brown bg-white border-sage-light/40'
                      }`}
                    >
                      <TriangleAlert className="w-3.5 h-3.5" /> {overdue ? 'Overdue' : 'Not submitted'}
                    </span>
                  )}
                </div>

                {item.description && (
                  <p className="text-sm text-brown leading-relaxed mt-3 whitespace-pre-wrap">{item.description}</p>
                )}

                {/* پیوست‌های تکلیف — دانلود */}
                {item.files.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {item.files.map((f) => (
                      <li key={f.id}>
                        <a
                          href={`/api/homework/files/${f.id}`}
                          className="inline-flex items-center gap-2 text-sm text-sage-dark hover:underline"
                        >
                          <Download className="w-3.5 h-3.5" /> {f.name}
                          <span className="text-xs text-brown-light">({fmtBytes(f.size)})</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}

                {/* بازخورد استاد */}
                {sub?.feedback && (
                  <div className="mt-4 bg-sage-light/25 border border-sage/25 rounded-xl px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-sage-dark mb-1 flex items-center gap-1.5">
                      <MessageSquareText className="w-3 h-3" /> Teacher feedback
                    </p>
                    <p className="text-sm text-brown whitespace-pre-wrap">{sub.feedback}</p>
                  </div>
                )}

                {/* فرم ارسال/به‌روزرسانی پاسخ */}
                {open || busy ? (
                  <div className="mt-4 space-y-3">
                    <textarea
                      rows={2}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Optional note for your teacher…"
                      maxLength={2000}
                      disabled={busy}
                      className="w-full px-4 py-3 rounded-xl border border-sage-light/40 bg-white text-brown text-sm focus:outline-none focus:border-sage focus:ring-[3px] focus:ring-sage/20 resize-none"
                    />
                    <input
                      ref={fileRef}
                      type="file"
                      multiple
                      disabled={busy}
                      onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 5))}
                      className="block w-full text-xs text-brown-light file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sage-light/40 file:text-brown-dark cursor-pointer"
                    />
                    {files.length > 0 && (
                      <p className="text-xs text-brown-light">{files.length} file(s) selected</p>
                    )}
                    {uploadErr && (
                      <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                        {uploadErr}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void submit(item)}
                        disabled={busy}
                        className="bg-sage text-brown-dark px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-sage-dark transition-colors cursor-pointer disabled:opacity-60 inline-flex items-center gap-2"
                      >
                        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {busy ? 'Submitting…' : sub ? 'Update Submission' : 'Submit Homework'}
                      </button>
                      {!busy && (
                        <button
                          type="button"
                          onClick={cancelSubmission}
                          className="px-4 py-2.5 rounded-xl text-sm font-medium text-brown-light hover:text-brown cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => startSubmission(item)}
                    className="mt-4 bg-white border border-sage-light/50 text-brown-dark px-5 py-2.5 rounded-xl text-sm font-bold hover:border-sage transition-colors cursor-pointer inline-flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    {sub ? 'Update my submission' : 'Submit my homework'}
                  </button>
                )}

                {/* خط وضعیت پاسخ قبلی */}
                {sub && !open && !busy && (
                  <p className="text-[11px] text-brown-light mt-3">
                    Last submitted {fmtDate(sub.submittedAt)} · {sub.files.length} file(s)
                    {sub.note ? ' · with note' : ''}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
