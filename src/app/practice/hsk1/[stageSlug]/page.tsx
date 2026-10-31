import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HskStageOverview } from "@/components/site/practice/hsk/HskStageOverview";
import { HSK1_STAGES } from "@/lib/practice/hsk/content";
import { siteContent } from "@/content/site-content";

const SITE_URL = siteContent.contact.siteUrl;

// 🗺️ HSK 1 stage overview — /practice/hsk1/stage-N (N = 1..10).
// The URL slug is "stage-N"; anything else is a 404. Statically generated
// for all 10 stages; stage locking is enforced client-side (progress gate)
// AND server-side (attempt submissions for locked stages are rejected).

export function generateStaticParams() {
  return HSK1_STAGES.map((s) => ({ stageSlug: `stage-${s.stage}` }));
}

function parseStage(slug: string): number | null {
  const m = /^stage-([1-9]|10)$/.exec(slug);
  return m ? Number(m[1]) : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ stageSlug: string }>;
}): Promise<Metadata> {
  const { stageSlug } = await params;
  const stage = parseStage(stageSlug);
  if (!stage) return {};
  const meta = HSK1_STAGES[stage - 1];
  const url = `${SITE_URL}/practice/hsk1/stage-${stage}`;
  return {
    title: `HSK 1 Stage ${stage}: ${meta.title} — Vocabulary, Grammar, Tones & Reading | Chinese Toon`,
    description: `${meta.description} Stage ${stage} of 10 teaches ${meta.words.length} HSK 1 words with ${meta.grammar.length} grammar topics, pronunciation drills and graded reading — free on Chinese Toon.`,
    alternates: { canonical: url },
    openGraph: {
      title: `HSK 1 Stage ${stage}: ${meta.title} — Chinese Toon`,
      description: meta.description,
      type: "website",
      url,
      siteName: "Chinese Toon",
      images: ["/images/og-image.png"],
    },
  };
}

export default async function Hsk1StagePage({
  params,
}: {
  params: Promise<{ stageSlug: string }>;
}) {
  const { stageSlug } = await params;
  const stage = parseStage(stageSlug);
  if (!stage) notFound();
  return <HskStageOverview stage={stage} />;
}
