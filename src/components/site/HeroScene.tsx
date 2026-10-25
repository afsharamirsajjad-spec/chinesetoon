// ---------------------------------------------------------------------
//  🌿 HeroScene — پس‌زمینهٔ ادیتوریال هیرو (نسخهٔ خلوتِ نهایی)
//
//  فلسفه: تایپوگرافیِ وسط‌چین قهرمان است؛ پس‌زمینه فقط «فضا» می‌سازد:
//    ۱) نور طبیعی: هالهٔ گرم بسیار نرم پشت تیتر (بافت روشنایی، نه خورشید)
//    ۲) واترمارک کاراکتر 学 — سبز گیاهی تیره، فوق‌محو (۳.۵٪)
//    ۳) دو برگ شناور ریز و کُند — تنها عناصر متحرک
//    ۴) شستشوی زمینِ سبز در پایین — گذر نرم به بخش بعد
//
//  شاخه‌های گیاهی به درخواست مالک حذف شدند (نسخهٔ بدون هیچ تصویرسازی).
//  تمام اجزا pointer-events-none و aria-hidden هستند.
// ---------------------------------------------------------------------

import { Leaflet } from './ToonBranch'
import type { LeafMode } from './ToonBranch'

const BROWN_LIGHT = '#7A6F62'

/* ---------------- 🍃 برگ شناور ریز — حرکت بسیار کُند ---------------- */
function DriftLeaf({
  className = '',
  w,
  mode = 'sage',
  dur = 9,
  delay = 0,
  rot = 0,
}: {
  className?: string
  w: number
  mode?: LeafMode
  dur?: number
  delay?: number
  rot?: number
}) {
  return (
    <div
      className={`absolute pointer-events-none ${className}`}
      style={{ animation: `ct-float ${dur}s ease-in-out infinite`, animationDelay: `${delay}s` }}
    >
      <svg
        width={w * 1.2}
        height={w * 1.12}
        viewBox={`${-w * 0.1} ${-w * 0.56} ${w * 1.2} ${w * 1.12}`}
        style={{ transform: `rotate(${rot}deg)` }}
        fill="none"
        aria-hidden="true"
      >
        <Leaflet w={w} mode={mode} />
      </svg>
    </div>
  )
}

/* ================= 🌿 صحنهٔ هیرو — ادیتوریال، مینیمال، گرم ================= */
export function HeroScene() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {/* ☀ نور طبیعی — هالهٔ گرم پهن پشت تیتر مرکزی (بافت روشنایی، نه شیء) */}
      <div className="absolute left-1/2 -translate-x-1/2 top-[90px] w-[min(760px,90vw)] h-[440px] rounded-full bg-butter/20 blur-3xl" />
      {/* لایهٔ دوم نور — بالای چپ، سردتر و محوتر برای عمق */}
      <div className="absolute -top-20 -left-24 w-[420px] h-[300px] rounded-full bg-white/25 blur-3xl" />

      {/* 学 واترمارک — سبز تیره، فوق‌محو، سمت راستِ ترکیب */}
      <div className="char-bg top-[15%] right-[5%] hidden md:block" style={{ fontSize: '290px', opacity: 0.035 }}>
        学
      </div>

      {/* 🍃 دو برگ شناور ریز — تنها عناصر متحرکِ هوا */}
      <DriftLeaf className="left-[10%] top-[34%] hidden sm:block" w={18} mode="sage" dur={9} rot={-18} />
      <DriftLeaf className="right-[12%] top-[46%] hidden md:block" w={15} mode="rust" dur={11} delay={2} rot={16} />

      {/* 🌱 شستشوی زمین سبز — گذر نرم به پایین بدون هیچ شیء */}
      <div className="absolute bottom-0 inset-x-0 h-36 sm:h-44 bg-gradient-to-t from-sage-light/50 via-sage-light/25 to-transparent" />
      {/* خط زمینِ ظریف — یک رشتهٔ کرمِ افقی برای لنگر بصری */}
      <div
        className="absolute bottom-[52px] sm:bottom-[64px] left-1/2 -translate-x-1/2 w-[min(560px,80vw)] h-px"
        style={{ background: `linear-gradient(to right, transparent, ${BROWN_LIGHT}30, transparent)` }}
      />
    </div>
  )
}
