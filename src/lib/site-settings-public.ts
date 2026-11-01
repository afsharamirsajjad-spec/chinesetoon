// ---------------------------------------------------------------------------
// ⚙️ تنظیمات عمومی سایت (announcement / hero / homeStats) — نسخهٔ client-safe
//
// یک منبع حقیقت برای «شکل» و «پیش‌فرض‌ها» که هم لایهٔ سرور (layout → SSR) و
// هم کامپوننت‌های مرورگر از آن استفاده می‌کنند. فایل عمداً هیچ import سمت
// سرور (db/fs) ندارد تا در باندل کلاینت هم امن باشد.
//
// چرا این معماری؟ قبلاً هر کامپوننت با state اولیهٔ پیش‌فرضِ فایل محتوا رندر
// می‌شد و بعد از mount با fetch('/api/settings') تنظیمات مالک جای آن را
// می‌گرفت — نتیجه: «فلش» محتوای پیش‌فرض در هر لود. حالا layout مقدارها را
// سمت سرور از دیتابیس می‌خواند و با Context به اولین رندر (HTML) می‌دهد؛
// fetch کلاینت فقط برای تازه‌سازیِ بلافاصله بعد از ذخیرهٔ مالک باقی مانده است.
// ---------------------------------------------------------------------------

import { siteContent } from '@/content/site-content'

export interface AnnouncementSettings {
  enabled: boolean
  id: string
  emoji: string
  text: string
  ctaLabel: string
  ctaPage: string
}

export interface HeroSettings {
  badge: string
  titleTop: string
  titleMiddle: string
  titleHighlight: string
  subtitle: string
}

export interface HomeStatItem {
  value: number
  suffix: string
  label: string
}

export interface PublicSiteSettings {
  announcement: AnnouncementSettings
  hero: HeroSettings
  homeStats: HomeStatItem[]
}

/** پیش‌فرض‌ها = مقادیر فایل محتوا (وقتی مالک چیزی ذخیره نکرده یا DB در دسترس نیست) */
export const defaultPublicSiteSettings: PublicSiteSettings = {
  announcement: { ...siteContent.announcement },
  hero: { ...siteContent.home.hero },
  homeStats: siteContent.stats.items.map((s) => ({ ...s })),
}

const ANNOUNCEMENT_PAGES = ['home', 'classes', 'learn', 'about', 'blog', 'reviews', 'support', 'register']

/** ادغام امن announcement ذخیره‌شده با پیش‌فرض — ورودی خراب = پیش‌فرض */
export function applyAnnouncement(
  saved: unknown,
  fallback: AnnouncementSettings = defaultPublicSiteSettings.announcement
): AnnouncementSettings {
  if (!saved || typeof saved !== 'object') return fallback
  const s = saved as Record<string, unknown>
  if (typeof s.text !== 'string' || s.text.trim().length < 3) return fallback
  const ctaPage = typeof s.ctaPage === 'string' && ANNOUNCEMENT_PAGES.includes(s.ctaPage) ? s.ctaPage : fallback.ctaPage
  return {
    enabled: s.enabled !== false,
    id: typeof s.id === 'string' && s.id.length > 0 ? s.id : fallback.id,
    emoji: typeof s.emoji === 'string' && s.emoji.length > 0 ? s.emoji.slice(0, 8) : fallback.emoji,
    text: s.text.trim().slice(0, 300),
    ctaLabel: typeof s.ctaLabel === 'string' && s.ctaLabel.trim().length > 0 ? s.ctaLabel.trim().slice(0, 60) : fallback.ctaLabel,
    ctaPage,
  }
}

/** ادغام امن hero ذخیره‌شده با پیش‌فرض — فیلد غایب/خراب = مقدار پیش‌فرض همان فیلد */
export function applyHero(saved: unknown, fallback: HeroSettings = defaultPublicSiteSettings.hero): HeroSettings {
  if (!saved || typeof saved !== 'object') return fallback
  const s = saved as Record<string, unknown>
  const str = (v: unknown, fb: string): string =>
    typeof v === 'string' && v.trim().length > 0 ? v.trim() : fb
  return {
    badge: str(s.badge, fallback.badge),
    titleTop: str(s.titleTop, fallback.titleTop),
    titleMiddle: str(s.titleMiddle, fallback.titleMiddle),
    titleHighlight: str(s.titleHighlight, fallback.titleHighlight),
    subtitle: str(s.subtitle, fallback.subtitle),
  }
}

/** نرمال‌سازی آمار ذخیره‌شده — ردیف نامعتبر رد می‌شود؛ لیست خالی = پیش‌فرض */
export function applyHomeStats(saved: unknown, fallback: HomeStatItem[] = defaultPublicSiteSettings.homeStats): HomeStatItem[] {
  if (!Array.isArray(saved) || saved.length === 0) return fallback
  const items = saved
    .filter((it): it is Record<string, unknown> => !!it && typeof it === 'object')
    .map((it) => ({
      value: Math.max(0, Math.round(Number(it.value)) || 0),
      suffix: typeof it.suffix === 'string' ? it.suffix.slice(0, 8) : '',
      label: typeof it.label === 'string' && it.label.trim().length > 0 ? it.label.trim().slice(0, 80) : '',
    }))
    .filter((it) => it.label.length > 0)
    .slice(0, 8)
  return items.length > 0 ? items : fallback
}

/**
 * پاسخ خام GET /api/settings ({settings: {announcement?, hero?, homeStats?}}) →
 * PublicSiteSettings کامل. هم لودر سرور و هم تازه‌سازهای کلاینت از همین
 * استفاده می‌کنند تا منطق «ذخیره‌نشده = پیش‌فرض» یکی باشد.
 */
export function publicSettingsFromApiPayload(payload: unknown, fallback: PublicSiteSettings = defaultPublicSiteSettings): PublicSiteSettings {
  const settings = (payload as { settings?: Record<string, unknown> } | null)?.settings
  if (!settings || typeof settings !== 'object') return fallback
  return {
    announcement: 'announcement' in settings ? applyAnnouncement(settings.announcement, fallback.announcement) : fallback.announcement,
    hero: 'hero' in settings ? applyHero(settings.hero, fallback.hero) : fallback.hero,
    homeStats: 'homeStats' in settings ? applyHomeStats(settings.homeStats, fallback.homeStats) : fallback.homeStats,
  }
}
