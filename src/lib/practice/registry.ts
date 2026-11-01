// ---------------------------------------------------------------------------
// 🧭 Practice — رجیستری مرکزی فعالیت‌های تمرین
//
// منبع واحد حقیقت برای: کارت‌های «تمرین» صفحهٔ /learn، فیلترها/جست‌وجو و
// اعتبارسنجی سمت سرورِ کلید فعالیت در API ثبت پیشرفت.
//
// اصول:
//  • هر فعالیت باید به یک قابلیت «واقعی و کارکردی» موجود لینک شود — هیچ
//    کارت غیرفعال/جعلی اینجا ثبت نمی‌شود.
//  • href ها همان روت‌های واقعی سایت + لنگرِ بخش‌های موجود هستند.
//  • افزودن نوع تمرین جدید در آینده = افزودن یک ردیف به این فایل؛ صفحهٔ
//    Learn، فیلترها و API به‌طور خودکار از همین رجیستری می‌خوانند.
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
  icon: 'sun' | 'layers' | 'book' | 'ear' | 'target' | 'graduation' | 'clipboard' | 'video'
  level: PracticeLevel
  /** برآورد زمان (دقیقه) */
  minutes: number
  /** متن دکمهٔ اقدام */
  action: string
}

// ⚠️ فقط فعالیت‌های واقعاً موجود:
//   hsk-course   → دورهٔ ساختاریافتهٔ HSK 1 — /practice/hsk1 (URLهای سئو دست‌نخورده)
//   daily-word   → بخش Word of Day — تعبیه‌شده در صفحهٔ /learn
//   flashcards   → فلش‌کارت واژگان — تعبیه‌شده در صفحهٔ /learn
//   lessons      → کتابخانهٔ درس‌های واژگان — همان صفحهٔ /learn (هر درس /lesson/<slug>)
//   tone-trainer → بازی شنیداری تُن‌ها — تعبیه‌شده در صفحهٔ /learn
//   level-quiz   → آزمون تعیین سطح — تعبیه‌شده در صفحهٔ /learn
//   videos       → ویدیوهای آموزشی یوتیوب — بخش ویدیوهای صفحهٔ /learn (کتابخانهٔ کامل /teaching-videos)
//   exams        → آزمون‌های آزمایشی — تب Practice (/hsk-exams)
// 🧭 درخواست مالک: تب Practice فقط امتحان‌هاست (/practice → /hsk-exams)؛
//    فعالیت‌ها و ویدیوها در تب Learn تعبیه شده‌اند — کارت‌ها به لنگر همان صفحه اسکرول می‌کنند.
export const PRACTICE_ACTIVITIES: PracticeActivity[] = [
  {
    key: 'hsk-course',
    title: 'HSK 1 Course — 10 Stages',
    description:
      'The structured HSK 1 path: vocabulary, grammar, pronunciation and reading in 10 progressive stages with saved progress and unlocking.',
    category: 'vocabulary',
    href: '/practice/hsk1',
    icon: 'graduation',
    level: 'Beginner',
    minutes: 15,
    action: 'Open the course',
  },
  {
    key: 'daily-word',
    title: 'Daily Chinese Word',
    description:
      'A fresh word every day with hanzi, pinyin, meaning, example sentence and native-style audio.',
    category: 'vocabulary',
    href: '/learn#practice-daily-word',
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
    href: '/learn#practice-flashcards',
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
    href: '/learn#practice-tone-trainer',
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
    href: '/learn#practice-level-quiz',
    icon: 'target',
    level: 'All levels',
    minutes: 5,
    action: 'Take the quiz',
  },
  {
    key: 'videos',
    title: 'Teaching Videos',
    description:
      'YouTube teaching samples — grammar, pronunciation and sample classes — with filters by level and topic.',
    category: 'listening',
    href: '/learn#learn-videos',
    icon: 'video',
    level: 'All levels',
    minutes: 10,
    action: 'Watch the videos',
  },
  {
    key: 'exams',
    title: 'Mock Exams (HSK-style)',
    description:
      'Full timed mock exams — multiple-choice questions graded on the server with an instant score and answer review.',
    category: 'quizzes',
    href: '/hsk-exams',
    icon: 'clipboard',
    level: 'All levels',
    minutes: 30,
    action: 'Take an exam',
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
