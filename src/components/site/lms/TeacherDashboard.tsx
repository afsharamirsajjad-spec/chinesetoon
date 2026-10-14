'use client'

// ---------------------------------------------------------------------------
// 🎓 داشبورد استاد (/teacher) — کلاس‌های assigned + فضای کار هر کلاس:
// دانش‌پذیران (ثبت‌نام/حذف)، مواد آموزشی، تکالیف، میزکار نمره‌دهی، جلسات
// آنلاین، اطلاعیه‌ها. گارد: فقط role=teacher (ادمین از پنل خودش کار می‌کند).
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BookOpen,
  BookOpenCheck,
  CalendarPlus,
  CheckCircle2,
  ChevronLeft,
  Download,
  FileText,
  GraduationCap,
  Home,
  Loader2,
  MessageSquareText,
  Plus,
  Send,
  Trash2,
  UserPlus,
  UserRound,
  Video,
  X,
} from 'lucide-react'
import { useUser, logoutUser } from '@/lib/user-store'
import { LmsShell } from './LmsShell'

interface TeacherClass {
  id: string
  slug: string
  title: string
  level: string
  image: string
  status: string
  studentCount: number
  materialCount: number
  assignmentCount: number
  sessionCount: number
  pendingReview: number
}

interface FileLike { id: string; name: string; mime: string; size: number }

interface Workspace {
  class: { id: string; slug: string; title: string; level: string; classType: string; fullDescription: string; maxStudents: number | null }
  students: { enrollmentId: string; userId: string; name: string; email: string; uniqueCode: string | null; enrolledAt: string }[]
  materials: { id: string; title: string; description: string; moduleLabel: string; published: boolean; visibleFrom: string | null; createdAt: string; files: FileLike[] }[]
  assignments: { id: string; title: string; description: string; dueAt: string | null; maxScore: number; archived: boolean; submissionCount: number; pendingReview: number }[]
  sessions: { id: string; title: string; description: string; startsAt: string; durationMin: number; provider: string; meetingUrl: string; status: string }[]
  announcements: { id: string; title: string; body: string; createdAt: string; authorName: string | null }[]
}

interface GradeSubmission {
  id: string
  note: string
  status: string
  score: number | null
  feedback: string | null
  releasedAt: string | null
  submittedAt: string
  student: { userId: string; name: string; email: string; uniqueCode: string | null }
  files: FileLike[]
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}
function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

export function TeacherDashboard() {
  const { loading: userLoading, user } = useUser()
  const [classes, setClasses] = useState<TeacherClass[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [section, setSection] = useState('overview')
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [ws, setWs] = useState<Workspace | null>(null)
  const [wsLoading, setWsLoading] = useState(false)
  const [wsTab, setWsTab] = useState('students')
  const [toast, setToast] = useState('')
  const showToast = useCallback((m: string) => {
    setToast(m)
    setTimeout(() => setToast(''), 3500)
  }, [])

  const loadClasses = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const res = await fetch('/api/teacher/classes', { cache: 'no-store' })
      if (!res.ok) {
        setClasses(null)
        setLoadError(res.status !== 403)
        return
      }
      const data = (await res.json()) as { classes: TeacherClass[] }
      setClasses(data.classes)
    } catch {
      setClasses(null)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user?.role === 'teacher') void loadClasses()
  }, [user, loadClasses])

  const openWorkspace = useCallback(async (classId: string, tab = 'students') => {
    setWorkspaceId(classId)
    setWs(null)
    setWsLoading(true)
    setWsTab(tab)
    try {
      const res = await fetch(`/api/teacher/classes/${encodeURIComponent(classId)}`, { cache: 'no-store' })
      if (res.ok) setWs((await res.json()) as Workspace)
    } catch {
      /* بی‌اهمیت */
    } finally {
      setWsLoading(false)
    }
  }, [])

  const refreshWorkspace = useCallback(() => {
    if (workspaceId) void openWorkspace(workspaceId, wsTab)
  }, [workspaceId, wsTab, openWorkspace])

  const nav = useMemo(
    () => [
      { key: 'overview', label: 'Overview', icon: Home },
      { key: 'classes', label: 'My Classes', icon: BookOpen },
      { key: 'students', label: 'Students', icon: UserRound },
      { key: 'profile', label: 'My Profile', icon: UserRound },
    ],
    []
  )

  if (userLoading) {
    return (
      <div className="pt-40 pb-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-sage-dark" />
      </div>
    )
  }

  // 🔒 فقط استاد
  if (!user || user.role !== 'teacher') {
    return (
      <div className="pt-40 pb-24 px-6 text-center">
        <GraduationCap className="w-12 h-12 text-sage-dark/60 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-brown-dark mb-3">Teacher Dashboard</h1>
        <p className="text-brown-light text-sm mb-8 max-w-md mx-auto">
          This area is for Chinese Toon teachers. If you believe you should have access, contact the administrator.
        </p>
        {!user && (
          <a href="/account" className="inline-flex items-center gap-2 bg-sage text-brown-dark px-8 py-3.5 rounded-2xl text-sm font-bold hover:bg-sage-dark transition-colors">
            Sign In
          </a>
        )}
      </div>
    )
  }

  const userName = [user.firstName, user.lastName].map((s) => (s || '').trim()).filter(Boolean).join(' ') || user.email.split('@')[0]
  const pendingTotal = classes?.reduce((s, c) => s + c.pendingReview, 0) ?? 0

  if (workspaceId) {
    return (
      <LmsShell
        title={ws?.class.title ?? 'Class workspace'}
        subtitle="Manage students, materials, assignments, sessions and announcements."
        userName={userName}
        userEmail={user.email}
        roleLabel="Teacher"
        nav={[
          { key: 'back', label: 'Back to dashboard', icon: ChevronLeft },
          { key: 'students', label: 'Students', icon: UserRound },
          { key: 'materials', label: 'Materials', icon: FileText },
          { key: 'assignments', label: 'Assignments & Grading', icon: BookOpenCheck },
          { key: 'sessions', label: 'Online Sessions', icon: Video },
          { key: 'announcements', label: 'Announcements', icon: MessageSquareText },
        ]}
        active={wsTab}
        onNavigate={(key) => {
          if (key === 'back') {
            setWorkspaceId(null)
            setWs(null)
            void loadClasses()
            return
          }
          setWsTab(key)
        }}
      >
        {wsLoading || !ws ? (
          <div className="py-20 text-center">
            <Loader2 className="w-7 h-7 animate-spin mx-auto text-sage-dark" />
          </div>
        ) : (
          <>
            {wsTab === 'students' && (
              <StudentsPanel ws={ws} onChanged={refreshWorkspace} onToast={showToast} />
            )}
            {wsTab === 'materials' && (
              <MaterialsPanel classId={ws.class.id} materials={ws.materials} onChanged={refreshWorkspace} onToast={showToast} />
            )}
            {wsTab === 'assignments' && (
              <AssignmentsPanel classId={ws.class.id} assignments={ws.assignments} onChanged={refreshWorkspace} onToast={showToast} />
            )}
            {wsTab === 'sessions' && (
              <SessionsPanel classId={ws.class.id} sessions={ws.sessions} onChanged={refreshWorkspace} onToast={showToast} />
            )}
            {wsTab === 'announcements' && (
              <AnnouncementsPanel classId={ws.class.id} announcements={ws.announcements} onChanged={refreshWorkspace} onToast={showToast} />
            )}
          </>
        )}
      </LmsShell>
    )
  }

  return (
    <LmsShell
      title={section === 'overview' ? 'Teacher Dashboard' : 'My Classes'}
      subtitle={
        section === 'overview'
          ? `Welcome, ${userName.split(' ')[0]} — ${pendingTotal > 0 ? `${pendingTotal} submission(s) waiting for review.` : 'everything is reviewed.'}`
          : 'Classes assigned to you by the administrator.'
      }
      userName={userName}
      userEmail={user.email}
      roleLabel="Teacher"
      nav={nav}
      active={section}
      onNavigate={(key) => {
        if (key === 'profile') {
          window.location.href = '/account'
          return
        }
        setSection(key)
      }}
      onRefresh={() => void loadClasses()}
      onLogout={() => void logoutUser()}
    >
      {toast && (
        <div className="mb-4 rounded-2xl border border-sage/30 bg-sage-light/20 px-4 py-3 text-sm font-semibold text-brown-dark" role="status">
          {toast}
        </div>
      )}

      {loading && !classes ? (
        <div className="py-20 text-center">
          <Loader2 className="w-7 h-7 animate-spin mx-auto text-sage-dark" />
        </div>
      ) : loadError ? (
        <p className="text-sm text-brown-light bg-white rounded-2xl border border-sage-light/20 p-8 text-center">
          Could not load your classes right now — please refresh.
        </p>
      ) : !classes || classes.length === 0 ? (
        <div className="bg-white rounded-3xl border border-sage-light/20 shadow-lg p-10 text-center">
          <BookOpen className="w-12 h-12 text-sage-dark/50 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-brown-dark mb-2">No classes assigned yet</h2>
          <p className="text-sm text-brown-light max-w-md mx-auto">
            The administrator will assign your classes — they will appear here.
          </p>
        </div>
      ) : (
        <>
          {section === 'overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <StatCard label="My classes" value={classes.length} />
                <StatCard label="Enrolled students" value={classes.reduce((s, c) => s + c.studentCount, 0)} />
                <StatCard label="To review" value={pendingTotal} highlight={pendingTotal > 0} />
              </div>
              <ClassList classes={classes} onOpen={openWorkspace} />
            </div>
          )}
          {section === 'classes' && <ClassList classes={classes} onOpen={openWorkspace} />}
          {section === 'students' && (
            <div className="space-y-3">
              {classes.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => void openWorkspace(c.id, 'students')}
                  className="w-full bg-white rounded-2xl border border-sage-light/20 p-5 flex items-center justify-between gap-3 hover:border-sage transition-colors cursor-pointer text-left"
                >
                  <span className="min-w-0">
                    <span className="block font-semibold text-brown-dark truncate">{c.title}</span>
                    <span className="block text-xs text-brown-light mt-1">{c.studentCount} enrolled student(s)</span>
                  </span>
                  <ChevronLeft className="w-4 h-4 rotate-180 text-brown-light flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </LmsShell>
  )
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`bg-white rounded-2xl border p-5 ${highlight ? 'border-sage/40' : 'border-sage-light/20'}`}>
      <p className="text-xs font-bold uppercase tracking-wider text-sage-dark mb-2">{label}</p>
      <p className="text-2xl font-extrabold text-brown-dark tabular-nums">{value}</p>
    </div>
  )
}

function ClassList({ classes, onOpen }: { classes: TeacherClass[]; onOpen: (id: string, tab?: string) => void }) {
  return (
    <ul className="space-y-3">
      {classes.map((c) => (
        <li key={c.id} className="bg-white rounded-2xl border border-sage-light/20 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-bold text-brown-dark truncate">{c.title}</p>
              <p className="text-xs text-brown-light mt-1">
                {c.level} · {c.studentCount} student(s) · {c.materialCount} material(s) · {c.assignmentCount} assignment(s)
              </p>
            </div>
            <div className="flex items-center gap-2">
              {c.pendingReview > 0 && (
                <span className="text-xs font-bold text-peach-dark bg-peach/15 border border-peach/40 rounded-full px-3 py-1.5">
                  {c.pendingReview} to review
                </span>
              )}
              <button
                type="button"
                onClick={() => onOpen(c.id)}
                className="bg-sage text-brown-dark px-4 py-2 rounded-xl text-xs font-bold hover:bg-sage-dark transition-colors cursor-pointer"
              >
                Open Workspace
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

const inputCls =
  'w-full bg-white border border-sage-light/40 rounded-xl px-3.5 py-2.5 text-sm text-brown-dark focus:outline-none focus:ring-2 focus:ring-sage/40 focus:border-sage transition-colors'

function StudentsPanel({ ws, onChanged, onToast }: { ws: Workspace; onChanged: () => void; onToast: (m: string) => void }) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const act = async (action: 'enroll' | 'unenroll', userId?: string) => {
    setBusy(true)
    setErr('')
    try {
      const res = await fetch(`/api/teacher/classes/${encodeURIComponent(ws.class.id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...(action === 'enroll' ? { userEmail: email.trim() } : { userId }) }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setErr(data?.error || 'Could not update enrollment.')
        return
      }
      onToast(action === 'enroll' ? 'Student enrolled.' : 'Student removed.')
      if (action === 'enroll') setEmail('')
      onChanged()
    } catch {
      setErr('Could not update enrollment.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-sage-light/20 p-5">
        <p className="text-sm font-bold text-brown-dark mb-1 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-sage-dark" /> Enroll a student
        </p>
        <p className="text-xs text-brown-light mb-3">The student must have a Chinese Toon account — enroll by their account email.</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@email.com"
            className={inputCls}
            dir="ltr"
          />
          <button
            type="button"
            onClick={() => void act('enroll')}
            disabled={busy || !email.trim()}
            className="bg-sage text-brown-dark px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-sage-dark transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap"
          >
            Enroll
          </button>
        </div>
        {err && <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 mt-3">{err}</p>}
      </div>

      {ws.students.length === 0 ? (
        <div className="bg-white rounded-2xl border border-sage-light/20 p-8 text-center text-sm text-brown-light">
          No students enrolled yet.
        </div>
      ) : (
        <ul className="space-y-2">
          {ws.students.map((s) => (
            <li key={s.enrollmentId} className="bg-white rounded-2xl border border-sage-light/20 p-4 flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-brown-dark truncate">
                  {s.name}
                  {s.uniqueCode && <span className="ml-2 font-mono text-[10px] text-brown-light">{s.uniqueCode}</span>}
                </p>
                <p className="text-xs text-brown-light">{s.email}</p>
              </div>
              <button
                type="button"
                onClick={() => void act('unenroll', s.userId)}
                disabled={busy}
                title="Remove from class"
                className="p-2 rounded-full text-brown-light hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function MaterialsPanel({ classId, materials, onChanged, onToast }: { classId: string; materials: Workspace['materials']; onChanged: () => void; onToast: (m: string) => void }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [moduleLabel, setModuleLabel] = useState('')
  const [visibleFrom, setVisibleFrom] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const submit = async () => {
    if (busy || title.trim().length < 2) {
      if (title.trim().length < 2) setErr('Please enter a title.')
      return
    }
    setBusy(true)
    setErr('')
    try {
      const fd = new FormData()
      fd.append('title', title.trim())
      fd.append('description', description.trim())
      fd.append('moduleLabel', moduleLabel.trim())
      if (visibleFrom) fd.append('visibleFrom', new Date(visibleFrom).toISOString())
      files.forEach((f) => fd.append('files', f))
      const res = await fetch(`/api/teacher/classes/${encodeURIComponent(classId)}/materials`, {
        method: 'POST',
        body: fd,
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setErr(data?.error || 'Could not upload.')
        return
      }
      onToast('Material uploaded.')
      setOpen(false)
      setTitle('')
      setDescription('')
      setModuleLabel('')
      setVisibleFrom('')
      setFiles([])
      onChanged()
    } catch {
      setErr('Could not upload.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (id: string) => {
    if (!window.confirm('Delete this material and its files?')) return
    const res = await fetch(`/api/teacher/materials/${encodeURIComponent(id)}`, { method: 'DELETE' })
    if (res.ok) {
      onToast('Material deleted.')
      onChanged()
    }
  }

  const togglePublished = async (m: Workspace['materials'][number]) => {
    const res = await fetch(`/api/teacher/materials/${encodeURIComponent(m.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !m.published }),
    })
    if (res.ok) onChanged()
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="bg-sage text-brown-dark px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-sage-dark transition-colors cursor-pointer inline-flex items-center gap-2"
      >
        {open ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {open ? 'Close form' : 'Upload Material'}
      </button>
      {open && (
        <div className="bg-white rounded-2xl border border-sage-light/20 p-5 space-y-3">
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (e.g., Week 1 — Pinyin worksheet)" />
          <textarea className={`${inputCls} resize-none`} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" />
          <div className="grid sm:grid-cols-2 gap-3">
            <input className={inputCls} value={moduleLabel} onChange={(e) => setModuleLabel(e.target.value)} placeholder="Module / week label (optional)" />
            <input type="datetime-local" className={inputCls} value={visibleFrom} onChange={(e) => setVisibleFrom(e.target.value)} title="Publish later (optional)" />
          </div>
          <input
            type="file"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 5))}
            className="block w-full text-xs text-brown-light file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sage-light/40 file:text-brown-dark cursor-pointer"
          />
          {err && <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{err}</p>}
          <button
            type="button"
            onClick={() => void submit()}
            disabled={busy}
            className="bg-sage text-brown-dark px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-sage-dark transition-colors cursor-pointer disabled:opacity-60 inline-flex items-center gap-2"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Upload
          </button>
        </div>
      )}

      {materials.length === 0 ? (
        <div className="bg-white rounded-2xl border border-sage-light/20 p-8 text-center text-sm text-brown-light">No materials yet.</div>
      ) : (
        <ul className="space-y-3">
          {materials.map((m) => (
            <li key={m.id} className="bg-white rounded-2xl border border-sage-light/20 p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-brown-dark">
                    {m.title}
                    {!m.published && (
                      <span className="ml-2 text-[10px] font-bold uppercase text-brown-light bg-cream border border-sage-light/40 rounded-full px-2 py-0.5">Hidden</span>
                    )}
                  </p>
                  <p className="text-xs text-brown-light mt-1">
                    {m.moduleLabel ? `${m.moduleLabel} · ` : ''}
                    {m.published ? `Visible${m.visibleFrom ? ` from ${fmtDateTime(m.visibleFrom)}` : ' now'}` : 'Hidden from students'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => void togglePublished(m)} className="text-xs font-semibold text-sage-dark hover:underline cursor-pointer px-2 py-1">
                    {m.published ? 'Hide' : 'Publish'}
                  </button>
                  <button type="button" onClick={() => void remove(m.id)} className="p-2 rounded-full text-brown-light hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {m.description && <p className="text-sm text-brown mt-2 whitespace-pre-wrap">{m.description}</p>}
              {m.files.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {m.files.map((f) => (
                    <li key={f.id}>
                      <a href={`/api/lms/files/${f.id}`} className="inline-flex items-center gap-2 text-xs text-sage-dark hover:underline">
                        <Download className="w-3 h-3" /> {f.name} <span className="text-brown-light">({fmtBytes(f.size)})</span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function AssignmentsPanel({ classId, assignments, onChanged, onToast }: { classId: string; assignments: Workspace['assignments']; onChanged: () => void; onToast: (m: string) => void }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [maxScore, setMaxScore] = useState('100')
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [gradingId, setGradingId] = useState<string | null>(null)

  const submit = async () => {
    if (busy) return
    if (title.trim().length < 2) {
      setErr('Please enter a title.')
      return
    }
    setBusy(true)
    setErr('')
    try {
      const fd = new FormData()
      fd.append('title', title.trim())
      fd.append('description', description.trim())
      if (dueAt) fd.append('dueAt', new Date(dueAt).toISOString())
      fd.append('maxScore', maxScore || '100')
      files.forEach((f) => fd.append('files', f))
      const res = await fetch(`/api/teacher/classes/${encodeURIComponent(classId)}/assignments`, {
        method: 'POST',
        body: fd,
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setErr(data?.error || 'Could not create the assignment.')
        return
      }
      onToast('Assignment created.')
      setOpen(false)
      setTitle('')
      setDescription('')
      setDueAt('')
      setMaxScore('100')
      setFiles([])
      onChanged()
    } catch {
      setErr('Could not create the assignment.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="bg-sage text-brown-dark px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-sage-dark transition-colors cursor-pointer inline-flex items-center gap-2"
      >
        {open ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {open ? 'Close form' : 'New Assignment'}
      </button>
      {open && (
        <div className="bg-white rounded-2xl border border-sage-light/20 p-5 space-y-3">
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Assignment title" />
          <textarea className={`${inputCls} resize-none`} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Instructions for students…" />
          <div className="grid sm:grid-cols-2 gap-3">
            <input type="datetime-local" className={inputCls} value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
            <input type="number" min={1} max={1000} className={inputCls} value={maxScore} onChange={(e) => setMaxScore(e.target.value)} placeholder="Max score" />
          </div>
          <input
            type="file"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 5))}
            className="block w-full text-xs text-brown-light file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sage-light/40 file:text-brown-dark cursor-pointer"
          />
          {err && <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{err}</p>}
          <button
            type="button"
            onClick={() => void submit()}
            disabled={busy}
            className="bg-sage text-brown-dark px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-sage-dark transition-colors cursor-pointer disabled:opacity-60 inline-flex items-center gap-2"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Create Assignment
          </button>
        </div>
      )}

      {assignments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-sage-light/20 p-8 text-center text-sm text-brown-light">No assignments yet.</div>
      ) : (
        <ul className="space-y-3">
          {assignments.map((a) => (
            <li key={a.id} className="bg-white rounded-2xl border border-sage-light/20 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-brown-dark truncate">
                    {a.title}
                    {a.archived && <span className="ml-2 text-[10px] font-bold uppercase text-brown-light bg-cream border border-sage-light/40 rounded-full px-2 py-0.5">Archived</span>}
                  </p>
                  <p className="text-xs text-brown-light mt-1">
                    Due {a.dueAt ? fmtDateTime(a.dueAt) : '—'} · Max {a.maxScore} · {a.submissionCount} submission(s)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setGradingId(a.id)}
                  className="bg-sage-light/30 text-brown-dark px-4 py-2 rounded-xl text-xs font-bold hover:bg-sage-light/50 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Grade
                  {a.pendingReview > 0 && (
                    <span className="bg-peach/20 text-peach-dark rounded-full px-1.5 text-[10px] font-bold">{a.pendingReview}</span>
                  )}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {gradingId && (
        <GradingDialog
          assignmentId={gradingId}
          onClose={() => {
            setGradingId(null)
            onChanged()
          }}
          onToast={onToast}
        />
      )}
    </div>
  )
}

function GradingDialog({ assignmentId, onClose, onToast }: { assignmentId: string; onClose: () => void; onToast: (m: string) => void }) {
  const [data, setData] = useState<{ assignment: { title: string; maxScore: number; description: string }; submissions: GradeSubmission[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState<Record<string, { score: string; feedback: string }>>({})
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await fetch(`/api/teacher/assignments/${encodeURIComponent(assignmentId)}/submissions`, { cache: 'no-store' })
        if (alive && res.ok) {
          setData((await res.json()) as { assignment: { title: string; maxScore: number; description: string }; submissions: GradeSubmission[] })
        }
      } catch {
        /* بی‌اهمیت */
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [assignmentId])

  const act = async (submissionId: string, action: 'grade' | 'return' | 'release') => {
    const d = draft[submissionId] ?? { score: '', feedback: '' }
    setBusyId(submissionId)
    try {
      const res = await fetch(`/api/teacher/submissions/${encodeURIComponent(submissionId)}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, score: d.score, feedback: d.feedback }),
      })
      const resData = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        onToast(resData?.error || 'Could not save the grade.')
        return
      }
      onToast(action === 'return' ? 'Returned for revision.' : action === 'release' ? 'Feedback released.' : 'Graded and released.')
      // به‌روزرسانی لیست
      const res2 = await fetch(`/api/teacher/assignments/${encodeURIComponent(assignmentId)}/submissions`, { cache: 'no-store' })
      if (res2.ok) setData((await res2.json()) as { assignment: { title: string; maxScore: number; description: string }; submissions: GradeSubmission[] })
    } catch {
      onToast('Could not save the grade.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brown-dark/40" role="dialog" aria-modal="true">
      <div className="bg-cream rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 md:p-8 shadow-2xl">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-bold text-brown-dark">{data?.assignment.title ?? 'Grading'}</h3>
            <p className="text-xs text-brown-light mt-1">Max score {data?.assignment.maxScore ?? '—'}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-full text-brown-light hover:text-brown hover:bg-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        {loading ? (
          <div className="py-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-sage-dark" /></div>
        ) : !data || data.submissions.length === 0 ? (
          <p className="text-sm text-brown-light text-center py-6">No submissions yet.</p>
        ) : (
          <ul className="space-y-4">
            {data.submissions.map((s) => {
              const d = draft[s.id] ?? { score: s.score != null ? String(s.score) : '', feedback: s.feedback ?? '' }
              return (
                <li key={s.id} className="bg-white rounded-2xl border border-sage-light/20 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-brown-dark truncate">
                        {s.student.name}
                        {s.student.uniqueCode && <span className="ml-2 font-mono text-[10px] text-brown-light">{s.student.uniqueCode}</span>}
                      </p>
                      <p className="text-xs text-brown-light">{s.student.email} · {fmtDateTime(s.submittedAt)}</p>
                    </div>
                    <span
                      className={`text-[11px] font-bold rounded-full px-3 py-1.5 border ${
                        s.status === 'GRADED' && s.releasedAt
                          ? 'text-sage-dark bg-sage-light/25 border-sage/30'
                          : s.status === 'RETURNED'
                            ? 'text-peach-dark bg-peach/15 border-peach/40'
                            : 'text-brown bg-cream border-sage-light/40'
                      }`}
                    >
                      {s.status === 'GRADED' ? (s.releasedAt ? 'Graded & Released' : 'Graded') : s.status === 'RETURNED' ? 'Returned' : 'Submitted'}
                    </span>
                  </div>
                  {s.note && <p className="text-sm text-brown mt-2 whitespace-pre-wrap">{s.note}</p>}
                  {s.files.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {s.files.map((f) => (
                        <li key={f.id}>
                          <a href={`/api/homework/files/${f.id}`} className="inline-flex items-center gap-2 text-xs text-sage-dark hover:underline" target="_blank" rel="noreferrer">
                            <Download className="w-3 h-3" /> {f.name} <span className="text-brown-light">({fmtBytes(f.size)})</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-3 grid sm:grid-cols-[100px_1fr] gap-2">
                    <input
                      type="number"
                      min={0}
                      max={data.assignment.maxScore}
                      value={d.score}
                      onChange={(e) => setDraft((prev) => ({ ...prev, [s.id]: { ...d, score: e.target.value } }))}
                      placeholder={`0-${data.assignment.maxScore}`}
                      className={inputCls}
                    />
                    <textarea
                      rows={2}
                      value={d.feedback}
                      onChange={(e) => setDraft((prev) => ({ ...prev, [s.id]: { ...d, feedback: e.target.value } }))}
                      placeholder="Feedback for this student…"
                      className={`${inputCls} resize-none`}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => void act(s.id, 'grade')}
                      disabled={busyId === s.id}
                      className="bg-sage text-brown-dark px-4 py-2 rounded-xl text-xs font-bold hover:bg-sage-dark transition-colors cursor-pointer disabled:opacity-60 inline-flex items-center gap-1.5"
                    >
                      {busyId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Grade & Release
                    </button>
                    <button
                      type="button"
                      onClick={() => void act(s.id, 'return')}
                      disabled={busyId === s.id}
                      className="bg-butter/40 text-brown px-4 py-2 rounded-xl text-xs font-bold hover:bg-butter/60 transition-colors cursor-pointer disabled:opacity-60"
                    >
                      Return for Revision
                    </button>
                    {s.releasedAt == null && (s.feedback || s.score != null) && (
                      <button
                        type="button"
                        onClick={() => void act(s.id, 'release')}
                        disabled={busyId === s.id}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-brown-light hover:text-brown cursor-pointer disabled:opacity-60"
                      >
                        Release only
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function SessionsPanel({ classId, sessions, onChanged, onToast }: { classId: string; sessions: Workspace['sessions']; onChanged: () => void; onToast: (m: string) => void }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [durationMin, setDurationMin] = useState('60')
  const [meetingUrl, setMeetingUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const create = async () => {
    if (busy) return
    if (title.trim().length < 2 || !startsAt) {
      setErr('Title and start time are required.')
      return
    }
    setBusy(true)
    setErr('')
    try {
      const res = await fetch(`/api/teacher/classes/${encodeURIComponent(classId)}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          startsAt: new Date(startsAt).toISOString(),
          durationMin: Number(durationMin) || 60,
          meetingUrl: meetingUrl.trim(),
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setErr(data?.error || 'Could not schedule the session.')
        return
      }
      onToast('Session scheduled.')
      setOpen(false)
      setTitle('')
      setDescription('')
      setStartsAt('')
      setDurationMin('60')
      setMeetingUrl('')
      onChanged()
    } catch {
      setErr('Could not schedule the session.')
    } finally {
      setBusy(false)
    }
  }

  const setStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/teacher/sessions/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      onToast(status === 'cancelled' ? 'Session cancelled.' : 'Session updated.')
      onChanged()
    }
  }

  const remove = async (id: string) => {
    if (!window.confirm('Delete this session?')) return
    const res = await fetch(`/api/teacher/sessions/${encodeURIComponent(id)}`, { method: 'DELETE' })
    if (res.ok) {
      onToast('Session deleted.')
      onChanged()
    }
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="bg-sage text-brown-dark px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-sage-dark transition-colors cursor-pointer inline-flex items-center gap-2"
      >
        {open ? <X className="w-4 h-4" /> : <CalendarPlus className="w-4 h-4" />} {open ? 'Close form' : 'Schedule Session'}
      </button>
      {open && (
        <div className="bg-white rounded-2xl border border-sage-light/20 p-5 space-y-3">
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Session title (e.g., Lesson 5 — Live practice)" />
          <textarea className={`${inputCls} resize-none`} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What will be covered? (optional)" />
          <div className="grid sm:grid-cols-2 gap-3">
            <input type="datetime-local" className={inputCls} value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            <input type="number" min={10} max={480} className={inputCls} value={durationMin} onChange={(e) => setDurationMin(e.target.value)} placeholder="Duration (min)" />
          </div>
          <input className={inputCls} value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} placeholder="Meeting link (Zoom / Google Meet / Jitsi) — https://…" dir="ltr" />
          {err && <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{err}</p>}
          <button
            type="button"
            onClick={() => void create()}
            disabled={busy}
            className="bg-sage text-brown-dark px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-sage-dark transition-colors cursor-pointer disabled:opacity-60 inline-flex items-center gap-2"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Schedule
          </button>
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-sage-light/20 p-8 text-center text-sm text-brown-light">No sessions scheduled yet.</div>
      ) : (
        <ul className="space-y-3">
          {sessions.map((s) => (
            <li key={s.id} className="bg-white rounded-2xl border border-sage-light/20 p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-brown-dark">
                    {s.title}
                    {s.status !== 'scheduled' && (
                      <span className="ml-2 text-[10px] font-bold uppercase text-brown-light bg-cream border border-sage-light/40 rounded-full px-2 py-0.5">{s.status}</span>
                    )}
                  </p>
                  <p className="text-xs text-brown-light mt-1">{fmtDateTime(s.startsAt)} · {s.durationMin} min</p>
                  {s.meetingUrl && (
                    <a href={s.meetingUrl} target="_blank" rel="noreferrer" className="text-xs text-sage-dark hover:underline inline-flex items-center gap-1 mt-1">
                      <Video className="w-3 h-3" /> Meeting link
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {s.status === 'scheduled' && (
                    <button type="button" onClick={() => void setStatus(s.id, 'cancelled')} className="text-xs font-semibold text-peach-dark hover:underline cursor-pointer px-2 py-1">
                      Cancel
                    </button>
                  )}
                  <button type="button" onClick={() => void remove(s.id)} className="p-2 rounded-full text-brown-light hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {s.description && <p className="text-sm text-brown mt-2 whitespace-pre-wrap">{s.description}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function AnnouncementsPanel({ classId, announcements, onChanged, onToast }: { classId: string; announcements: Workspace['announcements']; onChanged: () => void; onToast: (m: string) => void }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const publish = async () => {
    if (busy) return
    if (title.trim().length < 2 || !body.trim()) {
      setErr('Title and body are required.')
      return
    }
    setBusy(true)
    setErr('')
    try {
      const res = await fetch(`/api/teacher/classes/${encodeURIComponent(classId)}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), body: body.trim() }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setErr(data?.error || 'Could not publish.')
        return
      }
      onToast('Announcement published.')
      setTitle('')
      setBody('')
      onChanged()
    } catch {
      setErr('Could not publish.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (id: string) => {
    if (!window.confirm('Delete this announcement?')) return
    const res = await fetch(`/api/teacher/announcements/${encodeURIComponent(id)}`, { method: 'DELETE' })
    if (res.ok) {
      onToast('Announcement deleted.')
      onChanged()
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-sage-light/20 p-5 space-y-3">
        <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title" />
        <textarea className={`${inputCls} resize-none`} rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message to all enrolled students…" />
        {err && <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{err}</p>}
        <button
          type="button"
          onClick={() => void publish()}
          disabled={busy}
          className="bg-sage text-brown-dark px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-sage-dark transition-colors cursor-pointer disabled:opacity-60 inline-flex items-center gap-2"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Publish
        </button>
      </div>

      {announcements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-sage-light/20 p-8 text-center text-sm text-brown-light">No announcements yet.</div>
      ) : (
        <ul className="space-y-3">
          {announcements.map((a) => (
            <li key={a.id} className="bg-white rounded-2xl border border-sage-light/20 p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-brown-dark">{a.title}</p>
                  <p className="text-xs text-brown-light mt-0.5">{a.authorName ?? 'Teacher'} · {fmtDateTime(a.createdAt)}</p>
                </div>
                <button type="button" onClick={() => void remove(a.id)} className="p-2 rounded-full text-brown-light hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-brown mt-2 whitespace-pre-wrap leading-relaxed">{a.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
