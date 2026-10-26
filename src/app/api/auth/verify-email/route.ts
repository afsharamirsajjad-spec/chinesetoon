// ---------------------------------------------------------------------------
// ✉️ POST /api/auth/verify-email — تأیید ایمیل با کد ۶ رقمی (الگوی بازیابی رمز)
//
// کاربر کد ایمیل‌شده را در صفحهٔ تأیید وارد می‌کند:
//   • کد باید یک‌بارمصرف و نامنقضی باشد — مصرف اتمی با updateMany گارددار
//     (usedAt: null + expiresAt در آینده)؛ مصرف دوم حتی در مسابقه شکست می‌خورد
//   • در صورت موفقیت emailVerified ست و «نشست ورود» ساخته می‌شود — کاربر
//     مالک حساب است (کد را از ایمیل خودش دارد)؛ مثل جریان reset که پس از
//     تغییر رمز مستقیم وارد می‌شود. مقصد بازگشت به پرداخت حفظ می‌ماند.
//   • پاسخ خطا عمومی است (کد نامعتبر/منقضی = 400 با پیام واحد) — وجود حساب
//     از روی پاسخ قابل حدس نیست.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { z } from 'zod'
import { db } from '@/lib/db'
import { rateLimit, tooManyRequests } from '@/lib/rate-limit'
import { guardResponse } from '@/lib/http-guard'
import {
  createUserSession,
  setSessionCookie,
  toSafeUser,
  SESSION_TTL_MS,
} from '@/lib/user-auth'

export const dynamic = 'force-dynamic'

const verifySchema = z.object({
  email: z.string().trim().toLowerCase().max(120),
  code: z.string().trim().regex(/^\d{6}$/, 'Code must be 6 digits'),
})

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

export async function POST(req: NextRequest) {
  // تلاش محدود برای حدس کد: ۱۰ درخواست در ۱۰ دقیقه برای هر IP
  const rl = await rateLimit('auth-verify-email', req, 10, 600, 600)
  if (!rl.ok) return tooManyRequests(rl)
  const guard = guardResponse(req)
  if (guard) return guard

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const parsed = verifySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Please enter the 6-digit code from your email' },
      { status: 400 }
    )
  }
  const { email, code } = parsed.data

  const genericError = NextResponse.json(
    { error: 'This verification code is invalid, already used, or has expired. Request a fresh code — it only takes a moment.' },
    { status: 400 }
  )

  try {
    const user = await db.user.findUnique({ where: { email } })
    if (!user) return genericError

    // مصرف اتمی کد — فقط آخرین کدِ بازِ همین حساب، یک‌بارمصرف و نامنقضی
    const consumed = await db.emailVerifyToken.updateMany({
      where: {
        userId: user.id,
        tokenHash: sha256(code),
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { usedAt: new Date() },
    })
    if (consumed.count !== 1) return genericError

    const updated = await db.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date(), lastLoginAt: new Date() },
    })

    // ✅ تأیید موفق → ورود مستقیم (کد را دارندهٔ ایمیل وارد کرده است)
    const { token, expiresAt } = await createUserSession(user.id, req.headers.get('user-agent') ?? '', SESSION_TTL_MS)
    const res = NextResponse.json({ ok: true, user: toSafeUser(updated) })
    setSessionCookie(res, token, expiresAt)
    return res
  } catch (e) {
    console.error('[POST /api/auth/verify-email] error:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Could not verify the code. Please try again.' }, { status: 500 })
  }
}
