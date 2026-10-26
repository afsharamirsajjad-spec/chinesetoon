// ---------------------------------------------------------------------------
// 🧭 /api/practice/progress — ثبت و خواندن پیشرفت تمرین (Practice Hub)
//
// POST { activity }  → یک رویداد شروع فعالیت برای کاربر واردشده ثبت می‌کند.
//   • احراز هویت اجباری (مهمان: 401 — کلاینت بی‌صدا رد می‌شود)
//   • activityKey در برابر رجیستری سمت سرور اعتبارسنجی می‌شود (ضد کلید جعلی)
//   • rate limit + گارد هم‌مبدأ — هم‌قرارداد با بقیهٔ APIهای mutation
//
// GET → خلاصهٔ پیشرفت کاربر واردشده (مهمان: { authenticated:false }):
//   • todayCount / goal (هدف روزانه = ۳ فعالیت، ثابت و شفاف)
//   • streak — روزهای متوالی با حداقل یک فعالیت، مرز روز = UTC
//     (قاعده: اگر امروز فعالیت نبود، زنجیره از دیروز شمرده می‌شود)
//   • doneToday (کلیدهای انجام‌شدهٔ امروز) + recent (۵ فعالیت آخر، بی‌تکرار)
//   • totals — شمار هر فعالیت در ۳۰ روز اخیر
//
// مالکیت: همهٔ کوئری‌ها با userId نشست فعلی فیلتر می‌شوند — کاربر هرگز
// به پیشرفت کاربر دیگر دسترسی ندارد و هیچ امتیازی از کلاینت پذیرفته نمی‌شود.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimit, tooManyRequests } from '@/lib/rate-limit'
import { getUserFromRequest } from '@/lib/user-auth'
import { guardResponse } from '@/lib/http-guard'
import { db } from '@/lib/db'
import { isKnownActivity, PRACTICE_ACTIVITIES } from '@/lib/practice/registry'

export const dynamic = 'force-dynamic'

const DAILY_GOAL = 3
const WINDOW_DAYS = 30

const postSchema = z.object({
  activity: z.string().trim().min(1).max(40),
})

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

export async function POST(req: NextRequest) {
  // ۶۰ ثبت در ساعت برای هر IP — ثبت فعالیت هرگز نباید بتواند آشغال‌سازی کند
  const rl = await rateLimit('practice-progress', req, 60, 3600, 3600)
  if (!rl.ok) return tooManyRequests(rl)
  const guard = guardResponse(req)
  if (guard) return guard

  const user = await getUserFromRequest(req)
  if (!user) {
    // مهمان — کلاینت بی‌صدا رد می‌کند؛ پیشرفت فقط با حساب ذخیره می‌شود
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  // 🔒 کلید فعالیت باید در رجیستری واقعی باشد — نه هر رشته‌ای از کلاینت
  if (!isKnownActivity(parsed.data.activity)) {
    return NextResponse.json({ error: 'Unknown activity' }, { status: 400 })
  }

  try {
    await db.practiceEvent.create({
      data: { userId: user.id, activityKey: parsed.data.activity },
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[POST /api/practice/progress] error:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Could not save progress' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) {
    return NextResponse.json({ authenticated: false, goal: DAILY_GOAL })
  }

  try {
    const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000)
    const events = await db.practiceEvent.findMany({
      where: { userId: user.id, createdAt: { gte: since } },
      select: { activityKey: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 1000, // 🛡️ سقف دفاعی — پاسخ هرگز بی‌کران نیست
    })

    const todayStart = startOfUtcDay(new Date())
    const todayCount = events.filter((e) => e.createdAt >= todayStart).length

    // 🔥 استریک — روزهای متوالی (UTC) با حداقل یک فعالیت
    const dayKeys = new Set(
      events.map((e) => startOfUtcDay(e.createdAt).getTime())
    )
    let streak = 0
    let cursor = todayStart.getTime()
    if (!dayKeys.has(cursor)) cursor -= 24 * 60 * 60 * 1000 // امروز خالی → از دیروز
    while (dayKeys.has(cursor)) {
      streak++
      cursor -= 24 * 60 * 60 * 1000
    }

    // 🕘 آخرین فعالیت هر نوع (مرتب بر اساس تازگی، حداکثر ۵ نوع)
    const recent: Array<{ activityKey: string; at: string }> = []
    const seenRecent = new Set<string>()
    for (const e of events) {
      if (seenRecent.has(e.activityKey)) continue
      seenRecent.add(e.activityKey)
      recent.push({ activityKey: e.activityKey, at: e.createdAt.toISOString() })
      if (recent.length >= 5) break
    }

    const doneToday = Array.from(
      new Set(events.filter((e) => e.createdAt >= todayStart).map((e) => e.activityKey))
    )
    const totals: Record<string, number> = {}
    for (const e of events) totals[e.activityKey] = (totals[e.activityKey] ?? 0) + 1

    return NextResponse.json({
      authenticated: true,
      user: { firstName: user.firstName, lastName: user.lastName },
      goal: DAILY_GOAL,
      todayCount,
      streak,
      doneToday,
      recent,
      totals,
    })
  } catch (e) {
    console.error('[GET /api/practice/progress] error:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Could not load progress' }, { status: 500 })
  }
}

// 📤 برای کامپوننت هاب — ثابت هدف روزانه از همین‌جا export نمی‌شود (سرور-only)؛
// مقدار goal در پاسخ GET می‌آید. PRACTICE_ACTIVITIES فقط برای تایپ‌چک متادیتای
// کلیدها استفاده شده و کلاینت رجیستری را مستقیم ایمپورت می‌کند (بدون راز).
void PRACTICE_ACTIVITIES
