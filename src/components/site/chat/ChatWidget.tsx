'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { MessageCircle, Send, X } from 'lucide-react'
import { siteContent } from '@/content/site-content'

// ---------------------------------------------------------------------------
// 💬 ChatWidget — پشتیبانی لحظه‌ای (ویجت شناور، همهٔ صفحات سایت)
//
// • نشست ناشناس: توکن تصادفی در localStorage — بدون حساب، بدون فرم.
// • Polling (نه WebSocket) — سازگار با Vercel serverless: باز = هر ۵ ثانیه،
//   بسته = هر ۱۵ ثانیه فقط برای نشان «پیام تازه».
// • 'ct-chat-open' CustomEvent → باز شدن از هر جای سایت (مثلاً CTA پشتیبانی).
// ---------------------------------------------------------------------------

const c = siteContent.support.chat
const SESSION_KEY = 'ct-chat-session'

interface ChatMsg {
  id: string
  role: string
  body: string
  createdAt: string
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
    // بدون localStorage (مرورگر خصوصی) — نشست موقت همین بار
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
  }
}

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const sessionRef = useRef<string>('')
  const lastAtRef = useRef<string>('') // cursor برای polling
  const listRef = useRef<HTMLDivElement>(null)
  const openRef = useRef(false)
  openRef.current = open

  // نشست + تاریخچهٔ اولیه
  useEffect(() => {
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
  }, [])

  const poll = useCallback(async () => {
    if (!sessionRef.current) return
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
        // پیام ادمین تازه → اگر پنل بسته است، نشانِ خوانده‌نشده
        const adminFresh = data.messages.some((m) => m.role === 'admin')
        if (adminFresh && !openRef.current) setHasUnread(true)
      }
    } catch {
      // شبکه قطع — دور بعد دوباره
    }
  }, [])

  // polling — باز ۵ ثانیه / بسته ۱۵ ثانیه
  useEffect(() => {
    const iv = setInterval(() => void poll(), open ? 5000 : 15000)
    return () => clearInterval(iv)
  }, [open, poll])

  // اسکرول به پایین با پیام تازه / باز شدن
  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, open])

  // باز شدن از CTAهای سایت
  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener('ct-chat-open', onOpen)
    return () => window.removeEventListener('ct-chat-open', onOpen)
  }, [])

  const send = async () => {
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

  const toggle = () => {
    setOpen((o) => !o)
    setHasUnread(false)
  }

  return (
    <>
      {/* 🟢 دکمهٔ شناور — کنار BackToTop (که right-6 است) */}
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

      {/* پنل گفتگو */}
      {open && (
        <div
          className="fixed bottom-24 right-5 sm:right-20 z-40 w-[calc(100vw-2.5rem)] max-w-sm h-[26rem] bg-white rounded-3xl shadow-2xl border border-sage-light/30 flex flex-col overflow-hidden animate-ct-fadeInUp"
          role="dialog"
          aria-label={c.title}
        >
          {/* هدر */}
          <div className="bg-sage-light/40 px-5 py-3.5 border-b border-sage-light/30 flex items-center gap-3 flex-shrink-0">
            <span className="relative w-9 h-9 rounded-full bg-white flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-4.5 h-4.5 text-sage-dark" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-sage-dark rounded-full border-2 border-white" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-brown-dark leading-tight">{c.title}</p>
              <p className="text-[11px] text-brown-light">{c.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={toggle}
              aria-label="Close chat"
              className="text-brown-light hover:text-brown cursor-pointer p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* پیام‌ها */}
          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5 bg-cream/40">
            {messages.length === 0 && (
              <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 text-sm text-brown border border-sage-light/25 max-w-[85%]">
                {c.welcome}
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
              )
            )}
          </div>

          {/* ورودی */}
          {sendError && (
            <p className="px-4 pt-2 pb-0 text-[11px] text-red-500 bg-white flex-shrink-0" role="alert">
              Could not send — please try again.
            </p>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void send()
            }}
            className="border-t border-sage-light/25 px-3 py-3 flex items-center gap-2 flex-shrink-0 bg-white"
          >
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={c.placeholder}
              aria-label={c.placeholder}
              maxLength={2000}
              className="flex-1 min-w-0 bg-cream/60 border border-sage-light/40 rounded-full px-4 py-2.5 text-sm text-brown placeholder:text-brown-light/60 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition-colors"
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
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
