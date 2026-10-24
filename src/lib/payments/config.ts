// ---------------------------------------------------------------------------
// 📦 کاتالوگ محصولات پرداخت — منبع حقیقت قیمت، همیشه سمت سرور
//
// روش فعال پرداخت: انتقال دستی بانکی + آپلود رسید + تأیید ادمین (فاز ۵۹).
// جریان آنلاین ارز دیجیتال (USDT/TRON) به‌طور کامل از کد حذف شده است.
//
// قیمت هرگز از مرورگر پذیرفته نمی‌شود؛ فقط productId می‌آید و مبلغ از
// جدول CourseClass (یا fallback فایل محتوا) خوانده می‌شود.
// ---------------------------------------------------------------------------

import { siteContent } from '@/content/site-content'

export interface PaymentProduct {
  id: string
  classTitle: string
  label: string
  amountUsd: number
}

export function getProducts(): PaymentProduct[] {
  const p = (siteContent as unknown as { payments?: { products?: PaymentProduct[] } }).payments
  const products = (p?.products ?? []).filter(
    (x): x is PaymentProduct =>
      typeof x?.id === 'string' &&
      typeof x?.label === 'string' &&
      typeof x?.amountUsd === 'number' &&
      Number.isFinite(x.amountUsd) &&
      x.amountUsd > 0 &&
      x.amountUsd <= 2000 // سقف ایمن: ۲۰۰۰ دلار (میکرو در Int جا می‌شود)
  )
  return products
}

export function findProduct(productId: string): PaymentProduct | null {
  return getProducts().find((p) => p.id === productId) ?? null
}

// ---------------------------------------------------------------------------
// 🎓 فاز ۴۲ — منبع حقیقت قیمت حالا جدول CourseClass است («محصول» = نمای
// مشتق‌شدهٔ کلاس: id=productId، amountUsd=packagePrice). فایل محتوا فقط در
// خطای خواندن DB استفاده می‌شود (getProducts بالا). جدولِ خالیِ عمدی ادمین
// دور زده نمی‌شود — یعنی اگر ادمین همهٔ کلاس‌ها را غیرفعال کند، پرداختِ آن‌ها
// واقعاً بسته می‌شود. هیچ مسیر دیگری حق تعریف/حدس قیمت ندارد.
// ---------------------------------------------------------------------------
export async function getActiveProductsAsync(): Promise<PaymentProduct[]> {
  const { getActiveProducts } = await import('@/lib/classes/store')
  return getActiveProducts()
}

export async function findProductAsync(productId: string): Promise<PaymentProduct | null> {
  const products = await getActiveProductsAsync()
  return products.find((p) => p.id === productId) ?? null
}

// ۱ دلار = ۱٬۰۰۰٬۰۰۰ میکرو — مبلغ سفارش همیشه به‌صورت عدد صحیح میکرو در DB
// ذخیره می‌شود (ستون expectedMicro؛ میراث نام‌گذاری قدیمی، امروز = میکرو-دلار)
export const MICRO_PER_USD = 1_000_000

/**
 * دلار → میکرو. منبع حقیقت همان عدد صحیح میکروست؛ ضرب اعشاری فقط
 * یک‌بار و بلافاصله گرد می‌شود و نتیجه باید عدد صحیحِ امن باشد وگرنه throw.
 */
export function usdToMicro(amountUsd: number): number {
  const micro = Math.round(amountUsd * MICRO_PER_USD)
  if (!Number.isSafeInteger(micro) || micro <= 0) {
    throw new Error(`Invalid product amount: ${amountUsd}`)
  }
  return micro
}

/** میکرو → رشتهٔ نمایشی دو اعشار (فقط برای نمایش؛ منطق همیشه با میکروی صحیح است) */
export function microToDisplay(micro: number): string {
  return (micro / MICRO_PER_USD).toFixed(2)
}
