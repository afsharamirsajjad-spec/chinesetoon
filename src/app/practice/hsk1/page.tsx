import type { Metadata } from "next";
import { HskDashboard } from "@/components/site/practice/hsk/HskDashboard";
import { siteContent } from "@/content/site-content";

const SITE_URL = siteContent.contact.siteUrl;

// 🎯 HSK 1 Practice — structured course dashboard (/practice/hsk1).
// Public, indexable page; personal progress is loaded client-side and never
// rendered into the HTML for crawlers.
export const metadata: Metadata = {
  title: "HSK 1 Practice Course — 10 Stages of Vocabulary, Grammar, Tones & Reading | Chinese Toon",
  description:
    "Learn all of HSK 1 in 10 progressive stages: the complete 150-word vocabulary, beginner grammar, pinyin and tones with audio, and graded reading passages. Pass each module to unlock the next stage — free on Chinese Toon.",
  alternates: { canonical: `${SITE_URL}/practice/hsk1` },
  openGraph: {
    title: "HSK 1 Practice Course — Chinese Toon",
    description:
      "The complete HSK 1 curriculum in 10 stages: 150 words, grammar, pronunciation and reading with real exercises and progress tracking.",
    type: "website",
    url: `${SITE_URL}/practice/hsk1`,
    siteName: "Chinese Toon",
    images: ["/images/og-image.png"],
  },
};

export default function Hsk1Page() {
  return <HskDashboard />;
}
