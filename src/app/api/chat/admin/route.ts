import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { isAuthorized } from '@/lib/admin-auth'

// ---------------------------------------------------------------------------
// 💬 /api/chat/admin — پشتیبانی لحظه‌ای (سمت پنل ادمین)
//
// GET            فهرست نشست‌های فعال: آخرین پیام هر نشست + شمارندهٔ پیام‌های
//                بی‌پاسخ (user message بعد از آخرین reply ادمین).
// GET ?session=  رشتهٔ کامل یک نشست (هر دو نقش، صعودی، سقف ۲۰۰).
// POST           {session, text} → پاسخ ادمین (role=admin).
// ---------------------------------------------------------------------------

export const dynamic = 'force-dynamic'

const SESSION_RE = /^[a-zA-Z0-9-]{8,64}$/

const replySchema = z.object({
  session: z.string().regex(SESSION_RE),
  text: z.string().trim().min(1).max(2000),
})

export async function GET(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const session = req.nextUrl.searchParams.get('session') ?? ''
    if (session) {
      if (!SESSION_RE.test(session)) {
        return NextResponse.json({ messages: [] })
      }
      const messages = await db.liveChatMessage.findMany({
        where: { session },
        orderBy: { createdAt: 'asc' },
        take: 200,
        select: { id: true, role: true, body: true, createdAt: true },
      })
      return NextResponse.json({ messages })
    }

    // فهرست نشست‌ها — از آخرین ۵۰۰ پیام reduces می‌شود (سایت کوچک تا مدت‌ها کافی است)
    const rows = await db.liveChatMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
      select: { id: true, session: true, role: true, body: true, createdAt: true },
    })
    const threads = new Map<
      string,
      { session: string; lastBody: string; lastRole: string; lastAt: string; unread: number }
    >()
    for (const r of rows) {
      const existing = threads.get(r.session)
      if (!existing) {
        threads.set(r.session, {
          session: r.session,
          lastBody: r.body,
          lastRole: r.role,
          lastAt: r.createdAt.toISOString(),
          unread: 0,
        })
      }
      // unread = پیام‌های کاربر بعد از آخرین پاسخ ادمین (رشته‌ها desc است؛
      // اولین admin دیده‌شده = آخرین reply؛ پیام‌های user قبل از آن شمرده می‌شوند)
      if (existing && r.role === 'user' && existing.lastRole === 'admin') {
        existing.unread += 1
      } else if (existing && existing.lastRole === 'user') {
        existing.unread += r.role === 'user' ? 1 : 0
      }
    }
    const list = [...threads.values()].sort((a, b) => b.lastAt.localeCompare(a.lastAt))
    return NextResponse.json({ threads: list })
  } catch (err) {
    console.error('[GET /api/chat/admin] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const parsed = replySchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid reply' }, { status: 400 })
    }
    const created = await db.liveChatMessage.create({
      data: { session: parsed.data.session, role: 'admin', body: parsed.data.text },
      select: { id: true, role: true, body: true, createdAt: true },
    })
    return NextResponse.json({ ok: true, message: created }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/chat/admin] error:', err)
    return NextResponse.json({ error: 'Could not send the reply — try again.' }, { status: 500 })
  }
}
