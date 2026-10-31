import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { HskExamRunner } from "@/components/site/HskExamRunner";
import { siteContent } from "@/content/site-content";

const SITE_URL = siteContent.contact.siteUrl;

// 📝 Individual exam page — /hsk-exams/[slug]. The runner loads (and starts or
// resumes) the attempt client-side; answers/keys never appear in the HTML.

export const dynamic = "force-dynamic";

async function getExam(slug: string) {
  if (!slug || slug.length > 80) return null;
  try {
    return await db.hskExam.findUnique({ where: { slug }, select: { id: true, title: true, description: true, level: true, published: true } });
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const exam = await getExam(slug);
  if (!exam || !exam.published) return {};
  const url = `${SITE_URL}/hsk-exams/${slug}`;
  return {
    title: `${exam.title} — HSK Mock Exam | Chinese Toon`,
    description: exam.description || `Take “${exam.title}” under real exam conditions — timed, autosaved and graded instantly.`,
    alternates: { canonical: url },
    openGraph: {
      title: exam.title,
      description: exam.description || "HSK mock exam on Chinese Toon",
      type: "website",
      url,
      siteName: "Chinese Toon",
      images: ["/images/og-image.png"],
    },
  };
}

export default async function HskExamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const exam = await getExam(slug);
  if (!exam || !exam.published) notFound();

  return (
    <div id="page-hsk-exam">
      <section className="pt-32 pb-16 relative overflow-hidden bg-cream">
        <div className="max-w-4xl mx-auto px-6 relative">
          <nav aria-label="Breadcrumb" className="text-xs text-brown-light mb-6">
            <Link href="/hsk-exams" className="hover:text-sage-dark transition-colors">
              HSK Exams
            </Link>
            <span className="mx-1.5">/</span>
            <span className="font-semibold text-brown">{exam.title}</span>
          </nav>
          <HskExamRunner slug={slug} />
        </div>
      </section>
    </div>
  );
}
