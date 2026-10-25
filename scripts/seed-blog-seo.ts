// ---------------------------------------------------------------------------
// 📝 Seed ایدمپوتنت ۵ مقالهٔ سئوی بلند → جدول Post
//
// الگوی فاز ۷۵ (seed-blog-task75.ts) را دنبال می‌کند: upsert بر اساس slug
// یکتا — views/createdAt مقاله‌های موجود حفظ می‌شود، اجرای دوباره امن است
// و به هیچ مقالهٔ دیگری دست نمی‌زند.
//
// حالت‌ها:
//   bun scripts/seed-blog-seo.ts          → انتشار واقعی (DATABASE_URL لازم)
//   bun scripts/seed-blog-seo.ts --check  → بدون دیتابیس: اعتبارسنجی قالب،
//                                           شمارش واژه و لینک‌های داخلی
//
// قالب محتوا: بلوک‌ها با خط خالی؛ «## » تیتر؛ «### » زیرتیتر؛ «• » لیست؛
// **بولد**؛ [متن](آدرس) لینک (داخلی با / شروع می‌شود)؛ جدول markdown با |---|.
// لینک‌های داخلی در برابر فهرست مسیرهای واقعی سایت اعتبارسنجی می‌شوند —
// اسکریپت با لینک شکست ۴۰۴ exit می‌کند.
// ---------------------------------------------------------------------------

import { PrismaClient } from '@prisma/client'
import { parseTable } from '../src/lib/blog-format'
import { HSK_EXAM } from './seo-articles/hsk-exam-guide'
import { SCHOLARSHIPS } from './seo-articles/china-scholarships'
import { BEGINNERS } from './seo-articles/learn-chinese-beginners'
import { STUDY_IN_CHINA } from './seo-articles/study-in-china'
import { HSK1 } from './seo-articles/hsk-1-study-guide'
import type { SeedPost } from './seo-articles/types'

export const ARTICLES: SeedPost[] = [HSK_EXAM, SCHOLARSHIPS, BEGINNERS, STUDY_IN_CHINA, HSK1]

// 🗺️ مسیرهای مجاز لینک داخلی — هر آدرس باید یکی از این‌ها یا یکی از slugهای
// پویای زیر باشد (کلاس‌ها/درس‌ها/مقالات واقعی سایت)
const STATIC_PATHS = new Set([
  '/',
  '/classes',
  '/learn',
  '/about',
  '/blog',
  '/reviews',
  '/support',
  '/register',
  '/blog/complete-guide-to-hsk-exam',
  '/blog/china-scholarships-for-international-students',
  '/blog/how-to-learn-chinese-for-beginners',
  '/blog/study-in-china-guide',
  '/blog/hsk-1-study-guide',
  // مقاله‌های موجود (فاز ۶۹/۷۵)
  '/blog/how-long-to-learn-chinese',
  '/blog/20-essential-chinese-phrases',
  '/blog/chinese-tones-beginners-guide',
  '/blog/hsk-explained-levels',
  '/blog/introduce-yourself-in-chinese',
  '/blog/10-common-chinese-words',
  '/blog/mandarin-vs-english',
  '/blog/learn-chinese-15-minutes-a-day',
  '/blog/chinese-culture-through-language',
  '/blog/10-expressions-literal-meaning',
  '/blog/chinese-numbers-explained',
  '/blog/order-food-in-chinese',
  '/blog/pinyin-pronunciation-tricky-sounds',
  '/blog/chinese-measure-words-guide',
  '/blog/shopping-bargaining-chinese',
  '/blog/chinese-names-explained',
])

const CHECK_MODE = process.argv.includes('--check')

function validate(p: SeedPost): string[] {
  const warnings: string[] = []
  const content = p.content.trim()
  const blocks = content.split(/\n{2,}/).filter(Boolean)
  const headings = blocks.filter((b) => b.startsWith('## '))

  if (headings.length < 6) warnings.push(`too few section headings (${headings.length})`)
  if (headings.length > 16) warnings.push(`too many section headings (${headings.length})`)
  if (!headings.some((h) => h.toLowerCase().includes('takeaway'))) warnings.push('no takeaway section')
  if (!headings.some((h) => h.toLowerCase().includes('frequently asked'))) warnings.push('no FAQ section')
  if (content.length < 9000) warnings.push(`content length = ${content.length} (< 9000 chars)`)
  if (p.excerpt.length < 120 || p.excerpt.length > 210)
    warnings.push(`excerpt length = ${p.excerpt.length} (expected 120–210 chars for meta description)`)

  // قاعده‌ها «هر خط» چک می‌شوند نه هر بلوک — تیترهای ##/### و لیست شماره‌دار
  // (به‌صورت پاراگراف با عدد رندر می‌شود) مجازند؛ لیست با -/* و نقل‌قول ممنوع
  const lines = content.split('\n')
  for (const line of lines) {
    if (/^[-*]\s|^>/.test(line)) warnings.push(`forbidden markdown line: ${line.slice(0, 50)}`)
  }
  if (/<\/?[a-z]+>/i.test(content)) warnings.push('HTML detected in content')

  // جدول‌ها ساختار معتبر دارند؟
  for (const b of blocks) {
    if (b.includes('\n|') || b.startsWith('|')) {
      const t = parseTable(b)
      if (!t) warnings.push(`malformed table block: ${b.slice(0, 60)}`)
    }
  }

  // لینک‌ها — داخلی در برابر مسیرهای مجاز
  const linkRe = /\[([^\]]+)\]\(([^)\s]+)\)/g
  let m: RegExpExecArray | null
  while ((m = linkRe.exec(content))) {
    const href = m[2]
    if (href.startsWith('/')) {
      if (!STATIC_PATHS.has(href)) warnings.push(`internal link to unknown path: ${href}`)
    } else if (!/^https:\/\//.test(href)) {
      warnings.push(`non-https external link: ${href}`)
    }
  }
  if (/https?:\/\/(?!www\.chinesetest\.cn|www\.campuschina\.org|us\.china-embassy\.gov\.cn)/.test(content))
    warnings.push('external domain outside the allowlist (verify it is official before adding)')

  return warnings
}

async function checkMode(): Promise<number> {
  let bad = 0
  for (const p of ARTICLES) {
    const w = validate(p)
    const words = p.content
      .replace(/[\u4e00-\u9fff]/g, ' ')
      .split(/\s+/)
      .filter(Boolean).length + (p.content.match(/[\u4e00-\u9fff]/g) || []).length
    console.log(`${w.length ? '⚠️' : '✅'} ${p.slug} — ~${words} words, ${w.length} warning(s)`)
    for (const x of w) {
      console.log(`   • ${x}`)
      bad++
    }
  }
  console.log(`\n${bad ? `${bad} problem(s) found — fix before seeding` : 'All articles valid'}`)
  return bad ? 1 : 0
}

async function seed(): Promise<void> {
  const db = new PrismaClient()
  let upserted = 0
  try {
    for (const p of ARTICLES) {
      const w = validate(p)
      if (w.length) {
        console.error(`⛔ ${p.slug} failed validation — not published:`)
        for (const x of w) console.error(`   • ${x}`)
        process.exitCode = 1
        continue
      }
      await db.post.upsert({
        where: { slug: p.slug },
        update: { title: p.title, tag: p.tag, emoji: p.emoji, color: p.color, excerpt: p.excerpt, content: p.content.trim(), published: true },
        create: { slug: p.slug, title: p.title, tag: p.tag, emoji: p.emoji, color: p.color, excerpt: p.excerpt, content: p.content.trim(), published: true },
      })
      upserted++
      console.log(`✅ upserted: ${p.emoji} ${p.slug} (${p.tag}/${p.color})`)
    }
    console.log(`\nDone — ${upserted}/${ARTICLES.length} articles published, total ${await db.post.count()} posts`)
  } finally {
    await db.$disconnect()
  }
}

if (CHECK_MODE) {
  checkMode().then((code) => (process.exitCode = code))
} else {
  seed().catch((e) => {
    console.error('Seed failed:', e instanceof Error ? e.message : e)
    process.exitCode = 1
  })
}
