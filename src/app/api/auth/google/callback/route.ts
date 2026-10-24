// ---------------------------------------------------------------------------
// 🔵 GET /api/auth/google/callback — پایان ورود با گوگل
//
// مراحل: اعتبارسنجی state (ضد CSRF) → تبدیل code → پروفایل گوگل →
//   • فقط ایمیل تأییدشدهٔ گوگل (email_verified) پذیرفته می‌شود — ضد takeover
//   • حساب موجود با همان ایمیل → ورود به همان حساب (لینک امن؛ هیچ حساب
//     تکراری ساخته نمی‌شود)
//   • حساب جدید → ساخت کاربر با passwordHash تصادفیِ ۶۴hex (لاگین رمزی برایش
//     ممکن نیست — فقط گوگل) + کد یکتای CT-XXXXXX
//   • سشن همان سیستم سایت (UserSession + کوکی ct_user_session ۳۰روزه)
// خطاها → ریدایرکت به /account?googleError=<code> (پیام واضح، بدون نشت).
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import {
  exchangeGoogleCode,
  isGoogleAuthConfigured,
  GOOGLE_STATE_COOKIE,
  requestOrigin,
  type GoogleProfile,
} from '@/lib/google-auth'
import { createUserSession, setSessionCookie, hashPassword, SESSION_TTL_MS, purgeExpiredAuthRecords } from '@/lib/user-auth'
import { assignUniqueCode } from '@/lib/unique-code'
import { rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

function fail(origin: string, code: string): NextResponse {
  return NextResponse.redirect(`${origin}/account?googleError=${encodeURIComponent(code)}`, 302)
}

export async function GET(req: NextRequest) {
  const origin = requestOrigin(req)
  if (!isGoogleAuthConfigured()) return fail(origin, 'not_configured')

  // 🛡️ rate limit — ۱۵ callback در ۱۰ دقیقه برای هر IP
  const rl = await rateLimit('auth-google-callback', req, 15, 600, 600)
  if (!rl.ok) return fail(origin, 'rate_limited')

  const url = new URL(req.url)
  // 🔴 گوگل خودش خطا داده (کاربر رد کرد / سشن منقضی شد)
  const googleError = url.searchParams.get('error')
  if (googleError) return fail(origin, googleError === 'access_denied' ? 'cancelled' : 'google_error')

  const code = url.searchParams.get('code') ?? ''
  const state = url.searchParams.get('state') ?? ''
  if (!code || !state) return fail(origin, 'invalid_response')

  // 🛡️ CSRF — state باید با کوکی httpOnly (که فقط در /api/auth/google ست شده) یکی باشد
  const cookieState = req.cookies.get(GOOGLE_STATE_COOKIE)?.value ?? ''
  if (!cookieState || cookieState.length !== 48 || cookieState !== state) {
    return fail(origin, 'state_mismatch')
  }

  const profile = await exchangeGoogleCode(req, code)
  if (!profile) return fail(origin, 'exchange_failed')

  // 🔒 ضد account-takeover: گوگل باید مالکیت ایمیل را تأیید کرده باشد
  if (!profile.emailVerified) return fail(origin, 'email_not_verified')

  try {
    purgeExpiredAuthRecords()
    const user = await findOrCreateGoogleUser(profile)

    // همان ورود استاندارد سایت — سشن ۳۰روزه (کوکی persistent؛ OAuth جریان
    // مرورگر-کامل است و «مرورگر را ببند» مثل فرم معنا ندارد)
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })
    const { token, expiresAt } = await createUserSession(
      user.id,
      req.headers.get('user-agent') ?? '',
      SESSION_TTL_MS
    )
    const res = NextResponse.redirect(`${origin}/account`, 302)
    setSessionCookie(res, token, expiresAt)
    res.cookies.delete(GOOGLE_STATE_COOKIE)
    return res
  } catch (e) {
    console.error('[google-auth] callback failed:', e instanceof Error ? e.message : e)
    return fail(origin, 'could_not_sign_in')
  }
}

/**
 * لینک امن یا ساخت حساب:
 *  • حساب موجود با همان ایمیل → همان حساب (تکراری ساخته نمی‌شود)
 *  • حساب جدید → firstName/lastName از پروفایل گوگل؛ passwordHash تصادفیِ
 *    غیرقابل‌حدس (رمز ورودِ شناخته‌شده‌ای وجود ندارد)
 */
async function findOrCreateGoogleUser(profile: GoogleProfile) {
  const existing = await db.user.findUnique({ where: { email: profile.email } })
  if (existing) return existing

  const firstName = (profile.givenName || profile.name || profile.email.split('@')[0]).slice(0, 60)
  const lastName = (profile.familyName || '').slice(0, 60)
  // رمز «غیرممکن»: ۶۴ کاراکتر hex تصادفی → هش scrypt معتبر ولی هیچ‌کس نمی‌داندش
  const unguessablePassword = randomBytes(32).toString('hex')

  const created = await db.user.create({
    data: {
      email: profile.email,
      firstName,
      lastName,
      passwordHash: hashPassword(unguessablePassword),
      country: '',
      countryCode: '',
    },
  })
  // 🆔 کد یکتای پایدار دانش‌پذیر — همان قواعد ثبت‌نام معمولی
  await assignUniqueCode(created.id).catch((e: unknown) => {
    console.error('[google-auth] unique code assignment failed (non-fatal):', e instanceof Error ? e.message : e)
  })
  return created
}
