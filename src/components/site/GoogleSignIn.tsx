'use client'

// ---------------------------------------------------------------------------
// 🔵 ورود با گوگل — دکمهٔ مشترک فرم‌های ورود/ثبت‌نام + بنر خطای callback
//
// دکمه یک <a href="/api/auth/google"> است (ناوبری کامل، نه fetch) چون پاسخ
// سرور ریدایرکت به Google است. خطاها با ?googleError=<code> به همین صفحه
// برمی‌گردند و از query خوانده می‌شوند.
// ---------------------------------------------------------------------------

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { siteContent } from '@/content/site-content'

const c = siteContent.account

function GoogleGIcon() {
  // لوگوی رسمی چهاررنگ گوگل — inline SVG بدون وابستگی
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  )
}

const GOOGLE_ERROR_KEYS = [
  'not_configured',
  'cancelled',
  'google_error',
  'invalid_response',
  'state_mismatch',
  'exchange_failed',
  'email_not_verified',
  'rate_limited',
  'could_not_sign_in',
] as const

/** بنر خطا — وقتی URL دارای ?googleError=… باشد */
export function GoogleErrorBanner() {
  const params = useSearchParams()
  const code = params.get('googleError')
  // محاسبهٔ پیام مستقیم در رندر (بدون setState در effect) — و پاک‌سازی پارامتر
  // URL با یک اثر fire-and-forget تا با refresh دوباره نشان داده نشود
  const key = GOOGLE_ERROR_KEYS.find((k) => k === code)
  const message = code ? (key ? c.googleErrors[key] : c.googleErrors.google_error) : ''

  useEffect(() => {
    if (!code) return
    try {
      const url = new URL(window.location.href)
      url.searchParams.delete('googleError')
      window.history.replaceState({}, '', url.pathname + url.search)
    } catch {
      /* بی‌اهمیت */
    }
  }, [code])

  if (!message) return null
  return (
    <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3" role="alert">
      {message}
    </p>
  )
}

/** دکمهٔ استاندارد «Continue with Google» */
export function GoogleSignInButton() {
  return (
    <>
      <a
        href="/api/auth/google"
        className="w-full py-3.5 rounded-2xl bg-white border border-sage-light/50 text-brown-dark text-sm font-semibold flex items-center justify-center gap-3 hover:border-sage hover:bg-cream/50 transition-colors cursor-pointer min-h-[48px]"
      >
        <GoogleGIcon />
        {c.googleButton}
      </a>
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-sage-light/40" />
        <span className="text-[11px] uppercase tracking-wider text-brown-light/80 font-semibold">
          {c.googleOrEmail}
        </span>
        <span className="h-px flex-1 bg-sage-light/40" />
      </div>
    </>
  )
}
