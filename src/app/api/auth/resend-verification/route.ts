// ---------------------------------------------------------------------------
// ✉️ POST /api/auth/resend-verification — ارسال دوبارهٔ لینک تأیید ایمیل
//
// سیاست ضد افشا: پاسخ همیشه 200 عمومی است — چه حساب وجود داشته باشد چه نه،
// چه تأییدشده باشد چه نه. (کسی نمی‌تواند با این endpoint فهرست ایمیل‌های
// ثبت‌شده سایت را بیرون بکشد.) ایمیل واقعی فقط برای حسابِ موجودِ
// تأییدنشدهٔ بعد از rollout ارسال می‌شود.
//
// محدودیت‌ها: ۱۰ درخواست/ساعت برای هر IP + ۳ درخواست/۳۰ دقیقه برای هر ایمیل
// (ضد آزار ایمیل و ضد سوءاستفاده). ارسال با after() تا پاسخ فوری باشد.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse, after } from 'next/server'
import { db } from '@/lib/db'
import { rateLimit, tooManyRequests } from '@/lib/rate-limit'
import { guardResponse } from '@/lib/http-guard'
import { createEmailVerifyToken, EMAIL_VERIFY_TTL_MS, isEmailVerificationRequired } from '@/lib/user-auth'
import { sendEmailVerification } from '@/lib/mail'
import { ensureSchema, isSchemaDriftError } from '@/lib/ensure-schema'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const guard = guardResponse(req)
  if (guard) return guard

  const rl = await rateLimit('auth-resend-ip', req, 10, 3600, 3600)
  if (!rl.ok) return tooManyRequests(rl)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase().slice(0, 120) : ''
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
  }

  // سقف سوم روی خودِ ایمیل — ضد آزار صندوق ورودی
  const rlEmail = await rateLimit(`auth-resend-email:${email}`, req, 3, 1800, 1800)
  if (!rlEmail.ok) return tooManyRequests(rlEmail)

  const genericOk = NextResponse.json({ ok: true })

  try {
    const user = await db.user.findUnique({ where: { email } })
    // کاربر غایب / قبلاً تأییدشده / قبل از rollout → همان پاسخ عمومی
    if (!user || !isEmailVerificationRequired(user)) return genericOk

    // توکن‌های قبلی باطل و توکن تازه صادر می‌شود
    const { token } = await createEmailVerifyToken(user.id)
    const baseUrl = (process.env.APP_BASE_URL?.trim() || new URL(req.url).origin).replace(/\/+$/, '')
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`
    const firstName = user.firstName || 'there'
    after(async () => {
      await sendEmailVerification(email, firstName, verifyUrl, Math.round(EMAIL_VERIFY_TTL_MS / 3_600_000))
    })
    return genericOk
  } catch (initialError) {
    let e: unknown = initialError
    // ♻️ خودترمیمی اسکیما (هم‌قرارداد با login/register)
    if (isSchemaDriftError(e)) {
      await ensureSchema({ force: true, reason: 'auth-resend-verification' })
      try {
        return genericOk
      } catch {
        e = initialError
      }
    }
    console.error('[POST /api/auth/resend-verification] error:', e instanceof Error ? e.message : e)
    // حتی در خطا هم پاسخ عمومی — ولی 500 تا کلاینت بداند شاید ارسال نشد؟
    // نه: پاسخ همیشه ok تا خطا تبدیل به ابزار کشف حساب نشود.
    return genericOk
  }
}
