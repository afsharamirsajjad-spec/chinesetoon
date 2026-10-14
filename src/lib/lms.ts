// ---------------------------------------------------------------------------
// 🎓 LMS — کمکی‌های احراز نقش و دسترسی کلاس
//
// نقش‌ها: کاربرِ واردشده (سشن کوکی) با role = 'teacher' دسترسی استاد دارد؛
// ادمین سیستم سشن جداگانه (x-admin-key) دارد و در LMS «دید کامل» دارد.
// اصول: هر مسیر API خودش دسترسی را سمت سرور چک می‌کند — هیچ claim از کلاینت
// باور نمی‌شود (ضد IDOR).
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/user-auth'
import { isAuthorized } from '@/lib/admin-auth'

export interface LmsViewer {
  user: {
    id: string
    role: string
    firstName: string
    lastName: string
    email: string
  } | null
  isAdmin: boolean
}

/** کاربر واردشده + وضعیت ادمین — پایهٔ همهٔ گیت‌های LMS */
export async function getLmsViewer(req: NextRequest): Promise<LmsViewer> {
  const user = await getUserFromRequest(req).catch(() => null)
  let isAdmin = false
  try {
    isAdmin = await isAuthorized(req)
  } catch {
    isAdmin = false
  }
  return {
    user: user
      ? {
          id: user.id,
          role: user.role ?? 'student',
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        }
      : null,
    isAdmin,
  }
}

/** آیا این کاربر «استاد» است؟ (ادمین هم همهٔ اختیارات استاد را دارد) */
export function isTeacher(viewer: LmsViewer): boolean {
  return viewer.isAdmin || viewer.user?.role === 'teacher'
}

/**
 * گارد استادِ کلاس — ادمین: همهٔ کلاس‌ها؛ استاد: فقط کلاس‌های assigned به خودش.
 * خروجی: classId معتبر یا null (دسترسی نیست).
 */
export async function teacherClassGuard(viewer: LmsViewer, classId: string): Promise<string | null> {
  if (!classId) return null
  if (viewer.isAdmin) return classId
  if (viewer.user?.role !== 'teacher') return null
  const klass = await db.courseClass.findUnique({
    where: { id: classId },
    select: { teacherId: true },
  })
  return klass?.teacherId === viewer.user.id ? classId : null
}

/** نام نمایشی کاربر */
export function displayName(u: { firstName: string; lastName: string; email: string }): string {
  return [u.firstName, u.lastName].map((s) => (s || '').trim()).filter(Boolean).join(' ') || u.email.split('@')[0]
}
