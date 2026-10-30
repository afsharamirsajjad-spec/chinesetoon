import type { Metadata } from "next";
import { ExamsHub } from "@/components/site/exams/ExamsHub";
import { siteContent } from "@/content/site-content";

const SITE_URL = siteContent.contact.siteUrl;

// 📝 آزمون‌ها (HSK-مانند) — فهرست عمومی + اجرای آزمون با نمره‌دهی سمت سرور.
// صفحهٔ عمومی و ایندکس‌پذیر؛ سؤالات/پاسخ‌ها از /api/exams می‌آیند.
export const metadata: Metadata = {
  title: "Chinese Exams — HSK-style Mock Tests | Chinese Toon",
  description:
    "Take HSK-style Chinese mock exams online — timed multiple-choice questions, server-graded scoring and an instant score with full answer review. Free on Chinese Toon.",
  alternates: { canonical: `${SITE_URL}/exams` },
  openGraph: {
    title: "Test Your Chinese — Chinese Toon Exam Hall",
    description:
      "HSK-style mock exams with instant server-graded scores and full answer review.",
    type: "website",
    url: `${SITE_URL}/exams`,
    siteName: "Chinese Toon",
    images: ["/images/og-image.png"],
  },
};

export default function ExamsPage() {
  return <ExamsHub />;
}
