import type { Metadata } from "next";
import { HskExamHub } from "@/components/site/HskExamHub";
import { siteContent } from "@/content/site-content";

const SITE_URL = siteContent.contact.siteUrl;

// 📝 HSK Exam Preparation hub (/hsk-exams) — mock exams under real exam
// conditions. Public, indexable; personal scores load client-side.
export const metadata: Metadata = {
  title: "HSK Mock Exams — Real Exam Practice | Chinese Toon",
  description:
    "Take HSK mock exams under real conditions — server-enforced timers, autosaved progress, listening and reading sections, instant scoring with per-skill breakdown and answer review.",
  alternates: { canonical: `${SITE_URL}/hsk-exams` },
  openGraph: {
    title: "HSK Mock Exams — Chinese Toon",
    description: "Rehearse the real HSK exam: timed mock exams with instant scoring and answer review.",
    type: "website",
    url: `${SITE_URL}/hsk-exams`,
    siteName: "Chinese Toon",
    images: ["/images/og-image.png"],
  },
};

export default function HskExamsPage() {
  return <HskExamHub />;
}
