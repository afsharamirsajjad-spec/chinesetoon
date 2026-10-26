// ---------------------------------------------------------------------------
// ✉️ GET /api/auth/verify-email?token=... — مصرف لینک تأیید ایمیل
//
// کاربر روی لینک داخل ایمیل کلیک می‌کند و اینجا می‌رسد:
//   • توکن باید دقیقاً یک‌بارمصرف باشد — مصرف اتمی با updateMany گارددار
//     (usedAt: null و expiresAt در آینده)؛ مصرف دوم حتی در مسابقه شکست می‌خورد
//   • در همان تراکنشِ منطقی، emailVerified کاربر set می‌شود
//   • کاربر به /account هدایت می‌شود با ?verified=1 (موفق) یا ?verified=0
//     (توکن نامعتبر/منقضی) — صفحهٔ حساب پیام مناسب نشان می‌دهد
//   • نشست خودکار ساخته نمی‌شود — کاربر وارد می‌شود (الزام تسک) و چون
//     verified است ورودش موفق خواهد بود
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rateLimit, tooManyRequests } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // لینک‌های ایمیل توسط همه‌جا باز می‌شوند — سقف دفاعی ساده روی IP
  const rl = await rateLimit('auth-verify-email', req, 30, 3600, 3600)
  if (!rl.ok) return tooManyRequests(rl)

  const origin = new URL(req.url).origin
  const token = req.nextUrl.searchParams.get('token') ?? ''
  // توکن خام ۶۴ نویسهٔ hex است — هر چیز دیگری بدون کوئری رد می‌شود
  if (!/^[0-9a-f]{64}$/.test(token)) {
    return NextResponse.redirect(`${origin}/account?verified=0`, 302)
  }

  try {
    const { createHash } = await import('crypto')
    const tokenHash = createHash('sha256').update(token).digest('hex')

    // مصرف اتمی توکن — فقط اگر یک‌بارمصرف و سالم باشد count=1 می‌شود
    const consumed = await db.emailVerifyToken.updateMany({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    })
    if (consumed.count !== 1) {
      return NextResponse.redirect(`${origin}/account?verified=0`, 302)
    }

    // ست‌کردن emailVerified — توکن همین الان مصرف شده، پس userId معتبر است
    const record = await db.emailVerifyToken.findUnique({ where: { tokenHash }, select: { userId: true } })
    if (!record) {
      // عملاً دست‌یافتنی نیست (توکن همین حالا مصرف شد) — گارد دفاعی
      return NextResponse.redirect(`${origin}/account?verified=0`, 302)
    }
    await db.user.update({
      where: { id: record.userId },
      data: { emailVerified: new Date() },
    })

    return NextResponse.redirect(`${origin}/account?verified=1`, 302)
  } catch (e) {
    console.error('[GET /api/auth/verify-email] error:', e instanceof Error ? e.message : e)
    return NextResponse.redirect(`${origin}/account?verified=0`, 302)
  }
}
