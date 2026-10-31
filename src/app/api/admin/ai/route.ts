// ---------------------------------------------------------------------------
// 🤖 /api/admin/ai — AI Assistant settings (admin only, Part 1.3)
//
// GET   → masked settings view (the raw API key NEVER leaves the server)
// PUT   → save settings. Rules for the key field:
//           • apiKey omitted or ""  → keep the stored key
//           • apiKey "-"            → clear the stored key
//           • anything else         → replace with the new key
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isAuthorized, getAdminActor } from '@/lib/admin-auth'
import { isSameOrigin } from '@/lib/http-guard'
import { logAdminAction } from '@/lib/audit'
import {
  loadAiSettings,
  saveAiSettings,
  aiMaskedView,
} from '@/lib/ai-assistant'

export const dynamic = 'force-dynamic'

const putSchema = z.object({
  enabled: z.boolean().optional(),
  baseUrl: z.string().trim().max(300).optional(),
  apiKey: z.string().max(300).optional(),
  model: z.string().trim().max(120).optional(),
  systemPrompt: z.string().max(6000).optional(),
  maxTokens: z.number().int().min(50).max(2000).optional(),
  temperature: z.number().min(0).max(2).optional(),
  welcomeMessage: z.string().max(500).optional(),
  fallbackMessage: z.string().max(500).optional(),
})

export async function GET(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const settings = await loadAiSettings()
    return NextResponse.json({ settings: aiMaskedView(settings) })
  } catch (err) {
    console.error('[GET /api/admin/ai] error:', err)
    return NextResponse.json({ error: 'Could not load AI settings' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const body = await req.json().catch(() => null)
    const parsed = putSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid AI settings payload' }, { status: 400 })
    }
    const { apiKey, ...rest } = parsed.data
    const update: Record<string, unknown> = { ...rest }
    if (apiKey === '-') {
      update.apiKey = ''
    } else if (!apiKey) {
      // keep the stored key
    } else {
      update.apiKey = apiKey
    }
    const saved = await saveAiSettings(update)
    const actor = await getAdminActor(req)
    await logAdminAction({
      actor,
      action: 'ai.settings',
      targetType: 'settings',
      targetId: 'aiAssistant',
      meta: { enabled: saved.enabled, model: saved.model, keyChanged: Boolean(apiKey && apiKey !== '') },
    })
    return NextResponse.json({ ok: true, settings: aiMaskedView(saved) })
  } catch (err) {
    console.error('[PUT /api/admin/ai] error:', err)
    return NextResponse.json({ error: 'Could not save AI settings' }, { status: 500 })
  }
}
