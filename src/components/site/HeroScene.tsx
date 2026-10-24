// ---------------------------------------------------------------------
//  🌄 HeroScene — تصویرسازی تمام‌عرض هیرو (به‌جای تصویر جداگانهٔ سمت راست)
//  یک صحنهٔ باغیِ پانوراما که کل هیرو را می‌پوشاند و متن و دکمه‌ها
//  به‌صورت طبیعی داخل آن می‌نشینند:
//    آسمان گرادیانی → خورشید کره‌ای → ابرهای راننده → پرنده‌ها →
//    برگ‌های شناور → کارت‌های واژهٔ شناور → رشته‌تپه‌های سبز.
//  (درخت تُون به درخواست مالک حذف شد؛ کارت‌های واژه جای آن را گرفتند.)
//  تمام اجزا pointer-events-none و aria-hidden هستند؛ فقط دکوراسیون‌اند.
//  پالت دست‌نخورده: sage/cream/butter/peach/brown + سبز/زنگاریِ خود لوگو.
// ---------------------------------------------------------------------

import { Leaflet, CREAM, SAGE_FILL } from './ToonBranch'
import type { LeafMode } from './ToonBranch'

const SAGE_DARK = '#8DB585'
const BROWN_LIGHT = '#7A6F62'

/* ---------------- ☁️ ابر — سه بیضی نرم با خط پایین ---------------- */
function Cloud({ className = '', dur = 26, delay = 0 }: { className?: string; dur?: number; delay?: number }) {
  return (
    <div
      className={`absolute pointer-events-none ${className}`}
      style={{ animation: `ct-drift ${dur}s ease-in-out infinite`, animationDelay: `${delay}s` }}
    >
      <svg viewBox="0 0 120 46" className="w-full h-auto" fill="none" aria-hidden="true">
        <g fill="#FFFFFF" fillOpacity="0.9">
          <ellipse cx="34" cy="30" rx="26" ry="12" />
          <ellipse cx="62" cy="21" rx="23" ry="14" />
          <ellipse cx="89" cy="30" rx="24" ry="11" />
        </g>
        <path d="M14 38 H106" stroke={SAGE_FILL} strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />
      </svg>
    </div>
  )
}

/* ---------------- 🐦 پرنده — دو قوس کوچک ---------------- */
function Birds({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 52 18" className={`absolute pointer-events-none ${className}`} fill="none" aria-hidden="true">
      <path d="M3 12 Q 9 5 15 12 Q 21 5 27 12" stroke={BROWN_LIGHT} strokeWidth="2.2" strokeLinecap="round" opacity="0.55" />
      <path d="M33 7 Q 38 2 43 7 Q 48 2 51.5 6.5" stroke={BROWN_LIGHT} strokeWidth="1.8" strokeLinecap="round" opacity="0.4" />
    </svg>
  )
}

/* ---------------- 🍃 برگ شناور — با ct-float و چرخش ثابت ---------------- */
function DriftLeaf({
  className = '',
  w,
  mode = 'sage',
  dur = 6,
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

/* ---------------- 🏷️ کارت واژهٔ شناور — هویت آموزش زبان ---------------- */
// جای درخت حذف‌شده: کارت‌های واژهٔ کوچک (هانزی + پینیین) که آرام در
// آسمونِ سمت راست شناورند. همه pointer-events-none هستند (ریشهٔ صحنه).
function WordChip({
  hanzi,
  pinyin,
  className = '',
  tone = 'butter',
  delay = 0,
}: {
  hanzi: string
  pinyin: string
  className?: string
  tone?: 'butter' | 'white' | 'sage'
  delay?: number
}) {
  const tones: Record<string, string> = {
    butter: 'bg-butter text-brown-dark',
    white: 'bg-white/95 backdrop-blur text-sage-dark',
    sage: 'bg-sage-light/70 backdrop-blur text-sage-dark',
  }
  return (
    <div
      className={`absolute pointer-events-none rounded-2xl px-3.5 py-2 shadow-md animate-ct-float ${tones[tone]} ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <span className="block text-lg font-bold leading-tight">{hanzi}</span>
      <span className="text-xs text-brown-light block">{pinyin}</span>
    </div>
  )
}

/* ================= 🌄 صحنهٔ کامل هیرو ================= */
export function HeroScene() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {/* ☀️ خورشید کره‌ای — در آسمانِ بالا-راست، بالای چیپ واژه */}
      <div className="absolute right-[11%] top-[140px] w-20 h-20 md:w-24 md:h-24">
        <div className="absolute inset-[-16px] rounded-full bg-butter/40 blur-lg animate-ct-floatSlow" />
        <div className="absolute inset-0 rounded-full bg-butter border-4 border-butter-light shadow-[0_0_0_10px_rgba(243,217,139,0.28)]" />
      </div>

      {/* ☁️ ابرها — با رانش آرام، زیر خط هدر نه پشت آن */}
      <Cloud className="left-[20%] top-[150px] w-32 md:w-40" dur={30} />
      <Cloud className="right-[24%] top-[214px] w-24 md:w-32 hidden sm:block" dur={24} delay={3} />
      <Cloud className="right-[16%] top-[118px] w-36 md:w-48 hidden md:block" dur={34} delay={1.5} />

      {/* 🐦 پرنده‌ها */}
      <Birds className="left-[23%] top-[150px] w-14 opacity-70" />
      <Birds className="left-[47%] top-[150px] w-9 opacity-50 hidden md:block" />

      {/* 🍃 برگ‌های شناور — خارج از محدودهٔ متن */}
      <DriftLeaf className="left-[42%] top-[120px]" w={26} mode="sage" dur={5.5} rot={-18} />
      <DriftLeaf className="right-[30%] top-[150px] hidden sm:block" w={20} mode="rust" dur={6.5} delay={1} rot={14} />
      <DriftLeaf className="left-[57%] top-[330px] hidden sm:block" w={30} mode="outline" dur={7} delay={0.5} rot={30} />
      <DriftLeaf className="right-[10%] top-[430px] hidden lg:block" w={22} mode="sage" dur={5} delay={1.6} rot={-30} />
      <DriftLeaf className="left-[33%] top-[468px] hidden lg:block" w={24} mode="rust" dur={6} delay={2.2} rot={8} />

      {/* 学 پس‌زمینه — فقط دسکتاپ، خیلی محو */}
      <div className="char-bg top-[26%] left-[34%] hidden md:block" style={{ fontSize: '240px', opacity: 0.05 }}>
        学
      </div>

      {/* 🏷️ کارت‌های واژهٔ شناور — سمت راست (جای درخت حذف‌شده)؛ از موبایل به
          ترتیب اضافه می‌شوند تا متن هیرو شلوغ نشود */}
      <WordChip hanzi="你好" pinyin="nǐ hǎo · hello" className="right-[28%] top-[300px] -rotate-2 hidden sm:block" tone="butter" />
      <WordChip hanzi="谢谢" pinyin="xièxie · thanks" className="right-[10%] top-[380px] rotate-2 hidden md:block" tone="white" delay={1.2} />
      <WordChip hanzi="再见" pinyin="zàijiàn · bye" className="right-[21%] top-[465px] -rotate-1 hidden lg:block" tone="sage" delay={2.2} />

      {/* ⛰️ رشته‌تپه‌ها — تمام‌عرض، کشیده‌شونده */}
      <svg
        viewBox="0 0 1440 230"
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 w-full h-[130px] sm:h-[160px] md:h-[200px] lg:h-[230px] animate-ct-fadeInUp delay-300"
        fill="none"
      >
        {/* تپهٔ دور */}
        <path
          d="M0 118 C 240 58, 430 68, 720 108 C 1000 148, 1220 66, 1440 92 L1440 230 L0 230 Z"
          fill={SAGE_FILL}
          opacity="0.55"
        />
        {/* تپهٔ میانی */}
        <path
          d="M0 162 C 200 120, 480 176, 760 150 C 1040 124, 1240 168, 1440 140 L1440 230 L0 230 Z"
          fill={SAGE_FILL}
        />
        {/* زمین پیش‌زمینه */}
        <path
          d="M0 196 C 260 164, 520 206, 820 186 C 1100 168, 1300 202, 1440 186 L1440 230 L0 230 Z"
          fill="#A8C9A0"
        />
        {/* دالان کرم‌رنگ ملایم روی زمین */}
        <path
          d="M40 228 C 320 204, 560 214, 880 198 C 1080 188, 1250 198, 1420 192"
          stroke={CREAM}
          strokeWidth="7"
          strokeLinecap="round"
          opacity="0.65"
        />
        {/* نقطه‌های گل و علف روی تپه */}
        <circle cx="270" cy="204" r="3.2" fill="#FFFFFF" opacity="0.8" />
        <circle cx="700" cy="194" r="2.6" fill="#FFFFFF" opacity="0.7" />
        <circle cx="1060" cy="198" r="3" fill={CREAM} opacity="0.9" />
        <circle cx="520" cy="210" r="2.4" fill={SAGE_DARK} opacity="0.7" />
        <circle cx="1230" cy="210" r="2.6" fill={SAGE_DARK} opacity="0.6" />
      </svg>
    </div>
  )
}
