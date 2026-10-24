// ---------------------------------------------------------------------------
// 🔵 Google Sign-In — OAuth 2.0 Authorization Code Flow (سمت سرور خالص)
//
// بدون وابستگی جدید و بدون سیستم احراز تکراری: همان User/UserSession/کوکی
// ct_user_session سایت. جریان:
//   GET /api/auth/google           → ریدایرکت به Google (state ضد CSRF در کوکی)
//   GET /api/auth/google/callback  → تبدیل code به توکن → ایمیل تأییدشدهٔ گوگل
//     • حساب موجود با همان ایمیل → ورود به همان حساب (لینک امن — گوگل مالکیت
//       ایمیل را تأیید کرده)
//     • حساب جدید → ساخت کاربر با passwordHash تصادفیِ غیرقابل‌حدس (لاگین
//       رمزی برایش ناممکن است؛ فقط گوگل) + کد یکتای CT-XXXXXX
//
// امنیت:
//   • client_secret فقط سمت سرور — هرگز به کلاینت/لاگ نمی‌رود
//   • state تصادفی httpOnly + مقایسه در callback (ضد CSRF)
//   • فقط ایمیل‌های email_verified لینک می‌شوند (ضد account takeover)
//   • redirect_uri از هدرهای پروکسی ساخته می‌شود (Vercel-safe)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'

export const GOOGLE_STATE_COOKIE = 'ct_google_state'
export const GOOGLE_STATE_TTL_MS = 10 * 60 * 1000

export function googleClientId(): string {
  return (process.env.GOOGLE_CLIENT_ID ?? '').trim()
}

export function googleClientSecret(): string {
  return (process.env.GOOGLE_CLIENT_SECRET ?? '').trim()
}

export function isGoogleAuthConfigured(): boolean {
  return googleClientId() !== '' && googleClientSecret() !== ''
}

/** مبدأ عمومی درخواست — پشت پروکسی Vercel از هدرهای forward شده */
export function requestOrigin(req: NextRequest): string {
  const proto = req.headers.get('x-forwarded-proto') ?? new URL(req.url).protocol.replace(':', '')
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? new URL(req.url).host
  return `${proto}://${host}`
}

export function googleRedirectUri(req: NextRequest): string {
  return `${requestOrigin(req)}/api/auth/google/callback`
}

export function googleAuthUrl(req: NextRequest, state: string): string {
  const params = new URLSearchParams({
    client_id: googleClientId(),
    redirect_uri: googleRedirectUri(req),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export interface GoogleProfile {
  sub: string // شناسه پایدار گوگل
  email: string // حروف کوچک
  emailVerified: boolean
  name: string
  givenName: string
  familyName: string
  picture: string | null
}

/** تبدیل code به access_token و خواندن پروفایل — فقط سمت سرور */
export async function exchangeGoogleCode(
  req: NextRequest,
  code: string
): Promise<GoogleProfile | null> {
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: googleClientId(),
      client_secret: googleClientSecret(),
      redirect_uri: googleRedirectUri(req),
      grant_type: 'authorization_code',
    }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!tokenRes.ok) {
    console.error('[google-auth] token exchange failed:', tokenRes.status)
    return null
  }
  const token = (await tokenRes.json()) as { access_token?: string }
  if (!token.access_token) return null

  const infoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${token.access_token}` },
    signal: AbortSignal.timeout(10_000),
  })
  if (!infoRes.ok) {
    console.error('[google-auth] userinfo failed:', infoRes.status)
    return null
  }
  const info = (await infoRes.json()) as {
    sub?: string
    email?: string
    email_verified?: boolean
    name?: string
    given_name?: string
    family_name?: string
    picture?: string
  }
  if (!info.sub || !info.email) return null
  return {
    sub: info.sub,
    email: info.email.trim().toLowerCase(),
    emailVerified: info.email_verified === true,
    name: info.name ?? '',
    givenName: info.given_name ?? '',
    familyName: info.family_name ?? '',
    picture: info.picture ?? null,
  }
}
