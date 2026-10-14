'use client'

// ---------------------------------------------------------------------------
// 🎓 داشبورد دانش‌پذیر (/student) — Overview / My Classes / Assignments /
// Grades / Announcements + فضای کار هر کلاس (مواد، تکالیف، جلسات، اطلاعیه‌ها)
// همهٔ داده‌ها از APIهای LMS می‌آید؛ مهمان/بدون ثبت‌نام → گیت ورود.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  BookOpenCheck,
  CalendarDays,
  ChevronLeft,
  Download,
  FileText,
  GraduationCap,
  Home,
  LifeBuoy,
  Loader2,
  MessageSquareText,
  Send,
  UserRound,
  Video,
} from 'lucide-react'
import { useUser, logoutUser } from '@/lib/user-store'
import { LmsShell } from './LmsShell'

interface HomeworkFileLike { id: string; name: string; mime: string; size: number }

interface ClassSummary {
  id: string
  slug: string
  title: string
  level: string
  classType: string
  image: string
  teacherName: string | null
  materialCount: number
  assignmentCount: number
  openAssignments: number
  nextSessionAt: string | null
  nextSessionTitle: string | null
  unreadAnnouncements: number | null
  enrolledAt: string
}

interface WorkspaceAssignment {
  id: string
  title: string
  description: string
  createdAt: string
  dueAt: string | null
  maxScore: number
  files: HomeworkFileLike[]
  mySubmission: {
    id: string
    note: string
    released: boolean
    score: number | null
    status: string
    feedback: string | null
    submittedAt: string
    files: HomeworkFileLike[]
  } | null
}

interface Workspace {
  class: {
    id: string; slug: string; title: string; level: string; classType: string
    fullDescription: string; image: string; sessionDurationMin: number | null
    startDate: string | null; teacherName: string | null
  }
  materials: { id: string; title: string; description: string; moduleLabel: string; createdAt: string; files: HomeworkFileLike[] }[]
  assignments: WorkspaceAssignment[]
  sessions: { id: string; title: string; description: string; startsAt: string; durationMin: number; provider: string; status: string; meetingUrl: string }[]
  announcements: { id: string; title: string; body: string; createdAt: string; authorName: string | null; read: boolean }[]
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

function StatusPill({ sub, maxScore }: { sub: NonNullable<WorkspaceAssignment['mySubmission']>; maxScore: number }) {
  if (sub.status === 'RETURNED') {
    return <span className="text-[11px] font-bold text-peach-dark bg-peach/15 border border-peach/40 rounded-full px-3 py-1.5">Returned for revision</span>
  }
  if (sub.status === 'GRADED' && sub.released) {
    return (
      <span className="text-[11px] font-bold text-sage-dark bg-sage-light/25 border border-sage/30 rounded-full px-3 py-1.5">
        Graded{sub.score != null ? ` · ${sub.score}/${maxScore}` : ''}
      </span>
    )
  }
  return <span className="text-[11px] font-bold text-brown bg-white border border-sage-light/40 rounded-full px-3 py-1.5">Submitted</span>
}

export function StudentDashboard() {
  const { loading: userLoading, user } = useUser()
  const [classes, setClasses] = useState<ClassSummary[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [section, setSection] = useState('overview')
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [wsLoading, setWsLoading] = useState(false)
  const [wsTab, setWsTab] = useState('overview')
  const [toast, setToast] = useState('')
  const showToast = useCallback((m: string) => {
    setToast(m)
    setTimeout(() => setToast(''), 3500)
  }, [])

  const loadClasses = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const res = await fetch('/api/lms/student/classes', { cache: 'no-store' })
      if (!res.ok) {
        setClasses(null)
        setLoadError(res.status !== 401)
        return
      }
      const data = (await res.json()) as { classes: ClassSummary[] }
      setClasses(data.classes)
    } catch {
      setClasses(null)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) void loadClasses()
  }, [user, loadClasses])

  const openWorkspace = useCallback(async (classId: string) => {
    setWorkspaceId(classId)
    setWorkspace(null)
    setWsLoading(true)
    setWsTab('overview')
    try {
      const res = await fetch(`/api/lms/student/classes/${encodeURIComponent(classId)}`, { cache: 'no-store' })
      if (res.ok) setWorkspace((await res.json()) as Workspace)
    } catch {
      /* بی‌اهمیت */
    } finally {
      setWsLoading(false)
    }
  }, [])

  const markAnnouncementsRead = useCallback(async (classId: string) => {
    try {
      await fetch(`/api/lms/student/classes/${encodeURIComponent(classId)}`, { method: 'POST' })
      void loadClasses()
      setWorkspace((w) =>
        w ? { ...w, announcements: w.announcements.map((a) => ({ ...a, read: true })) } : w
      )
    } catch {
      /* بی‌اهمیت */
    }
  }, [loadClasses])

  const nav = useMemo(
    () => [
      { key: 'overview', label: 'Overview', icon: Home },
      { key: 'classes', label: 'My Classes', icon: BookOpen },
      { key: 'assignments', label: 'Assignments', icon: BookOpenCheck },
      { key: 'grades', label: 'Grades & Feedback', icon: GraduationCap },
      { key: 'announcements', label: 'Announcements', icon: MessageSquareText, badge: classes?.reduce((s, c) => s + (c.unreadAnnouncements ?? 0), 0) },
      { key: 'profile', label: 'My Profile', icon: UserRound },
      { key: 'support', label: 'Help & Support', icon: LifeBuoy },
    ],
    [classes]
  )

  // ⏳ تا مشخص شدن وضعیت حساب
  if (userLoading) {
    return (
      <div className="pt-40 pb-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-sage-dark" />
      </div>
    )
  }

  // 🔒 فقط کاربر واردشده
  if (!user) {
    return (
      <div className="pt-40 pb-24 px-6 text-center">
        <GraduationCap className="w-12 h-12 text-sage-dark/60 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-brown-dark mb-3">Student Dashboard</h1>
        <p className="text-brown-light text-sm mb-8 max-w-md mx-auto">
          Sign in to your Chinese Toon account to see your enrolled classes, materials, assignments and grades.
        </p>
        <Link
          href="/account"
          className="inline-flex items-center gap-2 bg-sage text-brown-dark px-8 py-3.5 rounded-2xl text-sm font-bold hover:bg-sage-dark transition-colors"
        >
          Sign In / Create Account
        </Link>
      </div>
    )
  }

  const userName = [user.firstName, user.lastName].map((s) => (s || '').trim()).filter(Boolean).join(' ') || user.email.split('@')[0]

  const activeLabel = nav.find((n) => n.key === section)?.label ?? 'Overview'
  const pendingTotal = classes?.reduce((s, c) => s + c.openAssignments, 0) ?? 0

  // ————— فضای کار کلاس —————
  if (workspaceId) {
    return (
      <LmsShell
        title={workspace?.class.title ?? 'Class workspace'}
        subtitle="Your class workspace — materials, assignments, sessions and announcements."
        userName={userName}
        userEmail={user.email}
        roleLabel="Student"
        nav={[
          { key: 'back', label: 'Back to dashboard', icon: ChevronLeft },
          { key: 'overview', label: 'Overview', icon: Home },
          { key: 'materials', label: 'Materials', icon: FileText },
          { key: 'assignments', label: 'Assignments', icon: BookOpenCheck },
          { key: 'sessions', label: 'Online Sessions', icon: Video },
          { key: 'announcements', label: 'Announcements', icon: MessageSquareText },
        ]}
        active={wsTab === 'back' ? 'back' : wsTab}
        onNavigate={(key) => {
          if (key === 'back') {
            setWorkspaceId(null)
            setWorkspace(null)
            void loadClasses()
            return
          }
          setWsTab(key)
        }}
      >
        {wsLoading || !workspace ? (
          <div className="py-20 text-center">
            <Loader2 className="w-7 h-7 animate-spin mx-auto text-sage-dark" />
          </div>
        ) : (
          <>
            {wsTab === 'overview' && (
              <div className="space-y-5">
                <div className="bg-white rounded-3xl border border-sage-light/20 shadow-lg p-6 md:p-8">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-sage-dark bg-sage-light/25 rounded-full px-3 py-1">{workspace.class.level}</span>
                    {workspace.class.startDate && (
                      <span className="text-[11px] font-semibold text-brown-light bg-cream border border-sage-light/40 rounded-full px-3 py-1 inline-flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" /> Started {fmtDate(workspace.class.startDate)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-brown leading-relaxed whitespace-pre-wrap">
                    {workspace.class.fullDescription || 'Course details will be published soon.'}
                  </p>
                  <p className="text-xs text-brown-light mt-4">
                    Teacher: <span className="font-semibold text-brown-dark">{workspace.class.teacherName ?? '—'}</span>
                    {workspace.class.sessionDurationMin ? ` · ${workspace.class.sessionDurationMin} min sessions` : ''}
                  </p>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <StatCard icon={<FileText className="w-4 h-4" />} label="Materials" value={workspace.materials.length} />
                  <StatCard icon={<BookOpenCheck className="w-4 h-4" />} label="Assignments" value={workspace.assignments.length} />
                  <StatCard icon={<Video className="w-4 h-4" />} label="Sessions" value={workspace.sessions.length} />
                </div>
              </div>
            )}

            {wsTab === 'materials' && (
              <MaterialList materials={workspace.materials} />
            )}

            {wsTab === 'assignments' && (
              <StudentAssignmentList workspace={workspace} onToast={showToast} />
            )}

            {wsTab === 'sessions' && (
              <div className="space-y-4">
                {workspace.sessions.length === 0 ? (
                  <EmptyBox icon={<Video className="w-8 h-8" />} text="No online sessions scheduled yet." />
                ) : (
                  workspace.sessions.map((s) => (
                    <div key={s.id} className="bg-white rounded-2xl border border-sage-light/20 p-5 flex flex-wrap items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-brown-dark">{s.title}</p>
                        <p className="text-xs text-brown-light mt-1">
                          {fmtDateTime(s.startsAt)} · {s.durationMin} min
                          {s.status === 'live' && <span className="ml-2 text-red-500 font-bold">● LIVE</span>}
                        </p>
                        {s.description && <p className="text-sm text-brown mt-2">{s.description}</p>}
                      </div>
                      {s.meetingUrl ? (
                        <a
                          href={s.meetingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-sage text-brown-dark px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-sage-dark transition-colors inline-flex items-center gap-2"
                        >
                          <Video className="w-4 h-4" /> Join Class
                        </a>
                      ) : (
                        <span className="text-xs text-brown-light">Meeting link will be added by your teacher.</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {wsTab === 'announcements' && (
              <div className="space-y-4">
                {workspace.announcements.length === 0 ? (
                  <EmptyBox icon={<MessageSquareText className="w-8 h-8" />} text="No announcements yet." />
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => void markAnnouncementsRead(workspace.class.id)}
                      className="text-xs font-semibold text-sage-dark hover:underline cursor-pointer"
                    >
                      Mark all as read
                    </button>
                    {workspace.announcements.map((a) => (
                      <div
                        key={a.id}
                        className={`bg-white rounded-2xl border p-5 ${a.read ? 'border-sage-light/20' : 'border-sage/40 bg-sage-light/10'}`}
                      >
                        <p className="font-semibold text-brown-dark">
                          {!a.read && <span className="inline-block w-2 h-2 rounded-full bg-sage-dark mr-2 align-middle" aria-hidden="true" />}
                          {a.title}
                        </p>
                        <p className="text-xs text-brown-light mt-1">
                          {a.authorName ?? 'Teacher'} · {fmtDateTime(a.createdAt)}
                        </p>
                        <p className="text-sm text-brown mt-3 whitespace-pre-wrap leading-relaxed">{a.body}</p>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </LmsShell>
    )
  }

  // ————— داشبورد اصلی —————
  return (
    <LmsShell
      title={`${activeLabel}`}
      subtitle={
        section === 'overview'
          ? `Welcome back, ${userName.split(' ')[0]} — here is your learning overview.`
          : activeLabel
      }
      userName={userName}
      userEmail={user.email}
      roleLabel="Student"
      nav={nav}
      active={section}
      onNavigate={(key) => {
        if (key === 'profile') {
          window.location.href = '/account'
          return
        }
        if (key === 'support') {
          window.location.href = '/support'
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
          Could not load your dashboard right now — please refresh.
        </p>
      ) : !classes || classes.length === 0 ? (
        <div className="bg-white rounded-3xl border border-sage-light/20 shadow-lg p-10 text-center">
          <BookOpen className="w-12 h-12 text-sage-dark/50 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-brown-dark mb-2">No enrolled classes yet</h2>
          <p className="text-sm text-brown-light max-w-md mx-auto">
            Once you enroll in a class, it will appear here with materials, assignments and online sessions.
          </p>
          <Link href="/classes" className="mt-6 inline-flex items-center gap-2 bg-sage text-brown-dark px-6 py-3 rounded-xl text-sm font-bold hover:bg-sage-dark transition-colors">
            Browse Classes
          </Link>
        </div>
      ) : (
        <>
          {section === 'overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <StatCard icon={<BookOpen className="w-4 h-4" />} label="My classes" value={classes.length} />
                <StatCard icon={<BookOpenCheck className="w-4 h-4" />} label="Open assignments" value={pendingTotal} highlight={pendingTotal > 0} />
                <StatCard
                  icon={<MessageSquareText className="w-4 h-4" />}
                  label="Unread announcements"
                  value={classes.reduce((s, c) => s + (c.unreadAnnouncements ?? 0), 0)}
                />
              </div>
              <ClassCardList classes={classes} onOpen={openWorkspace} />
            </div>
          )}

          {section === 'classes' && <ClassCardList classes={classes} onOpen={openWorkspace} />}

          {section === 'assignments' && classes.length > 0 && (
            <p className="text-sm text-brown-light bg-white rounded-2xl border border-sage-light/20 p-6 mb-3">
              Pick a class to view and submit its assignments.
            </p>
          )}
          {section === 'assignments' && classes.length > 0 && (
            <div className="space-y-3">
              {classes.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSection('classes')
                    void openWorkspace(c.id)
                    setWsTab('assignments')
                  }}
                  className="w-full bg-white rounded-2xl border border-sage-light/20 p-5 flex items-center justify-between gap-3 hover:border-sage transition-colors cursor-pointer text-left"
                >
                  <span className="min-w-0">
                    <span className="block font-semibold text-brown-dark truncate">{c.title}</span>
                    <span className="block text-xs text-brown-light mt-1">{c.openAssignments} open assignment(s)</span>
                  </span>
                  <ChevronLeft className="w-4 h-4 rotate-180 text-brown-light flex-shrink-0" />
                </button>
              ))}
            </div>
          )}

          {section === 'grades' && <GradesView classes={classes} onOpenWorkspace={openWorkspace} />}

          {section === 'announcements' && (
            <div className="space-y-3">
              {classes.every((c) => (c.unreadAnnouncements ?? 0) === 0) && (
                <p className="text-sm text-brown-light bg-white rounded-2xl border border-sage-light/20 p-6 text-center">
                  You are all caught up — no unread announcements.
                </p>
              )}
              {classes.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    void openWorkspace(c.id)
                    setWsTab('announcements')
                  }}
                  className="w-full bg-white rounded-2xl border border-sage-light/20 p-5 flex items-center justify-between gap-3 hover:border-sage transition-colors cursor-pointer text-left"
                >
                  <span className="min-w-0">
                    <span className="block font-semibold text-brown-dark truncate">{c.title}</span>
                    <span className="block text-xs text-brown-light mt-1">
                      {(c.unreadAnnouncements ?? 0) > 0 ? `${c.unreadAnnouncements} unread announcement(s)` : 'All read'}
                    </span>
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

function StatCard({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`bg-white rounded-2xl border p-5 ${highlight ? 'border-sage/40' : 'border-sage-light/20'}`}>
      <div className="flex items-center gap-2 text-sage-dark mb-2">
        {icon}
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-extrabold text-brown-dark tabular-nums">{value}</p>
    </div>
  )
}

function EmptyBox({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="bg-white rounded-2xl border border-sage-light/20 p-10 text-center">
      <div className="flex justify-center text-sage-dark/50 mb-3">{icon}</div>
      <p className="text-sm text-brown-light">{text}</p>
    </div>
  )
}

function ClassCardList({ classes, onOpen }: { classes: ClassSummary[]; onOpen: (id: string) => void }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {classes.map((c) => (
        <div key={c.id} className="bg-white rounded-3xl border border-sage-light/20 overflow-hidden hover:border-sage/50 transition-colors">
          <div className="h-28 bg-gradient-to-br from-sage-light/50 via-butter/40 to-peach-light/50 relative">
            {c.image && (
               
              <img src={c.image} alt="" className="w-full h-full object-cover object-top" loading="lazy" />
            )}
          </div>
          <div className="p-5">
            <p className="font-bold text-brown-dark truncate">{c.title}</p>
            <p className="text-xs text-brown-light mt-1">
              {c.level}
              {c.teacherName ? ` · ${c.teacherName}` : ''}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-brown-light">
              <span>{c.materialCount} material(s)</span>
              <span className={c.openAssignments > 0 ? 'text-peach-dark font-semibold' : ''}>{c.openAssignments} open assignment(s)</span>
              {(c.unreadAnnouncements ?? 0) > 0 && <span className="text-sage-dark font-semibold">{c.unreadAnnouncements} new announcement(s)</span>}
            </div>
            {c.nextSessionAt && (
              <p className="text-xs text-sage-dark font-semibold mt-2 inline-flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5" /> Next: {c.nextSessionTitle ?? 'Session'} · {fmtDateTime(c.nextSessionAt)}
              </p>
            )}
            <button
              type="button"
              onClick={() => onOpen(c.id)}
              className="mt-4 w-full bg-sage text-brown-dark py-2.5 rounded-xl text-sm font-bold hover:bg-sage-dark transition-colors cursor-pointer"
            >
              Open Class
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function MaterialList({ materials }: { materials: Workspace['materials'] }) {
  if (materials.length === 0) {
    return <EmptyBox icon={<FileText className="w-8 h-8" />} text="No materials published yet — check back soon." />
  }
  const modules = Array.from(new Set(materials.map((m) => m.moduleLabel || 'General')))
  return (
    <div className="space-y-6">
      {modules.map((mod) => (
        <div key={mod}>
          <p className="text-xs font-bold uppercase tracking-wider text-brown-light mb-2">{mod}</p>
          <ul className="space-y-3">
            {materials
              .filter((m) => (m.moduleLabel || 'General') === mod)
              .map((m) => (
                <li key={m.id} className="bg-white rounded-2xl border border-sage-light/20 p-5">
                  <p className="font-semibold text-brown-dark">{m.title}</p>
                  {m.description && <p className="text-sm text-brown mt-1.5 whitespace-pre-wrap">{m.description}</p>}
                  <p className="text-[11px] text-brown-light mt-2">Posted {fmtDate(m.createdAt)}</p>
                  {m.files.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {m.files.map((f) => (
                        <li key={f.id}>
                          <a
                            href={`/api/lms/files/${f.id}`}
                            className="inline-flex items-center gap-2 text-sm text-sage-dark hover:underline"
                          >
                            <Download className="w-3.5 h-3.5" /> {f.name}
                            <span className="text-xs text-brown-light">({fmtBytes(f.size)})</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

function StudentAssignmentList({ workspace, onToast }: { workspace: Workspace; onToast: (m: string) => void }) {
  const [uploadFor, setUploadFor] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const start = (a: WorkspaceAssignment) => {
    setUploadFor(a.id)
    setNote(a.mySubmission?.note ?? '')
    setFiles([])
    setErr('')
  }
  const cancel = () => {
    setUploadFor(null)
    setNote('')
    setFiles([])
    setErr('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const submit = async (a: WorkspaceAssignment) => {
    if (busy) return
    if (files.length === 0 && !note.trim()) {
      setErr('Add a note or at least one file.')
      return
    }
    setBusy(true)
    setErr('')
    try {
      const fd = new FormData()
      fd.append('note', note.trim())
      files.forEach((f) => fd.append('files', f))
      const res = await fetch(`/api/homework/${encodeURIComponent(a.id)}/submit`, { method: 'POST', body: fd })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setErr(data?.error || 'Could not submit.')
        return
      }
      onToast('Homework submitted!')
      cancel()
      window.location.reload()
    } catch {
      setErr('Could not submit.')
    } finally {
      setBusy(false)
    }
  }

  if (workspace.assignments.length === 0) {
    return <EmptyBox icon={<BookOpenCheck className="w-8 h-8" />} text="No assignments in this class yet." />
  }
  return (
    <ul className="space-y-4">
      {workspace.assignments.map((a) => {
        const open = uploadFor === a.id
        const busy = uploadFor === `busy:${a.id}`
        const sub = a.mySubmission
        return (
          <li key={a.id} className="bg-white rounded-2xl border border-sage-light/20 p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-brown-dark">{a.title}</p>
                <p className="text-xs text-brown-light mt-1">
                  Posted {fmtDate(a.createdAt)}
                  {a.dueAt ? ` · Due ${fmtDateTime(a.dueAt)}` : ''} · Max score {a.maxScore}
                </p>
              </div>
              {sub ? (
                <StatusPill sub={sub} maxScore={a.maxScore} />
              ) : (
                <span className="text-[11px] font-bold text-brown bg-cream border border-sage-light/40 rounded-full px-3 py-1.5">Not submitted</span>
              )}
            </div>
            {a.description && <p className="text-sm text-brown mt-3 whitespace-pre-wrap leading-relaxed">{a.description}</p>}
            {a.files.length > 0 && (
              <ul className="mt-3 space-y-1">
                {a.files.map((f) => (
                  <li key={f.id}>
                    <a href={`/api/homework/files/${f.id}`} className="inline-flex items-center gap-2 text-sm text-sage-dark hover:underline">
                      <Download className="w-3.5 h-3.5" /> {f.name}
                      <span className="text-xs text-brown-light">({fmtBytes(f.size)})</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {sub?.feedback && sub.released && (
              <div className="mt-4 bg-sage-light/25 border border-sage/25 rounded-xl px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-sage-dark mb-1 flex items-center gap-1.5">
                  <MessageSquareText className="w-3 h-3" /> Teacher feedback
                </p>
                <p className="text-sm text-brown whitespace-pre-wrap">{sub.feedback}</p>
              </div>
            )}
            {sub?.status === 'RETURNED' && !open && (
              <button
                type="button"
                onClick={() => start(a)}
                className="mt-3 text-sm font-bold text-peach-dark hover:underline cursor-pointer"
              >
                Resubmit after revision →
              </button>
            )}

            {open || busy ? (
              <div className="mt-4 space-y-3">
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Optional note for your teacher…"
                  disabled={busy}
                  className="w-full px-4 py-3 rounded-xl border border-sage-light/40 bg-cream/50 text-brown text-sm focus:outline-none focus:border-sage resize-none"
                />
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  disabled={busy}
                  onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 5))}
                  className="block w-full text-xs text-brown-light file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sage-light/40 file:text-brown-dark cursor-pointer"
                />
                {err && <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{err}</p>}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void submit(a)}
                    disabled={busy}
                    className="bg-sage text-brown-dark px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-sage-dark transition-colors cursor-pointer disabled:opacity-60 inline-flex items-center gap-2"
                  >
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {busy ? 'Submitting…' : sub ? 'Update Submission' : 'Submit Homework'}
                  </button>
                  {!busy && (
                    <button type="button" onClick={cancel} className="px-4 py-2.5 rounded-xl text-sm font-medium text-brown-light hover:text-brown cursor-pointer">
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => start(a)}
                className="mt-4 bg-white border border-sage-light/50 text-brown-dark px-5 py-2.5 rounded-xl text-sm font-bold hover:border-sage transition-colors cursor-pointer"
              >
                {sub ? 'Update my submission' : 'Submit my homework'}
              </button>
            )}
            {sub && !open && (
              <p className="text-[11px] text-brown-light mt-3">Last submitted {fmtDateTime(sub.submittedAt)}</p>
            )}
          </li>
        )
      })}
    </ul>
  )
}

function GradesView({ classes, onOpenWorkspace }: { classes: ClassSummary[]; onOpenWorkspace: (id: string) => void }) {
  const [items, setItems] = useState<{ className: string; assignmentTitle: string; score: number | null; maxScore: number; feedback: string | null; status: string; releasedAt: string | null; assignmentId: string; classId: string }[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      const all: typeof items = []
      for (const c of classes) {
        try {
          const res = await fetch(`/api/lms/student/classes/${encodeURIComponent(c.id)}`, { cache: 'no-store' })
          if (!res.ok) continue
          const data = (await res.json()) as Workspace
          for (const a of data.assignments) {
            const sub = a.mySubmission
            if (sub && sub.released && (sub.score != null || sub.feedback)) {
              all.push({
                className: data.class.title,
                assignmentTitle: a.title,
                score: sub.score,
                maxScore: a.maxScore,
                feedback: sub.feedback,
                status: sub.status,
                releasedAt: null,
                assignmentId: a.id,
                classId: c.id,
              })
            }
          }
        } catch {
          /* یک کلاس شکست خورد — بقیه ادامه می‌دهند */
        }
      }
      if (alive) setItems(all)
      if (alive) setLoading(false)
    })()
    return () => {
      alive = false
    }
  }, [classes])

  if (loading) {
    return <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-sage-dark" /></div>
  }
  if (!items || items.length === 0) {
    return <EmptyBox icon={<GraduationCap className="w-8 h-8" />} text="No released grades or feedback yet." />
  }
  return (
    <ul className="space-y-3">
      {items.map((g, i) => (
        <li key={i} className="bg-white rounded-2xl border border-sage-light/20 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-brown-dark truncate">{g.assignmentTitle}</p>
              <p className="text-xs text-brown-light mt-0.5">{g.className}</p>
            </div>
            {g.score != null && (
              <span className="text-lg font-extrabold text-sage-dark tabular-nums">
                {g.score}
                <span className="text-xs font-semibold text-brown-light">/{g.maxScore}</span>
              </span>
            )}
          </div>
          {g.feedback && <p className="text-sm text-brown mt-2 whitespace-pre-wrap">{g.feedback}</p>}
          <button
            type="button"
            onClick={() => {
              onOpenWorkspace(g.classId)
            }}
            className="mt-2 text-xs font-semibold text-sage-dark hover:underline cursor-pointer"
          >
            Open assignment
          </button>
        </li>
      ))}
    </ul>
  )
}
