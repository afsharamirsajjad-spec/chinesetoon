// ---------------------------------------------------------------------------
// 🔔 اعلان‌های LMS — fire-and-forget برای همهٔ ثبت‌نام‌شده‌های یک کلاس
// (روی سیستم واحد ScheduleNotification با category='lms')
// ---------------------------------------------------------------------------

import { db } from '@/lib/db'
import { notifyUser } from '@/lib/notifications'

export async function notifyEnrolledStudents(
  classId: string,
  input: { kind: string; title: string; body: string }
): Promise<void> {
  try {
    const students = await db.classEnrollment.findMany({
      where: { classId },
      select: { userId: true },
    })
    for (const s of students) {
      notifyUser({
        userId: s.userId,
        category: 'lms',
        kind: input.kind,
        title: input.title,
        body: input.body,
      })
    }
  } catch (e) {
    console.error('[notifyEnrolledStudents] failed:', e instanceof Error ? e.message : e)
  }
}
