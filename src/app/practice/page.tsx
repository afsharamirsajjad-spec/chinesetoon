import type { Metadata } from "next";
import { PracticeHub } from "@/components/site/practice/PracticeHub";
import { siteContent } from "@/content/site-content";

const SITE_URL = siteContent.contact.siteUrl;

// 🧭 Practice Hub — صفحهٔ مرکزی تمرین: فلش‌کارت‌ها، بازی تُن‌ها، کلمهٔ روز،
// درس‌های واژگان و آزمون تعیین سطح (لینک به موتورهای واقعی موجود).
// پیشرفت شخصی فقط برای کاربر واردشده ذخیره/نمایش داده می‌شود؛ خود صفحه
// عمومی و ایندکس‌پذیر است (داشبورد شخصی داده‌ای ایندکس‌شدنی ندارد).
export const metadata: Metadata = {
  title: "Practice Chinese — Flashcards, Tones, Quizzes & Daily Words | Chinese Toon",
  description:
    "Practice Mandarin every day in one place: vocabulary flashcards, the daily Chinese word, tone-listening games, interactive word lessons and the Chinese level quiz — free on Chinese Toon.",
  alternates: { canonical: `${SITE_URL}/practice` },
  openGraph: {
    title: "Practice Your Chinese — Chinese Toon",
    description:
      "Flashcards, daily words, tone practice, lessons and the level quiz — all your Mandarin practice in one hub.",
    type: "website",
    url: `${SITE_URL}/practice`,
    siteName: "Chinese Toon",
    images: ["/images/og-image.png"],
  },
};

export default function PracticePage() {
  return <PracticeHub />;
}
