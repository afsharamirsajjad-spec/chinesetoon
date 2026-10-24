// ---------------------------------------------------------------------------
// 🔵 GET /api/auth/google — شروع ورود با گوگل
// state تصادفی در کوکی httpOnly ذخیره و در callback مقایسه می‌شود (ضد CSRF).
// اگر GOOGLE_CLIENT_ID/SECRET تنظیم نباشند → ریدایرکت شفاف به /account با
// پیام خطای واضح (نه crash).
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { googleAuthUrl, isGoogleAuthConfigured, GOOGLE_STATE_COOKIE, GOOGLE_STATE_TTL_MS, requestOrigin } from '@/lib/google-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const origin = requestOrigin(req)

  if (!isGoogleAuthConfigured()) {
    console.error('[google-auth] not configured — set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET')
    return NextResponse.redirect(`${origin}/account?googleError=not_configured`, 302)
  }

  const state = randomBytes(24).toString('hex')
  const res = NextResponse.redirect(googleAuthUrl(req, state), 302)
  res.cookies.set(GOOGLE_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.floor(GOOGLE_STATE_TTL_MS / 1000),
  })
  return res
}
