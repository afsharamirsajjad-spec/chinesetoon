import type { Metadata } from "next";
import { Suspense } from "react";
import { SupportScreen } from "@/components/site/screens";
import { siteContent } from "@/content/site-content";

const SITE_URL = siteContent.contact.siteUrl;

export const metadata: Metadata = {
  title: "Support & FAQ — Chinese Toon",
  description:
    "Answers to common questions about Chinese Toon classes, payments, scheduling and learning Mandarin — plus direct contact channels.",
  alternates: { canonical: `${SITE_URL}/support` },
};

// 🔍 FAQPage JSON-LD — منبع سؤالات: دیتابیس (تب FAQ پنل)؛ در دسترس نبودن DB
// همان سؤالات پیش‌فرض فایل محتوا (همان fallback خود صفحهٔ Support).
async function getFaqEntries(): Promise<{ question: string; answer: string }[]> {
  try {
    const { db } = await import("@/lib/db");
    const rows = await db.faqItem.findMany({
      where: { published: true, deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      take: 50,
    });
    if (rows.length > 0) {
      return rows.map((r) => ({ question: r.question, answer: r.answer }));
    }
  } catch {
    // دیتابیس در دسترس نیست — fallback
  }
  return siteContent.support.faq.items.map((it) => ({
    question: it.question,
    answer: it.answer,
  }));
}

function faqJsonLd(entries: { question: string; answer: string }[]): string {
  const graph = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((e) => ({
      "@type": "Question",
      name: e.question,
      acceptedAnswer: { "@type": "Answer", text: e.answer },
    })),
  };
  return JSON.stringify(graph).replace(/</g, "\\u003c");
}

export default async function Page() {
  const faqs = await getFaqEntries();
  return (
    <Suspense fallback={null}>
      {faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: faqJsonLd(faqs) }}
        />
      )}
      <SupportScreen />
    </Suspense>
  );
}
