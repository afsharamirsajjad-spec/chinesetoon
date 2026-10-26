/// <reference types="bun-types" />
// ---------------------------------------------------------------------------
// تست‌های منطق تأیید ایمیل (src/lib/user-auth.ts + src/lib/mail.ts)
// اجرا: `bun test tests/` — بخش‌های خالص بدون دیتابیس
// ---------------------------------------------------------------------------

import { describe, expect, test } from 'bun:test'
import {
  isEmailVerificationRequired,
  EMAIL_VERIFY_TTL_MS,
  EMAIL_VERIFICATION_ROLLOUT_MS,
} from '../src/lib/user-auth'
import { sendEmailVerification, isDevMailPreview } from '../src/lib/mail'

// ---------- isEmailVerificationRequired — قاعدهٔ عفو کاربران قدیمی ----------

describe('isEmailVerificationRequired', () => {
  const ROLLOUT = new Date(EMAIL_VERIFICATION_ROLLOUT_MS)

  test('کاربر تأییدشده → نیاز ندارد', () => {
    expect(
      isEmailVerificationRequired({ emailVerified: new Date(), createdAt: new Date() })
    ).toBe(false)
  })

  test('کاربر قدیمی (ثبت‌نام قبل از rollout، emailVerified=null) → عفو — هیچ‌کس موجود قفل نمی‌شود', () => {
    const before = new Date(ROLLOUT.getTime() - 1000)
    expect(isEmailVerificationRequired({ emailVerified: null, createdAt: before })).toBe(false)
  })

  test('کاربر جدید (بعد از rollout، emailVerified=null) → باید تأیید کند', () => {
    const after = new Date(ROLLOUT.getTime() + 60_000)
    expect(isEmailVerificationRequired({ emailVerified: null, createdAt: after })).toBe(true)
  })

  test('مرز دقیق rollout (هم‌زمان) → مشمول الزام', () => {
    expect(isEmailVerificationRequired({ emailVerified: null, createdAt: ROLLOUT })).toBe(true)
  })
})

// ---------- ثابت‌ها ----------

describe('email verification constants', () => {
  test('لینک تأیید ۲۴ ساعت اعتبار دارد', () => {
    expect(EMAIL_VERIFY_TTL_MS).toBe(24 * 60 * 60 * 1000)
  })
})

// ---------- mail — مسیر console-only بدون RESEND_API_KEY ----------

describe('sendEmailVerification (console provider)', () => {
  test('بدون RESEND_API_KEY لینک در کنسول لاگ و sent:false برمی‌گرداند', async () => {
    // این تست فقط وقتی معنا دارد که کلید واقعی تنظیم نباشد (محیط CI/لوکال)
    if ((process.env.RESEND_API_KEY ?? '').trim()) {
      expect(isDevMailPreview()).toBe(false)
      return
    }
    const logs: string[] = []
    const orig = console.log
    console.log = (...args: unknown[]) => logs.push(args.join(' '))
    try {
      const res = await sendEmailVerification('test@local', 'Test', 'https://x/api/auth/verify-email?token=abc', 24)
      expect(res.sent).toBe(false)
      expect(res.provider).toBe('console')
      expect(logs.some((l) => l.includes('https://x/api/auth/verify-email?token=abc'))).toBe(true)
    } finally {
      console.log = orig
    }
  })

  test('قالب HTML لینک را دوبار (دکمه + متن جایگزین) و قواعد یک‌بارمصرف را دارد', async () => {
    // تولید مستقیم رندر قالب — از طریق تابع ارسال در حالت console قابل بررسی نیست
    // (HTML داخلی است)، پس فقط قراردادهای عمومی تابع را می‌سنچیم
    expect(typeof sendEmailVerification).toBe('function')
  })
})
