'use client'

// ---------------------------------------------------------------------------
// 📚 تب Homework پنل ادمین — مدیریت تکالیف (سمت استاد)
//
//  • ساخت تکلیف: عنوان/توضیح/کلاس/مهلت + پیوست‌ها (آپلود همزمان)
//  • فهرست تکالیف: شمار پاسخ‌ها + شمار بررسی‌نشده + آرشیو/حذف
//  • جزئیات تکلیف: پاسخ‌های دانش‌پذیران (دانلود فایل‌ها) + ثبت بازخورد متنی
// امنیت: همهٔ مسیرها با سشن ادمین (x-admin-key) گارد شده‌اند.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Archive,
  ArchiveRestore,
  BookOpenCheck,
  Download,
  FileText,
  Loader2,
  MessageSquareText,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface AdminHomeworkRow {
  id: string
  title: string
  description: string
  className: string
  dueAt: string | null
  archived: boolean
  createdAt: string
  attachmentCount: number
  submissionCount: number
  pendingReview: number
}

interface HomeworkFileInfo {
  id: string
  name: string
  mime: string
  size: number
  createdAt: string
}

interface SubmissionRow {
  id: string
  note: string
  feedback: string | null
  feedbackAt: string | null
  updatedAt: string
  user: { id: string; firstName: string; lastName: string; email: string; uniqueCode: string | null }
  files: HomeworkFileInfo[]
}

interface HomeworkDetail {
  id: string
  title: string
  description: string
  className: string
  dueAt: string | null
  archived: boolean
  files: HomeworkFileInfo[]
  submissions: SubmissionRow[]
}

const inputCls =
  'w-full bg-white border border-sage-light/40 rounded-xl px-3.5 py-2.5 text-sm text-brown-dark focus:outline-none focus:ring-2 focus:ring-sage/40 focus:border-sage transition-colors'

function fmtDateTime(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

export function HomeworkAdminTab({ token, onToast }: { token: string; onToast?: (m: string) => void }) {
  const [rows, setRows] = useState<AdminHomeworkRow[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // فرم ساخت تکلیف
  const [createOpen, setCreateOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [className, setClassName] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [creating, setCreating] = useState(false)
  const [createErr, setCreateErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // جزئیات + بازخورد
  const [detail, setDetail] = useState<HomeworkDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [feedbackFor, setFeedbackFor] = useState<SubmissionRow | null>(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackBusy, setFeedbackBusy] = useState(false)

  // حذف
  const [deleteRow, setDeleteRow] = useState<AdminHomeworkRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  const authHeaders = { 'x-admin-key': token }

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/homework', { headers: authHeaders, cache: 'no-store' })
      if (!res.ok) {
        setError('Could not load assignments.')
        setRows(null)
        return
      }
      const data = (await res.json()) as { homework: AdminHomeworkRow[] }
      setRows(data.homework)
    } catch {
      setError('Could not load assignments.')
      setRows(null)
    } finally {
      setLoading(false)
    }
     
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  const openDetail = useCallback(
    async (id: string) => {
      setDetailLoading(true)
      setDetail(null)
      try {
        const res = await fetch(`/api/admin/homework/${encodeURIComponent(id)}`, {
          headers: authHeaders,
          cache: 'no-store',
        })
        if (res.ok) {
          setDetail((await res.json()).homework as HomeworkDetail)
        }
      } catch {
        /* بی‌اهمیت */
      } finally {
        setDetailLoading(false)
      }
       
    },
    [token]
  )

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (creating) return
    if (title.trim().length < 2) {
      setCreateErr('Please enter a title.')
      return
    }
    setCreating(true)
    setCreateErr('')
    try {
      const fd = new FormData()
      fd.append('title', title.trim())
      fd.append('description', description.trim())
      fd.append('className', className.trim())
      if (dueAt) fd.append('dueAt', new Date(dueAt).toISOString())
      files.forEach((f) => fd.append('files', f))
      const res = await fetch('/api/admin/homework', { method: 'POST', headers: authHeaders, body: fd })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setCreateErr(data?.error || 'Could not create the assignment.')
        return
      }
      onToast?.('Assignment created.')
      setCreateOpen(false)
      setTitle('')
      setDescription('')
      setClassName('')
      setDueAt('')
      setFiles([])
      if (fileRef.current) fileRef.current.value = ''
      void load()
    } catch {
      setCreateErr('Could not create the assignment.')
    } finally {
      setCreating(false)
    }
     
  }

  const toggleArchive = async (row: AdminHomeworkRow) => {
    try {
      const res = await fetch(`/api/admin/homework/${encodeURIComponent(row.id)}`, {
        method: 'PATCH',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: !row.archived }),
      })
      if (res.ok) {
        onToast?.(row.archived ? 'Assignment restored.' : 'Assignment archived.')
        void load()
      }
    } catch {
      /* بی‌اهمیت */
    }
     
  }

  const confirmDelete = async () => {
    if (!deleteRow || deleting) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/homework/${encodeURIComponent(deleteRow.id)}`, {
        method: 'DELETE',
        headers: authHeaders,
      })
      if (res.ok) {
        onToast?.('Assignment deleted.')
        setDeleteRow(null)
        void load()
      }
    } catch {
      /* بی‌اهمیت */
    } finally {
      setDeleting(false)
    }
     
  }

  const saveFeedback = async () => {
    if (!feedbackFor || feedbackBusy) return
    setFeedbackBusy(true)
    try {
      const res = await fetch('/api/admin/homework/feedback', {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: feedbackFor.id, feedback: feedbackText.trim() }),
      })
      if (res.ok) {
        onToast?.('Feedback saved.')
        setFeedbackFor(null)
        if (detail) void openDetail(detail.id)
      }
    } catch {
      /* بی‌اهمیت */
    } finally {
      setFeedbackBusy(false)
    }
     
  }

  return (
    <div>
      {/* سربرگ + دکمهٔ ساخت */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-lg font-bold text-brown-dark flex items-center gap-2">
            <BookOpenCheck className="w-5 h-5 text-sage-dark" /> Homework
          </h3>
          <p className="text-xs text-brown-light mt-1">
            Create assignments with attachments, review student submissions and leave feedback.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void load()}
            className="bg-white border border-sage-light/40 text-brown px-3.5 py-2 rounded-xl text-xs font-medium hover:border-sage transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="bg-sage text-brown-dark px-4 py-2 rounded-xl text-xs font-bold hover:bg-sage-dark transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> New Assignment
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
      )}

      {/* فهرست */}
      {loading && !rows ? (
        <div className="py-10 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-sage-dark" />
        </div>
      ) : (rows ?? []).length === 0 ? (
        <div className="bg-white rounded-2xl border border-sage-light/20 p-8 text-center">
          <BookOpenCheck className="w-10 h-10 text-sage-dark/50 mx-auto mb-3" />
          <p className="text-sm text-brown-light">No assignments yet — create the first one.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {(rows ?? []).map((row) => (
            <li key={row.id} className="bg-white rounded-2xl border border-sage-light/20 p-4 md:p-5">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-brown-dark truncate">
                    {row.title}
                    {row.archived && (
                      <span className="ml-2 text-[10px] font-bold uppercase text-brown-light bg-cream border border-sage-light/40 rounded-full px-2 py-0.5">
                        Archived
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-brown-light mt-1">
                    {row.className ? `${row.className} · ` : ''}
                    {row.attachmentCount} attachment(s) · Due {fmtDateTime(row.dueAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-brown bg-cream border border-sage-light/40 rounded-full px-3 py-1.5">
                    {row.submissionCount} submission(s)
                  </span>
                  {row.pendingReview > 0 && (
                    <span className="text-xs font-bold text-peach-dark bg-peach/15 border border-peach/40 rounded-full px-3 py-1.5">
                      {row.pendingReview} to review
                    </span>
                  )}
                  <button
                    onClick={() => void openDetail(row.id)}
                    className="bg-sage-light/30 text-brown-dark px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-sage-light/50 transition-colors cursor-pointer"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => void toggleArchive(row)}
                    title={row.archived ? 'Restore' : 'Archive'}
                    className="p-2 rounded-full text-brown-light hover:text-brown hover:bg-cream transition-colors cursor-pointer"
                  >
                    {row.archived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setDeleteRow(row)}
                    title="Delete"
                    className="p-2 rounded-full text-brown-light hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* دیالوگ ساخت تکلیف */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Assignment</DialogTitle>
            {/* ♿ توضیح دیالوگ — رفع هشدار aria-describedby Radix */}
            <DialogDescription className="text-xs text-brown-light">
              Create a new assignment with attachments for your students.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brown-dark mb-1.5">Title *</label>
              <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., HSK 1 — Worksheet 3" maxLength={160} />
            </div>
            <div>
              <label className="block text-sm font-medium text-brown-dark mb-1.5">Description</label>
              <textarea className={`${inputCls} resize-none`} rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Instructions for students…" maxLength={4000} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-brown-dark mb-1.5">Class (optional)</label>
                <input className={inputCls} value={className} onChange={(e) => setClassName(e.target.value)} placeholder="Beginner Chinese" maxLength={120} />
              </div>
              <div>
                <label className="block text-sm font-medium text-brown-dark mb-1.5">Due date (optional)</label>
                <input type="datetime-local" className={inputCls} value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-brown-dark mb-1.5">Attachments (max 5, 15 MB each)</label>
              <input
                ref={fileRef}
                type="file"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 5))}
                className="block w-full text-xs text-brown-light file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sage-light/40 file:text-brown-dark cursor-pointer"
              />
              {files.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {files.map((f, i) => (
                    <li key={i} className="text-xs text-brown flex items-center justify-between bg-cream/60 rounded-lg px-3 py-1.5">
                      <span className="truncate">{f.name}</span>
                      <span className="text-brown-light whitespace-nowrap ml-2">{fmtBytes(f.size)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {createErr && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{createErr}</p>
            )}
            <button
              type="submit"
              disabled={creating}
              className="w-full bg-sage text-brown-dark py-3 rounded-xl text-sm font-bold hover:bg-sage-dark transition-colors cursor-pointer disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {creating ? 'Creating…' : 'Create Assignment'}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* دیالوگ جزئیات: پاسخ‌ها + بازخورد */}
      <Dialog open={!!detail || detailLoading} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detail?.title ?? 'Loading…'}</DialogTitle>
            <DialogDescription className="text-xs text-brown-light">
              Student submissions, files and your feedback for this assignment.
            </DialogDescription>
          </DialogHeader>
          {detailLoading || !detail ? (
            <div className="py-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-sage-dark" />
            </div>
          ) : (
            <div className="space-y-5">
              {detail.description && <p className="text-sm text-brown leading-relaxed whitespace-pre-wrap">{detail.description}</p>}
              {detail.files.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-brown-light mb-2">Attachments</p>
                  <ul className="space-y-1.5">
                    {detail.files.map((f) => (
                      <li key={f.id}>
                        <a
                          href={`/api/homework/files/${f.id}`}
                          className="inline-flex items-center gap-2 text-sm text-sage-dark hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Download className="w-3.5 h-3.5" /> {f.name}
                          <span className="text-xs text-brown-light">({fmtBytes(f.size)})</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-brown-light mb-2">
                  Submissions ({detail.submissions.length})
                </p>
                {detail.submissions.length === 0 ? (
                  <p className="text-sm text-brown-light">No submissions yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {detail.submissions.map((s) => (
                      <li key={s.id} className="bg-cream/50 border border-sage-light/30 rounded-2xl p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-brown-dark truncate">
                              {s.user.firstName} {s.user.lastName}
                              {s.user.uniqueCode && (
                                <span className="ml-2 font-mono text-[10px] text-brown-light">{s.user.uniqueCode}</span>
                              )}
                            </p>
                            <p className="text-xs text-brown-light mt-0.5">{s.user.email} · submitted {fmtDateTime(s.updatedAt)}</p>
                          </div>
                          <button
                            onClick={() => {
                              setFeedbackFor(s)
                              setFeedbackText(s.feedback ?? '')
                            }}
                            className="text-xs font-bold text-sage-dark hover:underline cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <MessageSquareText className="w-3.5 h-3.5" /> {s.feedback ? 'Edit feedback' : 'Give feedback'}
                          </button>
                        </div>
                        {s.note && (
                          <p className="text-sm text-brown mt-2 whitespace-pre-wrap">{s.note}</p>
                        )}
                        {s.files.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {s.files.map((f) => (
                              <li key={f.id}>
                                <a
                                  href={`/api/homework/files/${f.id}`}
                                  className="inline-flex items-center gap-2 text-xs text-sage-dark hover:underline"
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <FileText className="w-3 h-3" /> {f.name}
                                  <span className="text-brown-light">({fmtBytes(f.size)})</span>
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}
                        {s.feedback && (
                          <div className="mt-3 bg-sage-light/25 border border-sage/25 rounded-xl px-3.5 py-2.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-sage-dark mb-1">Your feedback</p>
                            <p className="text-sm text-brown whitespace-pre-wrap">{s.feedback}</p>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* دیالوگ بازخورد */}
      <Dialog open={!!feedbackFor} onOpenChange={(v) => !v && setFeedbackFor(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Feedback</DialogTitle>
            <DialogDescription className="text-xs text-brown-light">
              Write feedback for this student submission — they see it after you save.
            </DialogDescription>
          </DialogHeader>
          <textarea
            className={`${inputCls} resize-none`}
            rows={5}
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Write feedback for this submission…"
            maxLength={4000}
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setFeedbackFor(null)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-brown-light hover:text-brown cursor-pointer"
            >
              <X className="w-4 h-4 inline mr-1" /> Cancel
            </button>
            <button
              onClick={() => void saveFeedback()}
              disabled={feedbackBusy}
              className="bg-sage text-brown-dark px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-sage-dark transition-colors cursor-pointer disabled:opacity-60 inline-flex items-center gap-2"
            >
              {feedbackBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save Feedback
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* تأیید حذف */}
      <AlertDialog open={!!deleteRow} onOpenChange={(v) => !v && setDeleteRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleteRow?.title}” and all its attachments and student submissions will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void confirmDelete()
              }}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
