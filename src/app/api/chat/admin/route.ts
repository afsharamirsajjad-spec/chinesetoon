import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { isAuthorized, getAdminActor } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/audit'

// ---------------------------------------------------------------------------
// 💬 /api/chat/admin — پشتیبانی لحظه‌ای (سمت پنل ادمین)
//
// GET            فهرست نشست‌های فعال: آخرین پیام هر نشست + شمارندهٔ پیام‌های
//                «بی‌پاسخ و دیده‌نشده». unread = پیام‌های کاربر بعد از آخرین
//                reply ادمین «و» بعد از آخرین بازدید ادمین از همان نشست —
//                یعنی با خواندن رشته، نوتیفیکیشن پاک می‌شود.
// GET ?session=  رشتهٔ کامل یک نشست (هر دو نقش، صعودی، سقف ۲۰۰).
// POST           {session, text} → پاسخ ادمین (role=admin).
// POST           {session, markSeen: true} → ثبت زمانِ آخرین بازدید ادمین از
//                نشست (در SiteSetting 'adminChatSeen') — نوتیفیکیشن همان نشست
//                پاک می‌شود.
// ---------------------------------------------------------------------------

export const dynamic = 'force-dynamic'

const SESSION_RE = /^[a-zA-Z0-9-]{8,64}$/

const replySchema = z.object({
  session: z.string().regex(SESSION_RE),
  text: z.string().trim().min(1).max(2000),
})

const seenSchema = z.object({
  session: z.string().regex(SESSION_RE),
  markSeen: z.literal(true),
})

// 🗺️ زمان آخرین بازدید ادمین از هر نشست — SiteSetting 'adminChatSeen'
const SEEN_KEY = 'adminChatSeen'
const SEEN_MAP_MAX = 200

type SeenMap = Record<string, string> // session → ISO timestamp

async function loadSeenMap(): Promise<SeenMap> {
  try {
    const row = await db.siteSetting.findUnique({ where: { key: SEEN_KEY } })
    if (!row) return {}
    const parsed = JSON.parse(row.value) as SeenMap
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return parsed
  } catch {
    return {}
  }
}

async function saveSeenMap(map: SeenMap): Promise<void> {
  // 🧹 سقف اندازه — قدیمی‌ترین نشست‌ها حذف می‌شوند
  const entries = Object.entries(map)
    .sort((a, b) => String(b[1]).localeCompare(String(a[1])))
    .slice(0, SEEN_MAP_MAX)
  const value = JSON.stringify(Object.fromEntries(entries))
  await db.siteSetting.upsert({
    where: { key: SEEN_KEY },
    create: { key: SEEN_KEY, value },
    update: { value },
  })
}

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
    const [rows, seenMap] = await Promise.all([
      db.liveChatMessage.findMany({
        orderBy: { createdAt: 'desc' },
        take: 500,
        select: { id: true, session: true, role: true, body: true, createdAt: true },
      }),
      loadSeenMap(),
    ])

    interface Thread {
      session: string
      lastBody: string
      lastRole: string
      lastAt: string
      unread: number
      lastAdminReplyAt: string | null
    }
    const threads = new Map<string, Thread>()
    for (const r of rows) {
      const existing = threads.get(r.session)
      if (!existing) {
        threads.set(r.session, {
          session: r.session,
          lastBody: r.body,
          lastRole: r.role,
          lastAt: r.createdAt.toISOString(),
          unread: 0,
          lastAdminReplyAt: null,
        })
      } else if (r.role === 'admin' && (existing.lastAdminReplyAt === null || r.createdAt.toISOString() > existing.lastAdminReplyAt)) {
        // ردیف‌ها نزولی‌اند؛ اولین admin دیده‌شده = آخرین reply
        existing.lastAdminReplyAt = r.createdAt.toISOString()
      }
    }
    // شمارش unread: پیام‌های کاربر بعد از آخرین reply ادمین «و» بعد از آخرین بازدید
    const cutoffs = new Map<string, number>()
    for (const [session, t] of threads) {
      const seenAt = seenMap[session] ? Date.parse(seenMap[session]) : 0
      const replyAt = t.lastAdminReplyAt ? Date.parse(t.lastAdminReplyAt) : 0
      cutoffs.set(session, Math.max(seenAt, replyAt))
    }
    for (const r of rows) {
      if (r.role !== 'user') continue
      const cutoff = cutoffs.get(r.session)
      if (cutoff !== undefined && r.createdAt.getTime() > cutoff) {
        const t = threads.get(r.session)
        if (t) t.unread += 1
      }
    }

    const list = [...threads.values()]
      .map(({ lastAdminReplyAt: _drop, ...t }) => t)
      .sort((a, b) => b.lastAt.localeCompare(a.lastAt))
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
    const body = await req.json().catch(() => null)

    // 🫧 علامت‌گذاری «دیده‌شدن» یک نشست — نوتیفیکیشنش پاک می‌شود
    const seen = seenSchema.safeParse(body)
    if (seen.success) {
      const map = await loadSeenMap()
      map[seen.data.session] = new Date().toISOString()
      await saveSeenMap(map)
      return NextResponse.json({ ok: true })
    }

    const parsed = replySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid reply' }, { status: 400 })
    }
    const created = await db.liveChatMessage.create({
      data: { session: parsed.data.session, role: 'admin', body: parsed.data.text },
      select: { id: true, role: true, body: true, createdAt: true },
    })
    const actor = await getAdminActor(req)
    logAdminAction({
      actor,
      action: 'chat.reply',
      targetType: 'liveChat',
      targetId: parsed.data.session,
      meta: {},
    })
    return NextResponse.json({ ok: true, message: created }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/chat/admin] error:', err)
    return NextResponse.json({ error: 'Could not send the reply — try again.' }, { status: 500 })
  }
}
