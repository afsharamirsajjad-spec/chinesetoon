// ---------------------------------------------------------------------------
// 🧭 recordPractice — ثبت بی‌صدای شروعِ یک فعالیت تمرین از سمت کلاینت
//
//  • fire-and-forget: 401 (مهمان) و هر خطای شبکه هرگز UI را نمی‌شکند
//  • ضداسپم محلی: همان فعالیت حداکثر هر ۶۰ ثانیه یک‌بار POST می‌شود
//    (سرور هم rate limit و اعتبارسنجی رجیستری دارد — این فقط کاهش سروصداست)
//  • کلیدها همان کلیدهای src/lib/practice/registry.ts هستند
// ---------------------------------------------------------------------------

const lastSentAt = new Map<string, number>()
const MIN_INTERVAL_MS = 60_000

export function recordPractice(activityKey: string): void {
  try {
    const now = Date.now()
    const last = lastSentAt.get(activityKey) ?? 0
    if (now - last < MIN_INTERVAL_MS) return
    lastSentAt.set(activityKey, now)
  } catch {
    // حتی اگر نگهداری timestamp شکست بخورد، ثبت را از دست نده
  }
  try {
    void fetch('/api/practice/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activity: activityKey }),
      keepalive: true,
    }).catch(() => {
      /* مهمان یا خطای شبکه — پیشرفت ذخیره نمی‌شود، UI بی‌تغییر */
    })
  } catch {
    /* fetch در دسترس نیست */
  }
}
