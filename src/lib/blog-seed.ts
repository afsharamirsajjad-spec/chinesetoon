// ---------------------------------------------------------------------------
// 📰 سیدر مقاله‌های وبلاگ — ۴ مقالهٔ سئو-محور (idempotent)
// با slug پایدار upsert می‌شوند؛ فقط وقتی غایب‌اند ساخته می‌شوند (update خالی —
// ویرایش‌های بعدی ادمین هرگز بازنویسی نمی‌شود). در استارت‌آپ PostgreSQL صدا
// زده می‌شود (همراه ensureHskCatalog) تا بدون دستور دستی روی Neon بنشینند.
// ---------------------------------------------------------------------------

import { db } from '@/lib/db'

interface SeedPost {
  title: string
  slug: string
  tag: 'news' | 'culture' | 'tips' | 'hsk'
  emoji: string
  color: 'sage' | 'butter' | 'peach'
  image: string
  excerpt: string
  content: string
}

const SEED_POSTS: SeedPost[] = [
  {
    title: 'How to Learn Chinese Fast: A Realistic 6-Month Roadmap',
    slug: 'learn-chinese-fast-6-month-roadmap',
    tag: 'tips',
    emoji: '🚀',
    color: 'sage',
    image: '/images/blog/study-habits.png',
    excerpt:
      'Six months is enough to hold real conversations in Mandarin — if you follow the right order. Here is the week-by-week roadmap our teachers actually use with beginners.',
    content: `Most people believe learning Chinese takes years before you can say anything useful. That is only true if you study in the wrong order. Our teachers have walked hundreds of beginners from zero to real conversations, and the ones who make it in six months all follow the same pattern.

**Months 1–2: Sound before symbols.** Spend your first weeks entirely on pinyin and the four tones. It feels slow, but every hour here saves ten later. If your tones are shaky, everything you learn afterwards will be mispronounced and hard to fix. Ten minutes of tone drills a day is enough — the key is daily contact, not marathon sessions.

**Months 2–3: The first 300 words, in context.** Learn words inside sentences you would actually say, never as isolated flashcards. "I want...", "How much is...", "Can you say that again?" — these patterns carry you through most daily situations. Aim for roughly ten new words a day, always with audio.

**Months 3–4: Start speaking with a real person.** This is the step most learners postpone for years. A weekly small-group class or one-on-one session forces retrieval — the moment your brain must produce Chinese under mild pressure is the moment it actually sticks.

**Months 4–5: Characters, the smart way.** Now that you speak in sentences, characters stop being noise and start being records of words you already know. Learn the 150–300 most frequent radicals and characters first; frequency-ordered learning is dramatically faster than textbook order.

**Months 6: Consolidate and test yourself.** Try a real HSK 1 or HSK 2 mock exam. Passing is nice, but the real value is discovering exactly which skill — listening, reading, or production — needs your next block of effort.

The roadmap is simple; the discipline is the hard part. That is exactly why a fixed weekly class with a teacher who notices when you skip tone practice beats any app. If you want the guided version of this plan, our HSK 1 Beginner course follows it week by week.`,
  },
  {
    title: 'HSK 1 to HSK 5: What Each Level Really Means',
    slug: 'hsk-1-to-hsk-5-levels-explained',
    tag: 'hsk',
    emoji: '🎯',
    color: 'butter',
    image: '/images/blog/hsk1-course.png',
    excerpt:
      'What can you actually DO at HSK 1, 2, 3, 4 or 5? A practical guide with vocabulary counts, real-life milestones, and how long each level takes with focused study.',
    content: `HSK (Hanyu Shuiping Kaoshi) is the most widely recognized Mandarin proficiency test. But the official level names — "beginner", "elementary", "intermediate" — tell you very little. Here is what each level means in terms of things you can actually do.

**HSK 1 — Survival basics.** About 150 words. You can introduce yourself, count, order food, and understand very slow, clear speech on familiar topics. This is the level where tones click and the fear of speaking disappears. With 3–4 focused hours a week, most learners reach it in 2–3 months.

**HSK 2 — Daily conversations.** Roughly 300 words. You can handle shopping, directions, schedules, and simple exchanges about family and work. Sentences start connecting with 因为…所以 (because...so) and 虽然…但是 (although...but). Typical timeline: another 2–3 months.

**HSK 3 — Independence.** Around 600 words. This is the first level where life in China becomes genuinely comfortable: phone calls, short messages, following most everyday conversations. Grammar expands fast here, and this is where serious listening practice pays off.

**HSK 4 — Opinions and abstraction.** About 1,200 words. You can discuss feelings, give reasons, read news summaries, and write structured paragraphs. Many employers treat HSK 4 as the "professionally useful" threshold. Expect 6–9 months of steady work from HSK 3.

**HSK 5 — Fluency territory.** Roughly 2,500 words. You can follow films without subtitles (mostly), read novels with a dictionary, and write essays. Chinese media becomes a learning source instead of a wall.

The mistake we see most often is skipping levels to "save time". Each HSK level is built on the previous one's sentence patterns — a shaky HSK 2 makes HSK 4 twice as hard. Our classes follow the levels one by one, so at any point you know exactly where you stand and what comes next.`,
  },
  {
    title: '10 Chinese Greetings You Will Actually Use Every Day',
    slug: '10-chinese-greetings-you-actually-use',
    tag: 'culture',
    emoji: '👋',
    color: 'peach',
    image: '/images/blog/real-greetings.png',
    excerpt:
      'Textbook greetings vs. how people really talk. Ten everyday Chinese greetings with pinyin, tone marks and exactly when to use each one.',
    content: `Every Chinese course starts with 你好 (nǐ hǎo) — and then you arrive in China and discover most people don't greet each other with it. Here are the greetings that actually fill a normal day.

**1. 你好 (nǐ hǎo)** — the polite hello. Use it with strangers, in shops, or formal settings. With friends it sounds slightly stiff, like saying "good day" to your flatmate.

**2. 早 / 早上好 (zǎo / zǎoshang hǎo)** — "morning!" The casual version 早 is what colleagues actually say to each other every single morning.

**3. 吃了吗？(chī le ma?)** — "Have you eaten?" Not a question about food. A warm, old-school greeting, especially from older people. Answer 吃了，你呢？(chī le, nǐ ne?) regardless of the truth.

**4. 最近怎么样？(zuìjìn zěnmeyàng?)** — "How have you been lately?" Your default greeting for anyone you haven't seen in a while.

**5. 好久不见！(hǎojiǔ bújiàn!)** — "Long time no see!" Yes, the English phrase originally came from this one.

**6. 忙吗？(máng ma?)** — "Busy?" A soft opener before asking for anything — time, a favor, attention.

**7. 去哪儿？(qù nǎr?)** — "Where are you off to?" Extremely common from neighbours and security guards. It is a greeting, not surveillance; a vague 出去一下 (chūqù yíxià, "just going out for a bit") is a perfectly polite answer.

**8. 回来啦！(huílái la!)** — "You're back!" Said with a rising, cheerful tone the moment you walk in.

**9. 慢走 (màn zǒu)** — "Walk slowly," said by a host when you leave. It means "take care", not an instruction about speed. The reply is 慢用 (màn yòng) if they served you food.

**10. 拜拜 (bàibài)** — bye-bye. Borrowed from English, completely standard among younger speakers on any app.

Notice how many of these are questions or observations instead of "hello"? That is the real pattern of Chinese greetings: acknowledge the person through their situation. Practise these ten with correct tones and you will sound like you have lived there for years — this is exactly the kind of material we drill in the first weeks of HSK 1.`,
  },
  {
    title: 'Why Chinese Tones Are Not as Scary as You Think',
    slug: 'chinese-tones-not-scary',
    tag: 'tips',
    emoji: '🎵',
    color: 'sage',
    image: '/images/blog/autumn-semester.png',
    excerpt:
      'Four tones look impossible until you learn three tricks: melody-first learning, tone pairs, and why context saves you more often than perfect pitch does.',
    content: `Ask anyone why they gave up on Chinese and you will hear the same word: tones. Four tones, they say, means every word has four versions and saying the wrong one turns "mother" into "horse". Here is why that fear is mostly a myth — and what actually matters instead.

**Trick 1: Learn melody, not numbers.** Do not memorize "mā is tone 1, má is tone 2". Memorize the melody of whole phrases: 你好 rises at the end like a question, 谢谢 falls twice like a sigh of relief. Your brain stores melodies far better than it stores lookup tables. This is also why we teach tones through songs and drills, not charts.

**Trick 2: Practise pairs, not singles.** Tones in real speech change each other. Two third tones in a row? The first becomes a second tone (ní hǎo, not nǐ hǎo). Practising isolated syllables trains you for a language nobody speaks. Drill the twenty most common two-syllable combinations and you have covered most of what your mouth will ever do.

**Trick 3: Context is your safety net.** The famous "mā vs mǎ" disaster almost never happens in a real sentence, because 语法，我想买一匹马 does not leave room for your mother. Listeners extract meaning from the whole phrase, your gestures and the situation. Perfect pitch is a bonus; clear, confident, consistent tones are the actual requirement.

**The 80/20 of tones.** If your first tone is high and flat, your second rises, your third dips and your fourth drops sharply — even imperfectly — you will be understood. Mispronouncing a tone makes you sound like a foreigner with an accent, not like a different word. The real killers are ignoring tones completely and speaking everything flat.

So the plan is boringly simple: ten minutes of tone-pair drills a day, always with audio, always imitating rather than reading. In our experience, learners who do this stop being "afraid of tones" within about three weeks — usually around lesson six of HSK 1, right when 你好 starts sounding natural instead of careful.`,
  },
]

/** سیدر idempotent — فقط رکوردهای غایب ساخته می‌شوند؛ ویرایش ادمین دست‌نخورده */
export async function ensureBlogSeed(): Promise<void> {
  try {
    for (const p of SEED_POSTS) {
      await db.post.upsert({
        where: { slug: p.slug },
        create: {
          title: p.title,
          slug: p.slug,
          tag: p.tag,
          emoji: p.emoji,
          color: p.color,
          image: p.image,
          excerpt: p.excerpt,
          content: p.content,
          published: true,
        },
        update: {}, // مقالهٔ موجود = مالِ ادمین؛ بازنویسی نمی‌کنیم
      })
    }
    console.info(`[blog-seed] ${SEED_POSTS.length} articles ensured`)
  } catch (e) {
    console.error('[blog-seed] failed (non-fatal):', e instanceof Error ? e.message : e)
  }
}
