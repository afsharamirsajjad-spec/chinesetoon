'use client'

// ---------------------------------------------------------------------------
// 🎓 کارت مدیریت LMS در تب Students پنل ادمین:
//   ۱) تعیین/لغو نقش «استاد» برای کاربران
//   ۲) اتصال استاد به کلاس
//   ۳) ثبت‌نام/حذف دانش‌پذیر در کلاس (همان API استاد با سشن ادمین)
// ---------------------------------------------------------------------------

import { useEffect, useState } from 'react'
import { GraduationCap, Loader2, UserPlus, UserMinus, UserRoundCog } from 'lucide-react'

interface StudentRowLike {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role?: string
}

const inputCls =
  'w-full bg-white border border-sage-light/40 rounded-xl px-3.5 py-2.5 text-sm text-brown-dark focus:outline-none focus:ring-2 focus:ring-sage/40 focus:border-sage transition-colors'

export function AdminLmsPanel({ token, students }: { token: string; students: StudentRowLike[] }) {
  const [classes, setClasses] = useState<{ id: string; title: string }[]>([])
  const [teacherEmail, setTeacherEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgOk, setMsgOk] = useState(false)
  const [classId, setClassId] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [enrollEmail, setEnrollEmail] = useState('')

  const teachers = students.filter((s) => s.role === 'teacher')

  useEffect(() => {
    let alive = true
    fetch('/api/admin/classes', { headers: { 'x-admin-key': token }, cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { classes?: { id: string; title: string }[] } | null) => {
        if (alive && d?.classes) setClasses(d.classes)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [token])

  const flash = (m: string, ok = true) => {
    setMsg(m)
    setMsgOk(ok)
    setTimeout(() => setMsg(''), 4000)
  }

  const setRole = async (role: 'teacher' | 'student') => {
    const email = teacherEmail.trim().toLowerCase()
    const target = students.find((s) => s.email.toLowerCase() === email)
    if (!target) {
      flash('No registered account with this email in the loaded students list.', false)
      return
    }
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(target.id)}`, {
        method: 'PATCH',
        headers: { 'x-admin-key': token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        flash(data?.error || 'Could not update the role.', false)
        return
      }
      flash(`Role updated: ${email} is now a ${role}.`)
      setTeacherEmail('')
      window.location.reload()
    } catch {
      flash('Could not update the role.', false)
    } finally {
      setBusy(false)
    }
  }

  const assignTeacher = async () => {
    if (!classId || !teacherId) {
      flash('Pick a class and a teacher.', false)
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/lms/admin/class-teacher', {
        method: 'POST',
        headers: { 'x-admin-key': token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId, teacherId }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        flash(data?.error || 'Could not assign the teacher.', false)
        return
      }
      flash('Teacher assigned to the class.')
    } catch {
      flash('Could not assign the teacher.', false)
    } finally {
      setBusy(false)
    }
  }

  const enroll = async (action: 'enroll' | 'unenroll') => {
    const email = enrollEmail.trim().toLowerCase()
    if (!classId || !email) {
      flash('Pick a class and enter the student email.', false)
      return
    }
    const target = students.find((s) => s.email.toLowerCase() === email)
    if (!target) {
      flash('No registered account with this email in the loaded students list.', false)
      return
    }
    setBusy(true)
    try {
      const res = await fetch(`/api/teacher/classes/${encodeURIComponent(classId)}`, {
        method: 'POST',
        headers: { 'x-admin-key': token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...(action === 'enroll' ? { userId: target.id } : {}) }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        flash(data?.error || 'Could not update enrollment.', false)
        return
      }
      flash(action === 'enroll' ? 'Student enrolled in the class.' : 'Student removed from the class.')
      setEnrollEmail('')
    } catch {
      flash('Could not update enrollment.', false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mb-5 bg-white rounded-2xl border border-sage-light/20 p-5">
      <p className="text-sm font-bold text-brown-dark mb-1 flex items-center gap-2">
        <GraduationCap className="w-4 h-4 text-sage-dark" /> LMS Management
      </p>
      <p className="text-xs text-brown-light mb-4">
        Teacher dashboards live at <span className="font-mono">/teacher</span>; student dashboards at{' '}
        <span className="font-mono">/student</span>. Search uses the loaded students list below.
      </p>

      <div className="grid md:grid-cols-3 gap-5">
        {/* ۱ — نقش استاد */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brown-light mb-2 flex items-center gap-1.5">
            <UserRoundCog className="w-3.5 h-3.5" /> Teacher role
          </p>
          <input
            type="email"
            value={teacherEmail}
            onChange={(e) => setTeacherEmail(e.target.value)}
            placeholder="user@email.com"
            className={inputCls}
            dir="ltr"
          />
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => void setRole('teacher')}
              disabled={busy || !teacherEmail.trim()}
              className="flex-1 bg-sage text-brown-dark px-3 py-2 rounded-xl text-xs font-bold hover:bg-sage-dark transition-colors cursor-pointer disabled:opacity-60"
            >
              Make Teacher
            </button>
            <button
              type="button"
              onClick={() => void setRole('student')}
              disabled={busy || !teacherEmail.trim()}
              className="flex-1 bg-cream border border-sage-light/40 text-brown px-3 py-2 rounded-xl text-xs font-bold hover:border-sage transition-colors cursor-pointer disabled:opacity-60"
            >
              Revoke
            </button>
          </div>
          <p className="text-[11px] text-brown-light mt-2">{teachers.length} teacher(s) active.</p>
        </div>

        {/* ۲ — استادِ کلاس */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brown-light mb-2 flex items-center gap-1.5">
            <UserPlus className="w-3.5 h-3.5" /> Class teacher
          </p>
          <select className={inputCls} value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">Select class…</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          <select className={`${inputCls} mt-2`} value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
            <option value="">Select teacher…</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {[t.firstName, t.lastName].filter(Boolean).join(' ')} ({t.email})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void assignTeacher()}
            disabled={busy || !classId || !teacherId}
            className="mt-2 w-full bg-sage text-brown-dark px-3 py-2 rounded-xl text-xs font-bold hover:bg-sage-dark transition-colors cursor-pointer disabled:opacity-60"
          >
            Assign to Class
          </button>
        </div>

        {/* ۳ — ثبت‌نام دانش‌پذیر */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brown-light mb-2 flex items-center gap-1.5">
            <UserPlus className="w-3.5 h-3.5" /> Enrollment
          </p>
          <select className={inputCls} value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">Select class…</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          <input
            type="email"
            value={enrollEmail}
            onChange={(e) => setEnrollEmail(e.target.value)}
            placeholder="student@email.com"
            className={`${inputCls} mt-2`}
            dir="ltr"
          />
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => void enroll('enroll')}
              disabled={busy || !classId || !enrollEmail.trim()}
              className="flex-1 bg-sage text-brown-dark px-3 py-2 rounded-xl text-xs font-bold hover:bg-sage-dark transition-colors cursor-pointer disabled:opacity-60 inline-flex items-center justify-center gap-1"
            >
              <UserPlus className="w-3 h-3" /> Enroll
            </button>
            <button
              type="button"
              onClick={() => void enroll('unenroll')}
              disabled={busy || !classId || !enrollEmail.trim()}
              className="flex-1 bg-cream border border-sage-light/40 text-brown px-3 py-2 rounded-xl text-xs font-bold hover:border-sage transition-colors cursor-pointer disabled:opacity-60 inline-flex items-center justify-center gap-1"
            >
              <UserMinus className="w-3 h-3" /> Remove
            </button>
          </div>
        </div>
      </div>

      {msg && (
        <p
          className={`mt-4 text-sm rounded-xl px-4 py-2.5 border ${
            msgOk ? 'text-sage-dark bg-sage-light/20 border-sage/30' : 'text-red-500 bg-red-50 border-red-100'
          }`}
          role="status"
        >
          {msg}
        </p>
      )}
      {busy && <Loader2 className="w-4 h-4 animate-spin text-sage-dark mt-2" />}
    </div>
  )
}
