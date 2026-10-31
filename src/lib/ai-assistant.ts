// ---------------------------------------------------------------------------
// 🤖 AI assistant — server library (Part 1)
//
// Settings live in SiteSetting under the key 'aiAssistant' (JSON). The API
// key is stored server-side only and NEVER returned by any endpoint — the
// admin panel sees a masked preview plus the last 4 characters.
//
// Provider: any OpenAI-compatible chat-completions endpoint (OpenAI, DeepSeek,
// Moonshot, local gateways, OpenRouter, …) configured with base URL + API key
// + model + temperature + max tokens — exactly the knobs the owner asked to
// manage from the dashboard. Swapping providers later means changing the base
// URL, not the architecture.
//
// If the assistant is disabled or unconfigured, callers get a clean 503 and
// the UI shows the fallback message — fake responses are never generated.
// ---------------------------------------------------------------------------

import { db } from '@/lib/db'

export const AI_SETTINGS_KEY = 'aiAssistant'

const DEFAULT_SYSTEM_PROMPT = [
  'You are the friendly assistant of "Chinese Toon", an online Mandarin Chinese school for international students.',
  'Help visitors with: learning Chinese, HSK 1 / HSK 2 / HSK 3 (stages, vocabulary, grammar, practice), the courses and class formats offered on this website, registration and payment questions, and using the website features.',
  'Keep answers short, warm and practical (2-6 sentences unless asked for more). If a question needs the school team (refunds, specific schedules, private requests), politely tell the visitor to use the contact form on the Support page.',
  'Reply in the same language the visitor writes in.',
].join(' ')

export const AI_DEFAULTS = {
  enabled: false,
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  maxTokens: 500,
  temperature: 0.6,
  welcomeMessage: "你好！I'm the Chinese Toon assistant. Ask me anything about learning Chinese, the HSK levels or our courses.",
  fallbackMessage: 'The AI assistant is temporarily unavailable. Please try again in a moment, or send your question through the contact form on the Support page.',
}

export interface AiSettings {
  enabled: boolean
  baseUrl: string
  apiKey: string
  model: string
  systemPrompt: string
  maxTokens: number
  temperature: number
  welcomeMessage: string
  fallbackMessage: string
}

export interface AiSettingsPublic {
  enabled: boolean
  configured: boolean
  model: string
  baseUrlHost: string
  welcomeMessage: string
  fallbackMessage: string
}

export interface AiSettingsMasked extends AiSettingsPublic {
  systemPrompt: string
  maxTokens: number
  temperature: number
  apiKeyMasked: string
  hasApiKey: boolean
}

function normalizeBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '')
  if (!trimmed) return AI_DEFAULTS.baseUrl
  return /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`
}

function coerceSettings(raw: Partial<AiSettings> | null | undefined): AiSettings {
  return {
    enabled: raw?.enabled === true,
    baseUrl: normalizeBaseUrl(typeof raw?.baseUrl === 'string' ? raw.baseUrl : AI_DEFAULTS.baseUrl),
    apiKey: typeof raw?.apiKey === 'string' ? raw.apiKey : '',
    model: (typeof raw?.model === 'string' && raw.model.trim()) || AI_DEFAULTS.model,
    systemPrompt: (typeof raw?.systemPrompt === 'string' && raw.systemPrompt.trim()) || DEFAULT_SYSTEM_PROMPT,
    maxTokens: Math.min(2000, Math.max(50, Math.round(Number(raw?.maxTokens) || AI_DEFAULTS.maxTokens))),
    temperature: Math.min(2, Math.max(0, Number(raw?.temperature) ?? AI_DEFAULTS.temperature)),
    welcomeMessage: (typeof raw?.welcomeMessage === 'string' && raw.welcomeMessage.trim()) || AI_DEFAULTS.welcomeMessage,
    fallbackMessage: (typeof raw?.fallbackMessage === 'string' && raw.fallbackMessage.trim()) || AI_DEFAULTS.fallbackMessage,
  }
}

export async function loadAiSettings(): Promise<AiSettings> {
  try {
    const row = await db.siteSetting.findUnique({ where: { key: AI_SETTINGS_KEY } })
    if (!row) return coerceSettings(null)
    return coerceSettings(JSON.parse(row.value) as Partial<AiSettings>)
  } catch {
    return coerceSettings(null)
  }
}

export async function saveAiSettings(next: Partial<AiSettings>): Promise<AiSettings> {
  const current = await loadAiSettings()
  const merged = coerceSettings({ ...current, ...next })
  await db.siteSetting.upsert({
    where: { key: AI_SETTINGS_KEY },
    update: { value: JSON.stringify(merged) },
    create: { key: AI_SETTINGS_KEY, value: JSON.stringify(merged) },
  })
  return merged
}

export function aiConfigured(s: AiSettings): boolean {
  return Boolean(s.apiKey && s.baseUrl && s.model)
}

/** Public status — safe for the browser (no secrets) */
export function aiPublicView(s: AiSettings): AiSettingsPublic {
  let host = ''
  try {
    host = new URL(s.baseUrl).hostname
  } catch {
    host = ''
  }
  return {
    enabled: s.enabled,
    configured: aiConfigured(s),
    model: s.model,
    baseUrlHost: host,
    welcomeMessage: s.welcomeMessage,
    fallbackMessage: s.fallbackMessage,
  }
}

/** Admin view — key masked, never the raw value */
export function aiMaskedView(s: AiSettings): AiSettingsMasked {
  return {
    ...aiPublicView(s),
    systemPrompt: s.systemPrompt,
    maxTokens: s.maxTokens,
    temperature: s.temperature,
    hasApiKey: Boolean(s.apiKey),
    apiKeyMasked: s.apiKey
      ? `${s.apiKey.slice(0, 3)}${'•'.repeat(Math.max(4, Math.min(12, s.apiKey.length - 7)))}${s.apiKey.slice(-4)}`
      : '',
  }
}

export interface AiChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export class AiUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AiUnavailableError'
  }
}

export class AiProviderError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AiProviderError'
  }
}

/**
 * Call the configured OpenAI-compatible endpoint. Never throws raw provider
 * errors — they are mapped into AiUnavailableError (config) / AiProviderError
 * (upstream failure) so the API can return clean, actionable messages.
 */
export async function callAiChat(
  settings: AiSettings,
  messages: AiChatMessage[]
): Promise<{ reply: string; model: string }> {
  if (!settings.enabled || !aiConfigured(settings)) {
    throw new AiUnavailableError('The AI assistant is not configured.')
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30_000)
  try {
    const res = await fetch(`${settings.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify({
        model: settings.model,
        messages: [{ role: 'system', content: settings.systemPrompt }, ...messages],
        max_tokens: settings.maxTokens,
        temperature: settings.temperature,
      }),
      signal: controller.signal,
    })
    if (!res.ok) {
      const bodyText = await res.text().catch(() => '')
      const hint = res.status === 401 || res.status === 403
        ? 'The API key was rejected by the provider.'
        : res.status === 429
          ? 'The provider rate limit was hit — try again in a moment.'
          : `The provider returned HTTP ${res.status}.`
      console.error('[ai-chat] provider error:', res.status, bodyText.slice(0, 300))
      throw new AiProviderError(hint)
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const reply = data.choices?.[0]?.message?.content?.trim() ?? ''
    if (!reply) {
      throw new AiProviderError('The provider returned an empty response.')
    }
    return { reply, model: settings.model }
  } catch (e) {
    if (e instanceof AiUnavailableError || e instanceof AiProviderError) throw e
    if (e instanceof Error && e.name === 'AbortError') {
      throw new AiProviderError('The AI response took too long — please try again.')
    }
    console.error('[ai-chat] network error:', e)
    throw new AiProviderError('Could not reach the AI provider.')
  } finally {
    clearTimeout(timer)
  }
}
