// ---------------------------------------------------------------------------
// 🧭 Practice Hub — رجیستری مرکزی فعالیت‌های تمرین
//
// منبع واحد حقیقت برای: کارت‌های صفحهٔ /practice، فیلترها/جست‌وجو و
// اعتبارسنجی سمت سرورِ کلید فعالیت در API ثبت پیشرفت.
//
// اصول:
//  • هر فعالیت باید به یک قابلیت «واقعی و کارکردی» موجود لینک شود — هیچ
//    کارت غیرفعال/جعلی اینجا ثبت نمی‌شود.
//  • href ها همان روت‌های واقعی سایت + لنگرِ بخش‌های موجود هستند.
//  • افزودن نوع تمرین جدید در آینده = افزودن یک ردیف به این فایل؛ صفحهٔ
//    هاب، فیلترها و API به‌طور خودکار از همین رجیستری می‌خوانند.
// ---------------------------------------------------------------------------

export const PRACTICE_CATEGORIES = [
  { key: 'vocabulary', label: 'Vocabulary', hint: 'Words, characters and daily review' },
  { key: 'pronunciation', label: 'Pronunciation & Tones', hint: 'Train your ear for the four tones' },
  { key: 'quizzes', label: 'Quizzes & Tests', hint: 'Find your level and check yourself' },
  { key: 'listening', label: 'Listening & Reading', hint: 'Hear native-speed audio with lessons' },
] as const

export type PracticeCategoryKey = (typeof PRACTICE_CATEGORIES)[number]['key']

export type PracticeLevel = 'Beginner' | 'Elementary' | 'Intermediate' | 'All levels'

export interface PracticeActivity {
  /** کلید یکتا — همان چیزی که در PracticeEvent ثبت می‌شود */
  key: string
  title: string
  description: string
  category: PracticeCategoryKey
  /** روت واقعی + لنگر بخش مربوطه */
  href: string
  /** نام آیکون lucide — در کامپوننت به آیکون نگاشت می‌شود */
  icon: 'sun' | 'layers' | 'book' | 'ear' | 'target' | 'graduation'
  level: PracticeLevel
  /** برآورد زمان (دقیقه) */
  minutes: number
  /** متن دکمهٔ اقدام */
  action: string
}

// ⚠️ فقط فعالیت‌های واقعاً موجود:
//   daily-word   → بخش Word of Day — تعبیه‌شده در همین صفحهٔ /practice
//   flashcards   → فلش‌کارت واژگان — تعبیه‌شده در همین صفحهٔ /practice
//   lessons      → کتابخانهٔ درس‌های واژگان /learn (هر درس صفحهٔ /lesson/<slug> با تلفظ هر واژه)
//   tone-trainer → بازی شنیداری تُن‌ها — تعبیه‌شده در همین صفحهٔ /practice
//   level-quiz   → آزمون تعیین سطح — تعبیه‌شده در همین صفحهٔ /practice (نتیجه سمت سرور ذخیره می‌شود)
// 🧭 درخواست مالک: فعالیت‌های تعاملی خودِ تمرین داخل همان صفحهٔ /practice می‌زنند —
//    کارت‌ها فقط به لنگرِ همان صفحه اسکرول می‌کنند؛ تنها استثنا کتابخانهٔ درس‌هاست.
export const PRACTICE_ACTIVITIES: PracticeActivity[] = [
  {
    key: 'daily-word',
    title: 'Daily Chinese Word',
    description:
      'A fresh word every day with hanzi, pinyin, meaning, example sentence and native-style audio.',
    category: 'vocabulary',
    href: '/practice#practice-daily-word',
    icon: 'sun',
    level: 'All levels',
    minutes: 2,
    action: 'Open today’s word',
  },
  {
    key: 'flashcards',
    title: 'Vocabulary Flashcards',
    description:
      'Flip, shuffle and review core words — hanzi and pinyin on the front, meaning and example on the back.',
    category: 'vocabulary',
    href: '/practice#practice-flashcards',
    icon: 'layers',
    level: 'Beginner',
    minutes: 5,
    action: 'Start reviewing',
  },
  {
    key: 'lessons',
    title: 'Interactive Word Lessons',
    description:
      'Themed vocabulary lessons — greetings, food, numbers and more — every word with pronunciation audio.',
    category: 'vocabulary',
    href: '/learn',
    icon: 'book',
    level: 'Beginner',
    minutes: 10,
    action: 'Browse lessons',
  },
  {
    key: 'tone-trainer',
    title: 'Tone Trainer Game',
    description:
      'Listen to a syllable and pick the right tone. Builds the ear for all four Mandarin tones plus neutral.',
    category: 'pronunciation',
    href: '/practice#practice-tone-trainer',
    icon: 'ear',
    level: 'All levels',
    minutes: 5,
    action: 'Play the game',
  },
  {
    key: 'level-quiz',
    title: 'Chinese Level Quiz',
    description:
      'Multiple-choice placement quiz — get a beginner/elementary/intermediate band with server-graded scoring.',
    category: 'quizzes',
    href: '/practice#practice-level-quiz',
    icon: 'target',
    level: 'All levels',
    minutes: 5,
    action: 'Take the quiz',
  },
  {
    key: 'lesson-listen',
    title: 'Listen & Read Along',
    description:
      'Open any lesson and play each word and its example sentence — listening practice at your own pace.',
    category: 'listening',
    href: '/learn',
    icon: 'graduation',
    level: 'All levels',
    minutes: 10,
    action: 'Choose a lesson',
  },
]

/** اعتبارسنجی سمت سرور — کلید باید در رجیستری موجود باشد */
export function isKnownActivity(key: string): boolean {
  return PRACTICE_ACTIVITIES.some((a) => a.key === key)
}

/** hrefهای معتبر — برای تست یکپارچگی لینک‌های رجیستری */
export function practiceHrefAllowlist(): Set<string> {
  return new Set(PRACTICE_ACTIVITIES.map((a) => a.href))
}
