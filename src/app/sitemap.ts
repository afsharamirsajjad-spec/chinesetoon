import type { MetadataRoute } from "next";
import { siteContent } from "@/content/site-content";

// ---------------------------------------------------------------------------
// 🗺️ sitemap.xml — روت‌های واقعی App Router + محتوای عمومی دیتابیس.
//
// صفحات ثابت عمومی:
//   /  /classes  /learn  /about  /blog  /reviews  /support  /register
// محتوای پویا (فقطِ عمومی/منتشرشده — با هر تغییر پنل، خودکار آپدیت می‌شود):
//   /classes/<slug>  ← CourseClass با status=active (صفحات غیر active خودشان
//                      noindex هستند — اینجا هم نمی‌آیند)
//   /lesson/<slug>   ← Lesson با published=true (صفحهٔ عمومی ایندکس‌پذیر؛
//                      مدل Lesson ستون updatedAt ندارد، پس lastModified برایش
//                      ساخته نمی‌شود — تاریخ جعل نمی‌شود)
//   /blog/<slug>     ← Post با published=true (با updatedAt معتبر)
//
// روت‌های خصوصی عمداً اینجا نیستند (همگی noindex و/یا پشت احراز هویت‌اند):
//   /account /admin /student /teacher /pay/* /forgot-password /reset-password
//   و همهٔ /api/* — همچنین quiz ها (درون صفحهٔ /learn رندر می‌شوند، روت
//   مستقل ندارند) و FAQ (درون /support).
//
// دامنهٔ canonical (https://www.chinesetoon.com) از siteContent می‌آید — همان
// منبع robots.ts و metadataBase — تا www/non-www هرگز واگرا نشود.
//
// ⚙️ revalidate: هر ساعت دوباره ساخته می‌شود (روی Vercel پس از اولین درخواست)
// تا محتوای جدید پنل ادمین بدون deploy تازه وارد/خارج sitemap شود. اگر
// دیتابیس در دسترس نباشد، sitemap فقط با روت‌های ثابت ساخته می‌شود (هرگز
// خطا نمی‌دهد). تعداد URLها (< ۱۰۰۰) بسیار زیر سقف ۵۰هزار URL گوگل است؛
// اگر روزی از سقف گذشت، باید به sitemap-index شکسته شود.
// ---------------------------------------------------------------------------

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteContent.contact.siteUrl.replace(/\/$/, "");

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/classes`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/learn`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/practice`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/blog`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/reviews`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${base}/support`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/register`, changeFrequency: "monthly", priority: 0.7 },
  ];

  let blogPosts: MetadataRoute.Sitemap = [];
  let classPages: MetadataRoute.Sitemap = [];
  let lessonPages: MetadataRoute.Sitemap = [];
  try {
    const { db } = await import("@/lib/db");
    const [posts, classes, lessons] = await Promise.all([
      db.post.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 500,
      }),
      // 🔍 صفحات کلاس‌های فعال — مقصدهای جست‌وجو («HSK 1 course» و…)
      db.courseClass.findMany({
        where: { status: "active" },
        select: { slug: true, updatedAt: true },
        orderBy: { sortOrder: "asc" },
        take: 100,
      }),
      // 📚 درس‌های منتشرشدهٔ عمومی — /learn به هر درس لینک می‌دهد
      db.lesson.findMany({
        where: { published: true },
        select: { slug: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        take: 500,
      }),
    ]);
    blogPosts = posts.map((p) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
    classPages = classes.map((c) => ({
      url: `${base}/classes/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
    // Lesson ستون updatedAt ندارد → lastModified حذف می‌شود (تاریخ جعل نمی‌شود)
    lessonPages = lessons.map((l) => ({
      url: `${base}/lesson/${l.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch {
    // دیتابیس در دسترس نیست — sitemap بدون محتوای پویا معتبر می‌ماند
  }

  // 🔁 ضد URL تکراری (نباید پیش بیاید؛ slug ها یکتا و پیشوندها متمایزند)
  const seen = new Set<string>();
  return [...staticRoutes, ...classPages, ...lessonPages, ...blogPosts].filter((e) => {
    if (seen.has(e.url)) return false;
    seen.add(e.url);
    return true;
  });
}
