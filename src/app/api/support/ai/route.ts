// ---------------------------------------------------------------------------
// 🤖 /api/support/ai — public AI assistant endpoint (Part 1)
//
// GET  → status for the widget: { enabled, configured, welcomeMessage,
//        fallbackMessage } — never any credentials.
// POST { messages }    → one AI reply for the conversation so far.
//   • rate-limited (20 requests / 5 min / IP) — AI calls cost real money
//   • conversation context preserved client-side (last 16 turns forwarded)
//   • disabled/unconfigured → 503 UNAVAILABLE with the fallback message;
//     provider failures → 502 with an honest message. No fake replies ever.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimit, tooManyRequests } from '@/lib/rate-limit'
import { guardResponse } from '@/lib/http-guard'
import {
  loadAiSettings,
  aiPublicView,
  callAiChat,
  AiUnavailableError,
  AiProviderError,
  type AiChatMessage,
} from '@/lib/ai-assistant'

export const dynamic = 'force-dynamic'

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(4000),
})

const postSchema = z.object({
  messages: z.array(messageSchema).min(1).max(24),
})

export async function GET(req: NextRequest) {
  try {
    const settings = await loadAiSettings()
    return NextResponse.json(aiPublicView(settings))
  } catch (err) {
    console.error('[GET /api/support/ai] error:', err)
    return NextResponse.json({ enabled: false, configured: false })
  }
}

export async function POST(req: NextRequest) {
  const guard = guardResponse(req)
  if (guard) return guard
  const rl = await rateLimit('ai-support', req, 20, 300, 300)
  if (!rl.ok) return tooManyRequests(rl)

  const body = await req.json().catch(() => null)
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid messages payload' }, { status: 400 })
  }

  const settings = await loadAiSettings()
  if (!settings.enabled || !settings.apiKey) {
    return NextResponse.json(
      { error: settings.fallbackMessage, code: 'UNAVAILABLE' },
      { status: 503 }
    )
  }

  // keep the last 16 turns + drop oversized content defensively
  const messages: AiChatMessage[] = parsed.data.messages.slice(-16).map((m) => ({
    role: m.role,
    content: m.content.slice(0, 4000),
  }))
  if (!messages.some((m) => m.role === 'user')) {
    return NextResponse.json({ error: 'Invalid messages payload' }, { status: 400 })
  }

  try {
    const result = await callAiChat(settings, messages)
    return NextResponse.json({ reply: result.reply, model: result.model })
  } catch (err) {
    if (err instanceof AiUnavailableError) {
      return NextResponse.json({ error: settings.fallbackMessage, code: 'UNAVAILABLE' }, { status: 503 })
    }
    if (err instanceof AiProviderError) {
      return NextResponse.json({ error: err.message, code: 'PROVIDER' }, { status: 502 })
    }
    console.error('[POST /api/support/ai] error:', err)
    return NextResponse.json({ error: settings.fallbackMessage, code: 'PROVIDER' }, { status: 502 })
  }
}
