'use client'

// ---------------------------------------------------------------------------
// 🤖 AiSettingsAdminTab — Admin → AI Assistant Settings (Part 1.3)
// Configure the OpenAI-compatible endpoint (base URL, masked API key, model,
// system prompt, tokens, temperature), enable/disable the assistant, edit the
// welcome/fallback messages and test connectivity live.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useState } from 'react'
import { Loader2, PlugZap, Save } from 'lucide-react'

interface MaskedSettings {
  enabled: boolean
  configured: boolean
  model: string
  baseUrlHost: string
  welcomeMessage: string
  fallbackMessage: string
  systemPrompt: string
  maxTokens: number
  temperature: number
  apiKeyMasked: string
  hasApiKey: boolean
}

export function AiSettingsAdminTab({
  token,
  onToast,
}: {
  token: string
  onToast: (m: string) => void
}) {
  const [settings, setSettings] = useState<MaskedSettings | null>(null)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [model, setModel] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [maxTokens, setMaxTokens] = useState(500)
  const [temperature, setTemperature] = useState(0.6)
  const [welcome, setWelcome] = useState('')
  const [fallback, setFallback] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/ai', { headers: { 'x-admin-key': token }, cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      const s: MaskedSettings = data.settings
      setSettings(s)
      setEnabled(s.enabled)
      setModel(s.model)
      setSystemPrompt(s.systemPrompt)
      setMaxTokens(s.maxTokens)
      setTemperature(s.temperature)
      setWelcome(s.welcomeMessage)
      setFallback(s.fallbackMessage)
    } catch {
      onToast('Could not load AI settings')
    }
  }, [token, onToast])

  useEffect(() => {
    void load()
  }, [load])

  const save = async () => {
    setBusy(true)
    setTestResult(null)
    try {
      const payload: Record<string, unknown> = {
        enabled,
        model,
        systemPrompt,
        maxTokens,
        temperature,
        welcomeMessage: welcome,
        fallbackMessage: fallback,
      }
      if (apiKeyInput.trim() === '-') payload.apiKey = '-'
      else if (apiKeyInput.trim()) payload.apiKey = apiKeyInput.trim()
      const res = await fetch('/api/admin/ai', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': token },
        body: JSON.stringify(payload),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) {
        onToast(d?.error || 'Save failed')
        return
      }
      onToast('AI settings saved')
      setApiKeyInput('')
      await load()
    } catch {
      onToast('Save failed')
    } finally {
      setBusy(false)
    }
  }

  const test = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/admin/ai/test', {
        method: 'POST',
        headers: { 'x-admin-key': token },
      })
      const d = await res.json().catch(() => ({}))
      if (d?.ok) {
        setTestResult({ ok: true, message: `Connected — the provider answered "${d.reply}" in ${d.ms} ms (${d.model}).` })
      } else {
        setTestResult({ ok: false, message: d?.error || 'Test failed.' })
      }
    } catch {
      setTestResult({ ok: false, message: 'Test request failed.' })
    } finally {
      setTesting(false)
    }
  }

  const field =
    'w-full bg-cream/60 border border-sage-light/40 rounded-xl px-4 py-2.5 text-sm text-brown placeholder:text-brown-light/60 focus:outline-none focus:border-sage'
  const label = 'block text-xs font-semibold uppercase tracking-wider text-brown mb-1.5'

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-sage-light/30 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-brown-dark flex items-center gap-2">
            🤖 AI Assistant settings
          </h3>
          {settings && (
            <span
              className={`text-[11px] font-bold px-3 py-1 rounded-full ${
                settings.enabled && settings.configured
                  ? 'bg-sage/25 text-sage-dark'
                  : 'bg-cream text-brown-light'
              }`}
            >
              {settings.enabled
                ? settings.configured
                  ? 'Active'
                  : 'Enabled — API key missing'
                : 'Disabled'}
            </span>
          )}
        </div>
        <p className="text-[11px] text-brown-light bg-cream/70 border border-sage-light/25 rounded-xl px-3.5 py-2.5 leading-relaxed">
          Works with any OpenAI-compatible chat API (OpenAI, DeepSeek, Moonshot, OpenRouter, a local
          gateway…). The key is stored server-side, masked here, and is never sent to the browser or
          exposed to visitors. Until it is configured, the chat shows the fallback message instead of
          generating replies.
        </p>

        <label className="flex items-center gap-2.5 cursor-pointer">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="w-4 h-4 accent-[#A8C9A0]" />
          <span className="text-sm text-brown font-semibold">Enable the AI assistant</span>
        </label>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label} htmlFor="ai-baseurl">API Base URL</label>
            <input id="ai-baseurl" type="text" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder={settings ? `Current host: ${settings.baseUrlHost || 'not set'}` : 'https://api.openai.com/v1'} className={field} />
            <p className="text-[10px] text-brown-light mt-1">Leave empty to keep the stored value. Must include /v1 for OpenAI-style APIs.</p>
          </div>
          <div>
            <label className={label} htmlFor="ai-key">API Key</label>
            <input id="ai-key" type="password" value={apiKeyInput} onChange={(e) => setApiKeyInput(e.target.value)} placeholder={settings?.hasApiKey ? `Saved: ${settings.apiKeyMasked} — leave empty to keep` : 'sk-…'} className={field} />
            <p className="text-[10px] text-brown-light mt-1">Type “-” to remove the stored key.</p>
          </div>
          <div>
            <label className={label} htmlFor="ai-model">Model name</label>
            <input id="ai-model" type="text" value={model} onChange={(e) => setModel(e.target.value)} placeholder="gpt-4o-mini" className={field} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label} htmlFor="ai-tokens">Max response tokens</label>
              <input id="ai-tokens" type="number" min={50} max={2000} value={maxTokens} onChange={(e) => setMaxTokens(Number(e.target.value) || 500)} className={field} />
            </div>
            <div>
              <label className={label} htmlFor="ai-temp">Temperature</label>
              <input id="ai-temp" type="number" min={0} max={2} step={0.1} value={temperature} onChange={(e) => setTemperature(Number(e.target.value) || 0)} className={field} />
            </div>
          </div>
        </div>

        <div>
          <label className={label} htmlFor="ai-prompt">System prompt</label>
          <textarea id="ai-prompt" value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} rows={5} className={field} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label} htmlFor="ai-welcome">Welcome message</label>
            <textarea id="ai-welcome" value={welcome} onChange={(e) => setWelcome(e.target.value)} rows={2} className={field} />
          </div>
          <div>
            <label className={label} htmlFor="ai-fallback">Fallback message (when unavailable)</label>
            <textarea id="ai-fallback" value={fallback} onChange={(e) => setFallback(e.target.value)} rows={2} className={field} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void save()}
            disabled={busy}
            className="bg-sage text-brown-dark px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-sage-dark transition-colors cursor-pointer disabled:opacity-60 inline-flex items-center gap-2"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}
            Save settings
          </button>
          <button
            type="button"
            onClick={() => void test()}
            disabled={testing}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-brown border border-sage-light/50 bg-white hover:border-sage transition-colors cursor-pointer disabled:opacity-60 inline-flex items-center gap-2"
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <PlugZap className="w-4 h-4" aria-hidden="true" />}
            Test API connection
          </button>
        </div>

        {testResult && (
          <p
            role="status"
            className={`text-xs rounded-xl px-3.5 py-2.5 border ${
              testResult.ok
                ? 'text-sage-dark bg-sage-light/20 border-sage/30'
                : 'text-red-500 bg-red-50 border-red-100'
            }`}
          >
            {testResult.message}
          </p>
        )}
      </div>
    </div>
  )
}
