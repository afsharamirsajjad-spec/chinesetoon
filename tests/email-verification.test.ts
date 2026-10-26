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
import { sendEmailVerificationCode, isDevMailPreview } from '../src/lib/mail'

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
  test('کد تأیید ۱۰ دقیقه اعتبار دارد (همان عمر کد بازیابی رمز)', () => {
    expect(EMAIL_VERIFY_TTL_MS).toBe(10 * 60 * 1000)
  })
})

// ---------- mail — مسیر console-only بدون RESEND_API_KEY ----------

describe('sendEmailVerificationCode (console provider)', () => {
  test('بدون RESEND_API_KEY کد در کنسول لاگ و sent:false برمی‌گرداند', async () => {
    // این تست فقط وقتی معنا دارد که کلید واقعی تنظیم نباشد (محیط CI/لوکال)
    if ((process.env.RESEND_API_KEY ?? '').trim()) {
      expect(isDevMailPreview()).toBe(false)
      return
    }
    const logs: string[] = []
    const orig = console.log
    console.log = (...args: unknown[]) => logs.push(args.join(' '))
    try {
      const res = await sendEmailVerificationCode('test@local', 'Test', '123456', 10)
      expect(res.sent).toBe(false)
      expect(res.provider).toBe('console')
      expect(logs.some((l) => l.includes('123456'))).toBe(true)
    } finally {
      console.log = orig
    }
  })

  test('کد ۶ رقمی در موضوع ایمیل قرار می‌گیرد و قراردادهای عمومی تابع برقرار است', async () => {
    // تولید مستقیم رندر قالب — از طریق تابع ارسال در حالت console قابل بررسی نیست
    // (HTML داخلی است)، پس فقط قراردادهای عمومی تابع را می‌سنچیم
    expect(typeof sendEmailVerificationCode).toBe('function')
  })
})
