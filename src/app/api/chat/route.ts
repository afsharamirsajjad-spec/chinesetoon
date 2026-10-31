import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { rateLimit, tooManyRequests } from '@/lib/rate-limit'
import { guardResponse } from '@/lib/http-guard'

// ---------------------------------------------------------------------------
// 💬 /api/chat — پشتیبانی لحظه‌ای (سمت بازدیدکننده، بدون حساب)
//
// POST {session, text}: پیام بازدیدکننده ثبت می‌شود (role=user).
// GET  ?session=&after=<ISO>: polling رشتهٔ پیام‌های همین نشست (هر دو نقش)
//      بعد از لحظهٔ مشخص — ویجت هر چند ثانیه صدا می‌زند.
//
// امنیت: session توکن تصادفی کلاینت است (فرمت اعتبارسنجی می‌شود)؛ متن کوتاه
// و پاک‌سازی‌شده؛ rate-limit جدا برای ارسال و polling؛ پاسخ‌ها فقط برای
// همان session — هیچ نشست دیگری قابل خواندن نیست.
// ---------------------------------------------------------------------------

export const dynamic = 'force-dynamic'

const SESSION_RE = /^[a-zA-Z0-9-]{8,64}$/

const sendSchema = z.object({
  session: z.string().regex(SESSION_RE),
  text: z.string().trim().min(1).max(2000),
})

export async function POST(req: NextRequest) {
  const guard = guardResponse(req)
  if (guard) return guard
  const rl = await rateLimit('chat-send', req, 15, 600, 600)
  if (!rl.ok) return tooManyRequests(rl)
  try {
    const parsed = sendSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 })
    }
    const { session, text } = parsed.data
    const created = await db.liveChatMessage.create({
      data: { session, role: 'user', body: text },
      select: { id: true, role: true, body: true, createdAt: true },
    })
    return NextResponse.json({ ok: true, message: created }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/chat] error:', err)
    return NextResponse.json({ error: 'Could not send the message — try again.' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const rl = await rateLimit('chat-poll', req, 120, 300, 300)
  if (!rl.ok) return tooManyRequests(rl)
  try {
    const session = req.nextUrl.searchParams.get('session') ?? ''
    const after = req.nextUrl.searchParams.get('after') ?? ''
    if (!SESSION_RE.test(session)) {
      return NextResponse.json({ messages: [] })
    }
    const afterDate = after ? new Date(after) : null
    const rows = await db.liveChatMessage.findMany({
      where: {
        session,
        ...(afterDate && !Number.isNaN(afterDate.getTime())
          ? { createdAt: { gt: afterDate } }
          : {}),
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
      select: { id: true, role: true, body: true, createdAt: true },
    })
    return NextResponse.json({ messages: rows })
  } catch (err) {
    console.error('[GET /api/chat] error:', err)
    return NextResponse.json({ messages: [] })
  }
}
