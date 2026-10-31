import type { Metadata } from "next";
import { VideosLibrary } from "@/components/site/VideosLibrary";
import { siteContent } from "@/content/site-content";

const SITE_URL = siteContent.contact.siteUrl;

// 🎬 Teaching Samples — public YouTube library (/teaching-videos).
// Prospective students watch sample lessons before registering.
export const metadata: Metadata = {
  title: "Teaching Samples — Watch Real Chinese Lessons | Chinese Toon",
  description:
    "Watch real sample Chinese lessons from Chinese Toon teachers before you register — beginner classes, HSK lessons, grammar, pronunciation, group and private class samples.",
  alternates: { canonical: `${SITE_URL}/teaching-videos` },
  openGraph: {
    title: "Teaching Samples — Chinese Toon",
    description:
      "Sample Chinese lessons from our teachers — watch before you register.",
    type: "website",
    url: `${SITE_URL}/teaching-videos`,
    siteName: "Chinese Toon",
    images: ["/images/og-image.png"],
  },
};

export default function TeachingVideosPage() {
  return (
    <div id="page-videos">
      <section className="pt-32 pb-12 md:pt-40 md:pb-14 relative overflow-hidden bg-cream">
        <div
          aria-hidden="true"
          className="absolute -top-10 -left-20 w-72 h-72 bg-butter/25 rounded-full blur-3xl"
        ></div>
        <div className="char-bg top-12 right-[5%]" style={{ fontSize: "220px", opacity: 0.05 }} aria-hidden="true">
          教
        </div>
        <div className="max-w-4xl mx-auto px-6 relative text-center">
          <span className="inline-flex items-center gap-1.5 bg-sage-light/30 rounded-full px-4 py-1.5 mb-4 text-xs font-semibold uppercase tracking-widest text-sage-dark">
            🎬 Teaching Samples
          </span>
          <h1 className="text-3xl md:text-5xl font-bold text-brown-dark mb-4">
            Watch a Real Lesson First
          </h1>
          <p className="text-brown-light max-w-2xl mx-auto">
            See how our teachers actually teach before you register — sample
            group classes, private lessons, grammar and pronunciation clips.
          </p>
        </div>
      </section>
      <VideosLibrary />
    </div>
  );
}
