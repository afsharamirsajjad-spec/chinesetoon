import type { Metadata } from "next";
import { Suspense } from "react";
import { BlogScreen } from "@/components/site/screens";
import { siteContent } from "@/content/site-content";

const SITE_URL = siteContent.contact.siteUrl;

// 📰 مقالهٔ وبلاگ — عنوان/توضیح/زمان انتشار از دیتابیس؛ اگر مقاله نبود،
// همان لیست وبلاگ رندر می‌شود (رفتار قبلی SPA) و متادیتای عمومی می‌ماند.
async function getPost(slug: string) {
  try {
    const { db } = await import("@/lib/db");
    return await db.post.findUnique({ where: { slug } });
  } catch {
    return null; // دیتابیس در دسترس نیست — متادیتای عمومی
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  const title = post ? `${post.title} — Chinese Toon` : "Blog — Chinese Toon";
  const description =
    post?.excerpt || "News, culture, study tips and HSK guides from the Chinese Toon team.";
  const images = post?.image ? [post.image] : ["/images/og-image.png"];
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/blog/${slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      url: `${SITE_URL}/blog/${slug}`,
      siteName: "Chinese Toon",
      images,
      ...(post
        ? {
            publishedTime: post.createdAt.toISOString(),
            modifiedTime: post.updatedAt.toISOString(),
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  };
}

// 🔍 Article JSON-LD — دادهٔ ساخت‌یافتهٔ مقاله برای نتایج غنی گوگل
function articleJsonLd(post: {
  slug: string;
  title: string;
  excerpt: string;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}): string {
  const graph = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    ...(post.image ? { image: `${SITE_URL}${post.image}` } : {}),
    datePublished: post.createdAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    inLanguage: "en",
    author: { "@type": "Organization", name: "Chinese Toon", url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: "Chinese Toon",
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/images/og-image.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/blog/${post.slug}` },
  };
  return JSON.stringify(graph).replace(/</g, "\\u003c");
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  return (
    <Suspense fallback={null}>
      {post && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: articleJsonLd(post) }}
        />
      )}
      <BlogScreen slug={decodeURIComponent(slug)} />
    </Suspense>
  );
}
