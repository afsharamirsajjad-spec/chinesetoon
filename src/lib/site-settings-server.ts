// ---------------------------------------------------------------------------
// ⚙️ خواندن تنظیمات عمومی سایت سمت سرور (SERVER-ONLY)
//
// layout.tsx با هر رندر (یا بازتولید ISR) تنظیمات را مستقیم از دیتابیس
// می‌خواند و به درخت کلاینت می‌دهد — تا اولین HTML همان محتوای پیکربندی‌شدهٔ
// مالک را دارد و «فلش تنظیمات پیش‌فرض» حذف می‌شود.
//
//  • cache() ری‌اکت — در یک پاس رندر چند تماس فقط یک کوئری می‌زند
//  • شکست DB (مثل بیلد محلی بدون دیتابیس) اپ را نمی‌بندد → پیش‌فرض فایل محتوا
//  • تازه‌سازی: revalidate=60 در layout + fetch تازه‌ساز کلاینت بعد از ذخیرهٔ
//    مالک، تغییرات را در کمتر از یک دقیقه (یا همان لحظه با refresh) می‌رساند
// ---------------------------------------------------------------------------

import { cache } from 'react'
import { db } from '@/lib/db'
import {
  applyAnnouncement,
  applyHero,
  applyHomeStats,
  defaultPublicSiteSettings,
  type PublicSiteSettings,
} from '@/lib/site-settings-public'

export const getPublicSiteSettings = cache(async (): Promise<PublicSiteSettings> => {
  try {
    const rows = await db.siteSetting.findMany({
      where: { key: { in: ['announcement', 'homeStats', 'hero'] } },
    })
    let settings = defaultPublicSiteSettings
    for (const row of rows) {
      let parsed: unknown = null
      try {
        parsed = JSON.parse(row.value)
      } catch {
        continue // مقدار خراب — همان پیش‌فرض
      }
      if (row.key === 'announcement') {
        settings = { ...settings, announcement: applyAnnouncement(parsed, settings.announcement) }
      } else if (row.key === 'hero') {
        settings = { ...settings, hero: applyHero(parsed, settings.hero) }
      } else if (row.key === 'homeStats') {
        settings = { ...settings, homeStats: applyHomeStats(parsed, settings.homeStats) }
      }
    }
    return settings
  } catch (err) {
    console.warn(
      '[site-settings] DB unavailable — serving bundled defaults:',
      err instanceof Error ? err.message : err
    )
    return defaultPublicSiteSettings
  }
})
