import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAuthorized } from '@/lib/admin-auth'
import { ARTICLES } from '../../../../../scripts/seo-articles'

// ---------------------------------------------------------------------------
// 📰 POST /api/posts/seed-seo — ایمپورت یک‌جای مقاله‌های سئو از پنل ادمین
//
// همان منطق اسکریپت scripts/seed-blog-seo.ts: upsert بر اساس slug —
// views/createdAt حفظ می‌شوند و محتوای تازه جایگزین می‌شود. مقاله‌ها از
// scripts/seo-articles می‌آیند (یک منبع حقیقت مشترک با اسکریپت).
// دکمهٔ «Import SEO articles» تب Blog پنل این مسیر را صدا می‌زند تا مالک
// بدون دسترسی CLI هم بتواند مقاله‌ها را منتشر کند.
// ---------------------------------------------------------------------------

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    let imported = 0
    const slugs: string[] = []
    for (const p of ARTICLES) {
      const data = {
        title: p.title,
        tag: p.tag,
        emoji: p.emoji,
        color: p.color,
        excerpt: p.excerpt,
        content: p.content.trim(),
        published: true,
      }
      await db.post.upsert({
        where: { slug: p.slug },
        update: data,
        create: { slug: p.slug, ...data },
      })
      imported++
      slugs.push(p.slug)
    }
    return NextResponse.json({ ok: true, imported, slugs })
  } catch (err) {
    console.error('[POST /api/posts/seed-seo] error:', err)
    return NextResponse.json({ error: 'Could not import the articles — try again.' }, { status: 500 })
  }
}
