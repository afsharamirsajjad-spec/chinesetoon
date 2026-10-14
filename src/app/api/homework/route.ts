// ---------------------------------------------------------------------------
// 📚 /api/homework — تکالیف از دید دانش‌پذیرِ واردشده
//
//   GET — تکالیف فعال (غیرآرشیو) + وضعیت پاسخ خودِ کاربر برای هر تکلیف
//         (یادداشت/فایل‌ها/بازخورد استاد). مهمان → 401.
// POST /api/homework/[id]/submit — ارسال/به‌روزرسانی پاسخ (FormData: note, files)
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/user-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req).catch(() => null)
  if (!user) {
    return NextResponse.json({ error: 'Please sign in to view homework', code: 'AUTH_REQUIRED' }, { status: 401 })
  }
  try {
    const rows = await db.homework.findMany({
      where: {
        archived: false,
        // 🎓 تکالیفِ متصل به کلاس فقط برای ثبت‌نام‌شده‌های همان کلاس
        OR: [{ classId: null }, { class: { enrollments: { some: { userId: user.id } } } }],
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        class: { select: { title: true, slug: true } },
        files: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, name: true, mime: true, size: true, createdAt: true },
        },
        submissions: {
          where: { userId: user.id },
          take: 1,
          include: {
            files: {
              orderBy: { createdAt: 'asc' },
              select: { id: true, name: true, mime: true, size: true, createdAt: true },
            },
          },
        },
      },
    })
    const items = rows.map((h) => {
      const sub = h.submissions[0] ?? null
      return {
        id: h.id,
        title: h.title,
        description: h.description,
        className: h.className,
        dueAt: h.dueAt?.toISOString() ?? null,
        maxScore: h.maxScore,
        classTitle: h.class?.title ?? null,
        createdAt: h.createdAt.toISOString(),
        files: h.files,
        mySubmission: sub
          ? {
              id: sub.id,
              note: sub.note,
              // 🎓 نمره/بازخورد فقط بعد از release استاد پیدا است
              released: sub.releasedAt != null,
              score: sub.releasedAt ? sub.score : null,
              status: sub.status,
              feedback: sub.releasedAt ? sub.feedback : null,
              feedbackAt: sub.feedbackAt?.toISOString() ?? null,
              submittedAt: sub.updatedAt.toISOString(),
              files: sub.files,
            }
          : null,
      }
    })
    return NextResponse.json({ homework: items })
  } catch (e) {
    console.error('[GET /api/homework] error:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
