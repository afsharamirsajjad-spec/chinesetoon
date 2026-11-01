'use client'

// ---------------------------------------------------------------------------
// 📚 LearnPage — تب Learn (/learn) — بازسازی از نو (درخواست مالک)
//
// ساختار:
//   ۱) هیرو
//   ۲) PracticeActivities — «تمرین‌ها» با اولویت اول: بنر دورهٔ ۱۰ جلسه‌ای
//      HSK 1، داشبورد شخصی، و «یک» گرید یکپارچه که کارت‌های فعالیت و
//      کارت‌های «درس واژگان» (لغات) را با همان فیلترها/جست‌وجو نشان می‌دهد
//      + فعالیت‌های تعبیه‌شده (کلمهٔ روز، تُن‌ها، فلش‌کارت‌ها، آزمون سطح)
//   ۳) Teaching Videos — ویدیوهای یوتیوب (کتابخانهٔ کامل در /teaching-videos)
//   ۴) Resources — فایل‌های رایگان + شبکه‌های اجتماعی
//
// تب Practice فقط امتحان‌هاست (/practice → /hsk-exams).
// ---------------------------------------------------------------------------

import { useEffect, useState } from 'react'
import { InstagramIcon, TelegramIcon } from '../brand-icons'
import { ResourcesSection } from '../ResourcesSection'
import { PracticeActivities } from '../practice/PracticeHub'
import { TeachingVideosSection } from '../TeachingVideosSection'
import { siteContent } from '@/content/site-content'
import type { PracticeActivity } from '@/lib/practice/registry'

const c = siteContent.learn

// 📚 شکل درس (محتوای واژگان + کارت) — از دیتابیس یا فایل محتوا
interface LessonContent {
  title: string
  subtitle: string
  words: { chinese: string; pinyin: string; meaning: string; example?: string }[]
}

interface LessonCard {
  category: string
  color: string
  tag: string
  big: string
  small: string
  title: string
  text: string
  action: string
  lesson: string
  isVideo?: boolean
}

export function LearnPage() {
  // 🗄️ درس‌ها از دیتابیس (تب Lessons پنل) — تا وقتی خالی باشد کارت‌های
  // پیش‌فرض فایل محتوا استفاده می‌شوند
  const [dbLessons, setDbLessons] = useState<
    (LessonContent & LessonCard & { slug: string })[] | null
  >(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/learn/lessons')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        if (Array.isArray(data.lessons) && data.lessons.length > 0) {
          setDbLessons(data.lessons)
        } else if (Array.isArray(data.lessons) && data.lessons.length === 0) {
          setDbLessons(null) // دیتابیس خالی شد → برگرد به محتوای پیش‌فرض
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const items: LessonCard[] = dbLessons
    ? dbLessons.map((l) => ({
        category: l.category,
        color: l.color,
        tag: l.tag,
        big: l.big,
        small: l.small,
        title: l.title,
        text: l.text,
        action: l.action,
        lesson: l.slug,
        isVideo: l.isVideo,
      }))
    : (c.items as unknown as LessonCard[])

  // 🎯 درخواست مالک: لغات داخل همان فیلتر تمرین‌ها — هر درس یک کارت در
  // گرید یکپارچه (دستهٔ Word Lessons) با لینک به صفحهٔ اختصاصی درس
  const lessonPracticeCards: PracticeActivity[] = items.map((item) => ({
    key: `lesson-${item.lesson}`,
    title: item.title,
    description: item.text,
    category: 'lessons',
    href: `/lesson/${encodeURIComponent(item.lesson)}`,
    icon: 'book',
    level: 'All levels',
    minutes: 10,
    action: item.action || 'Open the lesson',
    big: item.big,
  }))

  return (
    <div id="page-learn">
      {/* ================= هیرو ================= */}
      <section className="pt-32 pb-4 md:pt-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-5xl font-bold text-brown-dark mb-4">{c.title}</h1>
            <p className="text-brown-light max-w-2xl mx-auto">{c.subtitle}</p>
          </div>
        </div>
      </section>

      {/* ================= تمرین‌ها + لغات — یک بخش یکپارچه ================= */}
      {/* اولویت مالک: تمرین‌ها و مخصوصاً دورهٔ ۱۰ جلسه‌ای HSK 1 بالای صفحه؛
          لغات هم داخل همان فیلتر و گرید */}
      <PracticeActivities lessonCards={lessonPracticeCards} />

      {/* ================= ویدیوها + منابع ================= */}
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-6">
          {/* 🎬 درخواست مالک: ویدیوهای یوتیوب هم در تب Learn — کتابخانهٔ کامل در /teaching-videos */}
          <TeachingVideosSection />

          {/* 📚 کتابخانهٔ رایگان — فایل‌های آپلودی پنل (بدون منبع = بدون سکشن) */}
          <ResourcesSection />

          <div className="text-center mt-14">
            <div className="flex justify-center gap-4">
              <a
                href={siteContent.contact.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white px-5 py-2.5 rounded-full text-sm font-medium text-brown border border-sage-light/20 hover:border-sage transition-all cursor-pointer"
              >
                <InstagramIcon size={18} /> Instagram
              </a>
              <a
                href={siteContent.contact.socials.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white px-5 py-2.5 rounded-full text-sm font-medium text-brown border border-sage-light/20 hover:border-sage transition-all cursor-pointer"
              >
                <TelegramIcon size={18} /> Telegram
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
