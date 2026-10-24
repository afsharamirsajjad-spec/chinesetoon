import type { Metadata } from "next";
import { Suspense } from "react";
import { ClassesScreen } from "@/components/site/screens";
import { siteContent } from "@/content/site-content";

const SITE_URL = siteContent.contact.siteUrl;

// 🎓 دیپ‌لینک کلاس تکی — همان نمای Classes با دیالوگ بازِ همان کلاس.
// 🔍 سئو: کلاس‌های HSK 1 تا 5 صفحات مقصدهای جست‌وجوی ارزشمندی‌اند («HSK 1
// course», «HSK 3 class online» و…) — عنوان/توضیح/قیمت از دیتابیس می‌آید،
// canonical به خود صفحه است و Course JSON-LD (با offer قیمت) اضافه می‌شود.
// کلاس ناموجود/آرشیوشده → همان متادیتای noindex قبلی (بدون محتوای قلابی).
async function getClass(slug: string) {
  try {
    const { db } = await import("@/lib/db");
    return await db.courseClass.findUnique({
      where: { slug },
      select: {
        slug: true,
        title: true,
        shortDescription: true,
        level: true,
        classType: true,
        packagePrice: true,
        packageSessions: true,
        sessionDurationMin: true,
        image: true,
        status: true,
        updatedAt: true,
      },
    });
  } catch {
    return null; // دیتابیس در دسترس نیست — fallback امن
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const klass = await getClass(slug);
  const indexable = klass && klass.status === 'active';
  const title = indexable ? `${klass.title} — Online Chinese Course` : "Class — Chinese Toon";
  const description =
    indexable
      ? klass.shortDescription ||
        `${klass.level} Mandarin course — ${klass.packageSessions} live online sessions with Chinese Toon teachers.`
      : "Class details, schedule and pricing — Chinese Toon Mandarin classes.";
  return {
    title,
    description,
    robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
    alternates: { canonical: indexable ? `${SITE_URL}/classes/${slug}` : `${SITE_URL}/classes` },
    openGraph: indexable
      ? {
          title,
          description,
          type: "website",
          url: `${SITE_URL}/classes/${slug}`,
          siteName: "Chinese Toon",
          images: [klass.image || "/images/og-image.png"],
        }
      : undefined,
    twitter: indexable
      ? { card: "summary_large_image", title, description, images: [klass.image || "/images/og-image.png"] }
      : undefined,
  };
}

// 🔍 Course JSON-LD — دوره + پیشنهاد قیمت برای نتایج غنی گوگل
function courseJsonLd(klass: NonNullable<Awaited<ReturnType<typeof getClass>>>): string {
  const graph = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: klass.title,
    description: klass.shortDescription || `${klass.level} Mandarin Chinese course.`,
    inLanguage: "en",
    provider: {
      "@type": "Organization",
      name: "Chinese Toon",
      url: SITE_URL,
      sameAs: [
        siteContent.contact.socials.instagram,
        siteContent.contact.socials.telegram,
      ],
    },
    ...(klass.packagePrice > 0
      ? {
          offers: {
            "@type": "Offer",
            price: klass.packagePrice.toFixed(2),
            priceCurrency: "USD",
            category: `${klass.packageSessions} online sessions`,
            availability: "https://schema.org/InStock",
          },
        }
      : {}),
    url: `${SITE_URL}/classes/${klass.slug}`,
  };
  return JSON.stringify(graph).replace(/</g, "\\u003c");
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const valid = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
  const klass = valid ? await getClass(slug) : null;
  const indexable = klass && klass.status === 'active';
  return (
    <Suspense fallback={null}>
      {indexable && klass && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: courseJsonLd(klass) }}
        />
      )}
      <ClassesScreen initialSlug={valid ? slug : ""} />
    </Suspense>
  );
}
