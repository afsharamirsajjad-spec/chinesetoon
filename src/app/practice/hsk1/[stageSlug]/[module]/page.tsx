import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HskModulePage } from "@/components/site/practice/hsk/HskModulePage";
import { HSK1_STAGES } from "@/lib/practice/hsk/content";
import { HSK_MODULES, type HskModuleKind } from "@/lib/practice/hsk/types";
import { siteContent } from "@/content/site-content";

const SITE_URL = siteContent.contact.siteUrl;

// 📚 HSK 1 module page — /practice/hsk1/stage-N/<vocabulary|grammar|pronunciation|reading>
// A completely separate, refresh-safe, directly linkable page per module.
// 10 stages × 4 modules = 40 statically generated pages.

export function generateStaticParams() {
  const out: Array<{ stageSlug: string; module: string }> = [];
  for (const s of HSK1_STAGES) {
    for (const m of HSK_MODULES) {
      out.push({ stageSlug: `stage-${s.stage}`, module: m });
    }
  }
  return out;
}

function parseStage(slug: string): number | null {
  const m = /^stage-([1-9]|10)$/.exec(slug);
  return m ? Number(m[1]) : null;
}

const MODULE_LABELS: Record<HskModuleKind, string> = {
  vocabulary: "Vocabulary",
  grammar: "Grammar",
  pronunciation: "Pronunciation & Listening",
  reading: "Reading",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ stageSlug: string; module: string }>;
}): Promise<Metadata> {
  const { stageSlug, module } = await params;
  const stage = parseStage(stageSlug);
  if (!stage || !(HSK_MODULES as readonly string[]).includes(module)) return {};
  const kind = module as HskModuleKind;
  const meta = HSK1_STAGES[stage - 1];
  const url = `${SITE_URL}/practice/hsk1/stage-${stage}/${kind}`;
  const description =
    kind === "vocabulary"
      ? `Learn the ${meta.words.length} HSK 1 words of Stage ${stage} (${meta.title}) with audio, pinyin, examples and a graded test.`
      : kind === "grammar"
        ? `HSK 1 Stage ${stage} grammar: ${meta.grammar.map((g) => g.title).join(" · ")} — with examples, common mistakes and exercises.`
        : kind === "pronunciation"
          ? `HSK 1 Stage ${stage} pronunciation: ${meta.pronunciation.title} — listen and train tones, initials and finals.`
          : `HSK 1 Stage ${stage} reading: graded passages with pinyin, translation and comprehension questions.`;
  return {
    title: `HSK 1 Stage ${stage} ${MODULE_LABELS[kind]} — ${meta.title} | Chinese Toon`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `HSK 1 Stage ${stage} ${MODULE_LABELS[kind]} — Chinese Toon`,
      description,
      type: "website",
      url,
      siteName: "Chinese Toon",
      images: ["/images/og-image.png"],
    },
  };
}

export default async function Hsk1ModuleRoute({
  params,
}: {
  params: Promise<{ stageSlug: string; module: string }>;
}) {
  const { stageSlug, module } = await params;
  const stage = parseStage(stageSlug);
  if (!stage || !(HSK_MODULES as readonly string[]).includes(module)) notFound();
  return <HskModulePage stage={stage} module={module as HskModuleKind} />;
}
