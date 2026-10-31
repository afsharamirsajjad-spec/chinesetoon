import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { youTubeEmbedUrl, youTubeThumbnailUrl, VIDEO_LEVEL_LABELS, VIDEO_CATEGORY_LABELS } from "@/lib/videos";
import { siteContent } from "@/content/site-content";

const SITE_URL = siteContent.contact.siteUrl;

// 🎬 Individual teaching-video page — /teaching-videos/[id]
// Server-rendered from the DB (revalidated every 5 minutes) with a safe
// youtube-nocookie embed, related videos and a registration CTA. SEO-friendly
// with per-video metadata and Video JSON-LD.

export const revalidate = 300;

async function getVideo(id: string) {
  if (!/^[a-z0-9]{20,40}$/i.test(id)) return null;
  try {
    const row = await db.teachingVideo.findUnique({ where: { id } });
    return row && row.published ? row : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const video = await getVideo(id);
  if (!video) return {};
  const url = `${SITE_URL}/teaching-videos/${video.id}`;
  const description =
    (video.description ? `${video.description.slice(0, 150)} ` : "") +
    (video.teacher ? `Taught by ${video.teacher}. ` : "") +
    "A free sample lesson from Chinese Toon.";
  return {
    title: `${video.title} — Teaching Sample | Chinese Toon`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: video.title,
      description,
      type: "video.other",
      url,
      siteName: "Chinese Toon",
      images: [{ url: youTubeThumbnailUrl(video.youtubeId), width: 480, height: 360, alt: video.title }],
    },
  };
}

export default async function TeachingVideoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const video = await getVideo(id);
  if (!video) notFound();

  let related: Array<{ id: string; title: string; youtubeId: string; teacher: string }> = [];
  try {
    const rows = await db.teachingVideo.findMany({
      where: { published: true, id: { not: video.id } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: 3,
    });
    related = rows.map((r) => ({ id: r.id, title: r.title, youtubeId: r.youtubeId, teacher: r.teacher }));
  } catch {
    related = [];
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.title,
    description: video.description || `Chinese teaching sample by ${video.teacher || "Chinese Toon"}`,
    thumbnailUrl: [youTubeThumbnailUrl(video.youtubeId)],
    embedUrl: youTubeEmbedUrl(video.youtubeId),
    uploadDate: video.createdAt.toISOString(),
  };

  return (
    <div id="page-video-detail">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <section className="pt-32 pb-16 relative overflow-hidden bg-cream">
        <div className="max-w-5xl mx-auto px-6 relative">
          <nav aria-label="Breadcrumb" className="text-xs text-brown-light mb-6">
            <Link href="/teaching-videos" className="hover:text-sage-dark transition-colors">
              Teaching Samples
            </Link>
            <span className="mx-1.5">/</span>
            <span className="font-semibold text-brown">{video.title}</span>
          </nav>

          <div className="bg-black rounded-3xl overflow-hidden shadow-lg aspect-video">
            <iframe
              src={youTubeEmbedUrl(video.youtubeId)}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              className="w-full h-full border-0"
            />
          </div>

          <div className="mt-6">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold mb-3">
              <span className="bg-sage-light/30 rounded-full px-3 py-1 text-sage-dark">
                {VIDEO_LEVEL_LABELS[video.level] ?? video.level}
              </span>
              <span className="bg-cream rounded-full px-3 py-1 text-brown">
                {VIDEO_CATEGORY_LABELS[video.category] ?? video.category}
              </span>
              {video.durationLabel && (
                <span className="bg-cream rounded-full px-3 py-1 text-brown">{video.durationLabel}</span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-brown-dark mb-2">{video.title}</h1>
            {video.teacher && <p className="text-sm font-semibold text-sage-dark mb-3">Teacher: {video.teacher}</p>}
            {video.description && <p className="text-sm text-brown leading-relaxed max-w-3xl">{video.description}</p>}

            <div className="mt-8 bg-sage-light/25 border border-sage/30 rounded-3xl p-6 text-center">
              <p className="text-sm font-bold text-brown-dark mb-2">Enjoyed this sample?</p>
              <p className="text-sm text-brown-light mb-4">
                Register for a course and learn with our teachers live.
              </p>
              <Link
                href="/classes"
                className="inline-flex items-center gap-2 bg-sage text-brown-dark px-6 py-3 rounded-full text-sm font-bold hover:bg-sage-dark transition-colors cursor-pointer min-h-[44px]"
              >
                Explore Chinese Toon courses →
              </Link>
            </div>

            {related.length > 0 && (
              <div className="mt-12">
                <h2 className="text-base font-bold text-brown-dark mb-4">More teaching samples</h2>
                <div className="grid sm:grid-cols-3 gap-4">
                  {related.map((r) => (
                    <Link
                      key={r.id}
                      href={`/teaching-videos/${r.id}`}
                      className="group bg-white rounded-2xl border border-sage-light/20 overflow-hidden card-hover"
                    >
                      <div className="aspect-video bg-cream-dark relative">
                        { }
                        <img src={youTubeThumbnailUrl(r.youtubeId)} alt={r.title} loading="lazy" className="w-full h-full object-cover" />
                      </div>
                      <div className="p-3.5">
                        <p className="text-sm font-bold text-brown-dark group-hover:text-sage-dark transition-colors leading-snug">
                          {r.title}
                        </p>
                        {r.teacher && <p className="text-[11px] text-brown-light mt-1">{r.teacher}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
