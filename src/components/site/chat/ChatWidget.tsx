'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { MessageCircle, RefreshCcw, Send, Sparkles, UserRound, X } from 'lucide-react'
import { siteContent } from '@/content/site-content'

// ---------------------------------------------------------------------------
// 💬 ChatWidget — Online Support (floating widget, every page)
//
// جریان هدایت‌شده (درخواست مالک) — بازدیدکننده هرگز بی‌راهنما رها نمی‌شود:
//   ۱) منوی انتخاب موضوع: «مشکل دارم / سؤال دربارهٔ کلاس‌ها / پرداخت / غیره»
//   ۲) پاسخ خودکاریِ گام‌به‌گام برای همان موضوع + گزینه‌های بعدی
//   ۳) «درست نشد» → اتصال به پشتیبانی انسانی: همان چت زنده که در پنل ادمین
//      (تب Live Chat) باز می‌شود و اپراتور همان‌جا پاسخ می‌دهد.
//
// حالت AI با دکمهٔ ✨ در دسترس می‌ماند (پاسخ آزاد با مدل پیکربندی‌شدهٔ مالک)؛
// ولی ورود پیش‌فرض، منوی هدایت‌شده است. پیام‌های منوی هدایت‌شده فقط محلی‌اند —
// تا لحظهٔ درخواست اپراتور، هیچ‌چیز به سرور ارسال نمی‌شود.
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

// ------------------------- جریان هدایت‌شده -------------------------

type GuidedAction =
  | { type: 'topic'; value: 'problem' | 'classes' | 'payment' | 'other' }
  | { type: 'navigate'; href: string }
  | { type: 'resolved' }
  | { type: 'escalate' }
  | { type: 'restart' }

interface GuidedOption {
  label: string
  action: GuidedAction
}

interface GuidedTurn {
  role: 'bot' | 'user'
  body: string
  options?: GuidedOption[]
}

const MENU_OPTIONS: GuidedOption[] = [
  { label: '🐛 I found a problem', action: { type: 'topic', value: 'problem' } },
  { label: '🎓 Question about classes', action: { type: 'topic', value: 'classes' } },
  { label: '💳 Payment help', action: { type: 'topic', value: 'payment' } },
  { label: '💬 Something else', action: { type: 'topic', value: 'other' } },
]

const AFTER_ANSWER_OPTIONS: GuidedOption[] = [
  { label: '✓ It worked', action: { type: 'resolved' } },
  { label: '🙋 Still not fixed — talk to a human', action: { type: 'escalate' } },
]

const RESTART_OPTIONS: GuidedOption[] = [
  { label: '↩ Back to the menu', action: { type: 'restart' } },
]

const ESCALATE_OPTIONS: GuidedOption[] = [
  { label: '🙋 Talk to a human', action: { type: 'escalate' } },
]

function topicAnswer(value: 'problem' | 'classes' | 'payment' | 'other'): GuidedTurn[] {
  switch (value) {
    case 'problem':
      return [
        {
          role: 'bot',
          body: 'Let’s try a quick fix:\n1) Refresh the page (Ctrl/Cmd + R).\n2) If you are signed in, sign out and back in.\n3) If it still breaks, try another browser or clear the cache.',
          options: AFTER_ANSWER_OPTIONS,
        },
      ]
    case 'classes':
      return [
        {
          role: 'bot',
          body: 'All live classes are on the Classes page — level, teacher, price and schedule are on every class card, and you can register online in one minute.',
          options: [
            { label: '🎓 Open the Classes page', action: { type: 'navigate', href: '/classes' } },
            ...AFTER_ANSWER_OPTIONS,
          ],
        },
      ]
    case 'payment':
      return [
        {
          role: 'bot',
          body: 'Payments: pick a class → checkout → pay with USDT (TRON) or upload a bank receipt.\nIf a payment did not register, contact us with your order reference (CT-…) and we will trace it right away.',
          options: AFTER_ANSWER_OPTIONS,
        },
      ]
    case 'other':
      return [
        {
          role: 'bot',
          body: 'Tell us your question in one line — or connect directly to our team and they will answer you right here in this chat.',
          options: ESCALATE_OPTIONS,
        },
      ]
  }
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
  // 🧭 ورود پیش‌فرض = منوی هدایت‌شده؛ AI با دکمهٔ ✨ در دسترس است
  const [aiAvailable, setAiAvailable] = useState(false)
  const [aiChecked, setAiChecked] = useState(false)
  const [aiStatus, setAiStatus] = useState<AiStatus | null>(null)
  const [mode, setMode] = useState<'ai' | 'human'>('human')

  // جریان هدایت‌شده — تا لحظهٔ escalate کاملاً محلی است
  const [guided, setGuided] = useState<GuidedTurn[]>([])
  const [lastTopic, setLastTopic] = useState<string>('')
  // 'guided' = منو/راهنما · 'live' = چت واقعی با اپراتور (پنل ادمین)
  const [stage, setStage] = useState<'guided' | 'live'>('guided')

  // AI state
  const [aiMessages, setAiMessages] = useState<AiMsg[]>([])
  const [aiSending, setAiSending] = useState(false)
  const [aiError, setAiError] = useState('')

  // human state (چت واقعی)
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

  // AI availability — یک‌بار در اولین باز شدن برای نمایش دکمهٔ تغییر حالت
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
        } else {
          setAiStatus(data)
          setAiAvailable(false)
        }
      })
      .catch(() => {
        if (!cancelled) setAiChecked(true)
      })
    return () => {
      cancelled = true
    }
  }, [open, aiChecked])

  // ---------- مرحلهٔ live: بازیابی تاریخچهٔ نشست ----------
  useEffect(() => {
    if (!open || mode !== 'human' || stage !== 'live' || !sessionRef.current) return
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
  }, [open, mode, stage])

  const poll = useCallback(async () => {
    if (!sessionRef.current || mode !== 'human' || stage !== 'live') return
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
  }, [mode, stage])

  useEffect(() => {
    const iv = setInterval(() => void poll(), open ? 5000 : 15000)
    return () => clearInterval(iv)
  }, [open, poll])

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, aiMessages, aiSending, guided, open])

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

  // ---------- اتصال به اپراتور — همان چت زندهٔ پنل ادمین ----------
  const escalate = useCallback(async (context: string) => {
    if (sending) return
    setSending(true)
    setSendError(false)
    try {
      sessionRef.current = getSessionToken()
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: sessionRef.current, text: context }),
      })
      if (!res.ok) {
        setSendError(true)
        setSending(false)
        return
      }
      const data = (await res.json()) as { message?: ChatMsg }
      setStage('live')
      setMessages((prev) => (data.message ? [...prev, data.message] : prev))
      if (data.message) lastAtRef.current = data.message.createdAt
      setDraft('')
    } catch {
      setSendError(true)
    } finally {
      setSending(false)
    }
  }, [sending])

  // ---------- انتخاب‌های منوی هدایت‌شده ----------
  const runAction = (action: GuidedAction, label: string) => {
    switch (action.type) {
      case 'navigate':
        window.location.href = action.href
        return
      case 'topic': {
        const turns: GuidedTurn[] = [{ role: 'user', body: label }, ...topicAnswer(action.value)]
        setLastTopic(label)
        setGuided((prev) => [...prev, ...turns])
        return
      }
      case 'resolved':
        setGuided((prev) => [
          ...prev,
          { role: 'user', body: label },
          { role: 'bot', body: 'Glad we could help! 🎉 If you need anything else, just pick a topic below.', options: RESTART_OPTIONS },
        ])
        return
      case 'escalate':
        setGuided((prev) => [...prev, { role: 'user', body: label }])
        void escalate(`🆘 Human support requested — topic: ${lastTopic || 'general'}. The guided help did not solve it.`)
        return
      case 'restart':
        setGuided([{ role: 'bot', body: c.welcome, options: MENU_OPTIONS }])
        return
    }
  }

  const sendHuman = async () => {
    const text = draft.trim()
    if (!text || sending) return
    if (stage === 'guided') {
      // متن آزاد در مرحلهٔ منو = درخواست اتصال به اپراتور با همان متن
      setGuided((prev) => [...prev, { role: 'user', body: text }])
      void escalate(text)
      return
    }
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
  const conversationEmpty =
    mode === 'ai' ? aiMessages.length === 0 : stage === 'guided' ? guided.length === 0 : messages.length === 0

  const toggle = () => {
    setOpen((o) => !o)
    setHasUnread(false)
  }

  // ---------- ناوبری گزینه‌های هدایت‌شده ----------
  const onOptionClick = (opt: GuidedOption) => {
    if (mode !== 'human' || stage !== 'guided') return
    runAction(opt.action, opt.label)
  }

  const welcomeText =
    mode === 'ai' ? aiStatus?.welcomeMessage ?? c.welcome : c.welcome

  const renderBody = (body: string) => (
    <span className="whitespace-pre-wrap">{body}</span>
  )

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
                  : stage === 'live'
                    ? 'Connected to our team — they reply here'
                    : 'How can we help you today?'}
              </p>
            </div>
            {aiAvailable && (
              <button
                type="button"
                onClick={() => setMode(mode === 'ai' ? 'human' : 'ai')}
                title={mode === 'ai' ? 'Guided help & human support' : 'Chat with the AI assistant'}
                aria-label={mode === 'ai' ? 'Guided help and human support' : 'Chat with the AI assistant'}
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
                {renderBody(welcomeText)}
              </div>
            )}

            {mode === 'ai' ? (
              <>
                {aiMessages.map((m, i) =>
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
                  ),
                )}
                {aiSending && (
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
              </>
            ) : (
              <>
                {/* 🧭 پیام‌های هدایت‌شده — فقط محلی، تا لحظهٔ اتصال به اپراتور */}
                {stage === 'guided' && guided.length > 0 && (
                  <div className="flex justify-center py-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brown-light/70">guided help</span>
                  </div>
                )}
                {stage === 'guided'
                  ? guided.map((turn, i) =>
                      turn.role === 'bot' ? (
                        <div key={`g${i}`} className="space-y-2">
                          <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 text-sm text-brown border border-sage-light/25 max-w-[90%] whitespace-pre-wrap">
                            {renderBody(turn.body)}
                          </div>
                          {turn.options && (
                            <div className="flex flex-wrap gap-2 pl-2">
                              {turn.options.map((opt) => (
                                <button
                                  key={opt.label}
                                  type="button"
                                  onClick={() => onOptionClick(opt)}
                                  className="text-xs font-semibold bg-white border border-sage/40 text-sage-dark px-3.5 py-2 rounded-full hover:bg-sage hover:text-brown-dark transition-colors cursor-pointer text-left"
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div key={`g${i}`} className="ml-auto bg-sage text-brown-dark rounded-2xl rounded-br-md px-4 py-3 text-sm max-w-[85%] font-medium">
                          {renderBody(turn.body)}
                        </div>
                      ),
                    )
                  : (
                    <>
                      {/* 🟢 چت واقعی — اپراتور از پنل ادمین پاسخ می‌دهد */}
                      <div className="flex justify-center py-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-brown-light/70">live support — your messages reach our team</span>
                      </div>
                      {messages.length === 0 && (
                        <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 text-sm text-brown border border-sage-light/25 max-w-[85%]">
                          Connecting you to our team… you will see the reply right here.
                        </div>
                      )}
                      {messages.map((m) =>
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
                        ),
                      )}
                    </>
                  )}
                {/* 🧭 منوی شروع — وقتی هنوز موضوعی انتخاب نشده */}
                {stage === 'guided' && guided.length === 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {MENU_OPTIONS.map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => onOptionClick(opt)}
                        className="text-xs font-semibold bg-white border border-sage/40 text-sage-dark px-3.5 py-2 rounded-full hover:bg-sage hover:text-brown-dark transition-colors cursor-pointer text-left"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </>
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
              placeholder={
                mode === 'ai'
                  ? 'Ask about Chinese, HSK or our courses…'
                  : stage === 'guided'
                    ? 'Or type your question and we will connect you…'
                    : c.placeholder
              }
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
