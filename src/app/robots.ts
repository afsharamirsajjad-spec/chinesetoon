import type { MetadataRoute } from "next";
import { siteContent } from "@/content/site-content";

// ---------------------------------------------------------------------------
// 🤖 robots.txt — native Next.js 16 Metadata API.
//
// Policy (owner goal: discovery by classic search engines AND AI search):
//   • Search / answer crawlers — explicitly ALLOWED:
//       Googlebot            → Google Search (classic index)
//       OAI-SearchBot        → ChatGPT Search (fetches pages to answer+cite)
//       Claude-SearchBot     → Anthropic's search fetching
//       PerplexityBot        → Perplexity search/answers
//   • Model-training crawlers — ALLOWED but configured as INDEPENDENT groups,
//     because they are NOT required for search/AI-search visibility. Each can
//     be flipped to Disallow later without touching the search crawlers:
//       GPTBot               → OpenAI model training (independent of ChatGPT Search)
//       ClaudeBot            → Anthropic model training (distinct from Claude-SearchBot)
//       Google-Extended      → Gemini training (does NOT affect Google Search)
//   • The catch-all `*` keeps general access open for every other crawler
//     (Bingbot, Applebot, social scrapers, …).
//
// Only /api/* is disallowed — a genuine technical reason: JSON endpoints have
// no indexable content, they are rate-limited, and crawling them wastes crawl
// budget and pollutes error-rate signals. robots.txt is NOT access control:
// /api and private pages remain protected by auth + server-side authorization
// regardless of these rules (private HTML pages are kept crawlable on purpose
// so their `noindex` meta tag can be seen).
//
// The sitemap URL is the canonical https://www.chinesetoon.com/sitemap.xml
// (sourced from siteContent — the same single source as sitemap.ts and
// metadataBase — so the two can never drift apart on www/non-www).
// The former `host` directive was removed: it is a Yandex-only, non-standard
// directive and unnecessary here.
// ---------------------------------------------------------------------------

// /api/* is the only crawl exclusion shared by every group.
const DISALLOW_API = ["/api/"];

export default function robots(): MetadataRoute.Robots {
  const base = siteContent.contact.siteUrl.replace(/\/$/, "");
  const allowAll = { allow: "/", disallow: DISALLOW_API };
  return {
    rules: [
      // Catch-all first — every legitimate crawler not listed below.
      { userAgent: "*", ...allowAll },
      // 🔎 Search / answer crawlers
      { userAgent: "Googlebot", ...allowAll },
      { userAgent: "OAI-SearchBot", ...allowAll },
      { userAgent: "Claude-SearchBot", ...allowAll },
      { userAgent: "PerplexityBot", ...allowAll },
      // 🧠 Model-training crawlers (independent groups — see header comment)
      { userAgent: "GPTBot", ...allowAll },
      { userAgent: "ClaudeBot", ...allowAll },
      { userAgent: "Google-Extended", ...allowAll },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
