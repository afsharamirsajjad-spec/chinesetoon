'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { MessageCircle, RefreshCcw, Send, Sparkles, UserRound, X } from 'lucide-react'
import { siteContent } from '@/content/site-content'

// ---------------------------------------------------------------------------
// 💬 ChatWidget — Online Support (floating widget, every page)
//
// Two modes (Part 1 — AI-powered support):
//   • AI mode (default when the admin enabled+configured the assistant):
//     natural-language conversation with the AI, typing indicator, follow-up
//     context, conversation reset. History lives in localStorage on the
//     visitor's device; nothing personal is stored server-side.
//   • Human mode: the original anonymous live chat with the admin team
//     (session token + polling, unchanged behavior).
// When the AI is disabled or unconfigured the widget starts in human mode and
// shows no fake AI responses.
// ---------------------------------------------------------------------------

const c = siteContent.support.chat
const SESSION_KEY = 'ct-chat-session'
const AI_HISTORY_KEY = 'ct-ai-chat-v1'

interface ChatMsg {
  id: string
  role: string
  body: string
  createdAt: string
}

interface AiMsg {
  role: 'user' | 'assistant'
  body: string
}

interface AiStatus {
  enabled: boolean
  configured: boolean
  welcomeMessage: string
  fallbackMessage: string
}

function getSessionToken(): string {
  try {
    const existing = localStorage.getItem(SESSION_KEY)
    if (existing && /^[a-zA-Z0-9-]{8,64}$/.test(existing)) return existing
    const fresh =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
    localStorage.setItem(SESSION_KEY, fresh)
    return fresh
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
  }
}

function loadAiHistory(): AiMsg[] {
  try {
    const raw = localStorage.getItem(AI_HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as AiMsg[]
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.body === 'string' && m.body.length > 0)
      .slice(-30)
  } catch {
    return []
  }
}

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  // mode decided on first open from /api/support/ai/status
  const [aiAvailable, setAiAvailable] = useState(false)
  const [aiChecked, setAiChecked] = useState(false)
  const [aiStatus, setAiStatus] = useState<AiStatus | null>(null)
  const [mode, setMode] = useState<'ai' | 'human'>('human')

  // AI state
  const [aiMessages, setAiMessages] = useState<AiMsg[]>([])
  const [aiSending, setAiSending] = useState(false)
  const [aiError, setAiError] = useState('')

  // human state (unchanged legacy flow)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const sessionRef = useRef<string>('')
  const lastAtRef = useRef<string>('')
  const listRef = useRef<HTMLDivElement>(null)
  const openRef = useRef(false)
  openRef.current = open

  const draftRef = useRef('')
  const [draft, setDraft] = useState('')
  draftRef.current = draft

  // AI availability — checked once when the widget first opens
  useEffect(() => {
    if (!open || aiChecked) return
    let cancelled = false
    fetch('/api/support/ai', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: AiStatus | null) => {
        if (cancelled) return
        setAiChecked(true)
        if (data?.enabled && data?.configured) {
          setAiStatus(data)
          setAiAvailable(true)
          setMode('ai')
          setAiMessages(loadAiHistory())
        } else {
          setAiStatus(data)
          setAiAvailable(false)
          setMode('human')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAiChecked(true)
          setMode('human')
        }
      })
    return () => {
      cancelled = true
    }
  }, [open, aiChecked])

  // ---- human chat flow (unchanged) ----
  useEffect(() => {
    if (!open || mode !== 'human' || sessionRef.current) return
    sessionRef.current = getSessionToken()
    let cancelled = false
    fetch(`/api/chat?session=${encodeURIComponent(sessionRef.current)}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !Array.isArray(data?.messages)) return
        setMessages(data.messages)
        if (data.messages.length > 0) {
          lastAtRef.current = data.messages[data.messages.length - 1].createdAt
          setHasUnread(true)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [open, mode])

  const poll = useCallback(async () => {
    if (!sessionRef.current || mode !== 'human') return
    try {
      const q = `?session=${encodeURIComponent(sessionRef.current)}${
        lastAtRef.current ? `&after=${encodeURIComponent(lastAtRef.current)}` : ''
      }`
      const res = await fetch(`/api/chat${q}`, { cache: 'no-store' })
      if (!res.ok) return
      const data = (await res.json()) as { messages?: ChatMsg[] }
      if (Array.isArray(data.messages) && data.messages.length > 0) {
        lastAtRef.current = data.messages[data.messages.length - 1].createdAt
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id))
          const fresh = data.messages!.filter((m) => !seen.has(m.id))
          return fresh.length ? [...prev, ...fresh] : prev
        })
        const adminFresh = data.messages.some((m) => m.role === 'admin')
        if (adminFresh && !openRef.current) setHasUnread(true)
      }
    } catch {
      // network hiccup — next tick retries
    }
  }, [mode])

  useEffect(() => {
    const iv = setInterval(() => void poll(), open ? 5000 : 15000)
    return () => clearInterval(iv)
  }, [open, poll])

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, aiMessages, aiSending, open])

  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener('ct-chat-open', onOpen)
    return () => window.removeEventListener('ct-chat-open', onOpen)
  }, [])

  const saveAiHistory = (msgs: AiMsg[]) => {
    try {
      localStorage.setItem(AI_HISTORY_KEY, JSON.stringify(msgs.slice(-30)))
    } catch {
      // private browsing — in-memory only
    }
  }

  const sendAi = async () => {
    const text = draft.trim()
    if (!text || aiSending) return
    setAiError('')
    const userMsg: AiMsg = { role: 'user', body: text }
    const history = [...aiMessages, userMsg]
    setAiMessages(history)
    saveAiHistory(history)
    setDraft('')
    setAiSending(true)
    try {
      const res = await fetch('/api/support/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.map((m) => ({ role: m.role, content: m.body })) }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.reply) {
        const next: AiMsg[] = [...history, { role: 'assistant', body: String(data.reply) }]
        setAiMessages(next)
        saveAiHistory(next)
      } else {
        setAiError(String(data?.error || 'The assistant could not answer — please try again.'))
      }
    } catch {
      setAiError('Network problem — please try again.')
    } finally {
      setAiSending(false)
    }
  }

  const resetAi = () => {
    setAiMessages([])
    saveAiHistory([])
    setAiError('')
  }

  const sendHuman = async () => {
    const text = draft.trim()
    if (!text || sending) return
    setSending(true)
    setSendError(false)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: sessionRef.current, text }),
      })
      if (res.ok) {
        const data = (await res.json()) as { message?: ChatMsg }
        if (data.message) {
          setMessages((prev) => [...prev, data.message!])
          lastAtRef.current = data.message.createdAt
        }
        setDraft('')
      } else {
        setSendError(true)
      }
    } catch {
      setSendError(true)
    } finally {
      setSending(false)
    }
  }

  const send = mode === 'ai' ? sendAi : sendHuman
  const busy = mode === 'ai' ? aiSending : sending
  const conversationEmpty = mode === 'ai' ? aiMessages.length === 0 : messages.length === 0

  const toggle = () => {
    setOpen((o) => !o)
    setHasUnread(false)
  }

  const welcomeText =
    mode === 'ai' ? aiStatus?.welcomeMessage ?? c.welcome : c.welcome

  return (
    <>
      {/* 🟢 floating launcher */}
      <button
        type="button"
        onClick={toggle}
        aria-label={open ? 'Close live chat' : c.launcherLabel}
        className="fixed bottom-6 right-20 z-40 w-12 h-12 bg-peach text-brown-dark rounded-2xl shadow-[0_8px_24px_rgba(240,162,131,0.45)] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer"
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
        {hasUnread && !open && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-sage-dark rounded-full border-2 border-white" aria-hidden="true" />
        )}
      </button>

      {open && (
        <div
          className="fixed bottom-24 right-5 sm:right-20 z-40 w-[calc(100vw-2.5rem)] max-w-sm h-[28rem] bg-white rounded-3xl shadow-2xl border border-sage-light/30 flex flex-col overflow-hidden animate-ct-fadeInUp"
          role="dialog"
          aria-label={c.title}
        >
          {/* header */}
          <div className="bg-sage-light/40 px-5 py-3.5 border-b border-sage-light/30 flex items-center gap-3 flex-shrink-0">
            <span className="relative w-9 h-9 rounded-full bg-white flex items-center justify-center flex-shrink-0">
              {mode === 'ai' ? (
                <Sparkles className="w-4.5 h-4.5 text-sage-dark" />
              ) : (
                <MessageCircle className="w-4.5 h-4.5 text-sage-dark" />
              )}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-sage-dark rounded-full border-2 border-white" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-brown-dark leading-tight">
                {mode === 'ai' ? 'AI Assistant' : c.title}
              </p>
              <p className="text-[11px] text-brown-light">
                {mode === 'ai'
                  ? aiSending
                    ? 'Typing…'
                    : 'Powered by AI · answers instantly'
                  : c.subtitle}
              </p>
            </div>
            {aiAvailable && (
              <button
                type="button"
                onClick={() => setMode(mode === 'ai' ? 'human' : 'ai')}
                title={mode === 'ai' ? 'Talk to a human' : 'Back to the AI assistant'}
                aria-label={mode === 'ai' ? 'Talk to a human' : 'Back to the AI assistant'}
                className="p-1.5 rounded-full bg-white/70 text-brown hover:text-sage-dark cursor-pointer"
              >
                {mode === 'ai' ? <UserRound className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              </button>
            )}
            <button
              type="button"
              onClick={toggle}
              aria-label="Close chat"
              className="text-brown-light hover:text-brown cursor-pointer p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* messages */}
          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5 bg-cream/40">
            {conversationEmpty && (
              <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 text-sm text-brown border border-sage-light/25 max-w-[85%]">
                {welcomeText}
              </div>
            )}
            {mode === 'ai'
              ? aiMessages.map((m, i) =>
                  m.role === 'assistant' ? (
                    <div
                      key={i}
                      className="bg-white rounded-2xl rounded-bl-md px-4 py-3 text-sm text-brown border border-sage-light/25 max-w-[85%] whitespace-pre-wrap"
                    >
                      {m.body}
                    </div>
                  ) : (
                    <div key={i} className="ml-auto bg-sage text-brown-dark rounded-2xl rounded-br-md px-4 py-3 text-sm max-w-[85%] font-medium">
                      {m.body}
                    </div>
                  )
                )
              : messages.map((m) =>
                  m.role === 'admin' ? (
                    <div
                      key={m.id}
                      className="bg-white rounded-2xl rounded-bl-md px-4 py-3 text-sm text-brown border border-sage-light/25 max-w-[85%]"
                    >
                      {m.body}
                    </div>
                  ) : (
                    <div
                      key={m.id}
                      className="ml-auto bg-sage text-brown-dark rounded-2xl rounded-br-md px-4 py-3 text-sm max-w-[85%] font-medium"
                    >
                      {m.body}
                    </div>
                  )
                )}
            {/* typing indicator (AI) */}
            {mode === 'ai' && aiSending && (
              <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 border border-sage-light/25 max-w-[60%] inline-flex items-center gap-1.5" aria-label="The assistant is typing">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 bg-sage-dark rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* errors */}
          {mode === 'ai' && aiError && (
            <p className="px-4 pt-2 pb-0 text-[11px] text-red-500 bg-white flex-shrink-0" role="alert">
              {aiError}
            </p>
          )}
          {mode === 'human' && sendError && (
            <p className="px-4 pt-2 pb-0 text-[11px] text-red-500 bg-white flex-shrink-0" role="alert">
              Could not send — please try again.
            </p>
          )}

          {/* input */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void send()
            }}
            className="border-t border-sage-light/25 px-3 py-3 flex items-center gap-2 flex-shrink-0 bg-white"
          >
            {mode === 'ai' && aiMessages.length > 0 && (
              <button
                type="button"
                onClick={resetAi}
                aria-label="Start a new conversation"
                title="Start a new conversation"
                className="w-10 h-10 rounded-full bg-cream text-brown-light flex items-center justify-center hover:bg-cream-dark hover:text-brown transition-colors cursor-pointer flex-shrink-0"
              >
                <RefreshCcw className="w-4 h-4" />
              </button>
            )}
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={mode === 'ai' ? 'Ask about Chinese, HSK or our courses…' : c.placeholder}
              aria-label={mode === 'ai' ? 'Message the AI assistant' : c.placeholder}
              maxLength={2000}
              className="flex-1 min-w-0 bg-cream/60 border border-sage-light/40 rounded-full px-4 py-2.5 text-sm text-brown placeholder:text-brown-light/60 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition-colors"
            />
            <button
              type="submit"
              disabled={busy || !draft.trim()}
              aria-label={c.send}
              className="w-10 h-10 rounded-full bg-sage text-brown-dark flex items-center justify-center hover:bg-sage-dark transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
