import type { SeedPost } from './types'

// ---------------------------------------------------------------------------
// مقالهٔ ۱ — The Complete Guide to the HSK Exam
// Primary keyword: HSK exam | Tag: hsk
// فرمت‌ها راستی‌آزمایی‌شده (HSK 2.0، ویکی‌پدیا + chinesetest.cn):
//   HSK 1: 20L+20R، 15+17 دقیقه، 200 نمره، قبولی 120 — HSK 2: 35L+25R، 200/120
//   HSK 3–6: 300 نمره (هر بخش 100)؛ L/R/W به‌ترتیب 40/30/10، 45/40/15، 45/45/10، 50/50/1
//   واژگان تجمعی: 150/300/600/1200/2500/5000 — HSKK: 3 سطح مجزا
//   HSK 3.0: «سه مرحله، نُه سطح»، فقط 7–9 فعال؛ سرفصل بازنگری‌شده 2025 در حال اجرا
// ---------------------------------------------------------------------------

export const HSK_EXAM: SeedPost = {
  slug: 'complete-guide-to-hsk-exam',
  title: 'The Complete Guide to the HSK Exam: Levels, Format, Scores and Preparation',
  tag: 'hsk',
  emoji: '🎓',
  color: 'sage',
  excerpt:
    'Everything about the HSK exam: what each of the six levels tests, the exact listening/reading/writing format, how scores work, how to register, and a realistic preparation plan.',
  content: `If you are learning Mandarin, sooner or later you will meet the **HSK exam** (汉语水平考试, Hanyu Shuiping Kaoshi) — China's official standardized Chinese proficiency test. It is the credential universities, employers, and scholarship committees around the world recognize when they ask "how good is your Chinese, really?" This guide explains what the test measures, how every level is structured, how registration and scoring work, and how to prepare efficiently. One warning up front: exam structures, fees, availability, and recognition **vary by country, test center, test date, and exam version** — always confirm current details through the official **Chinese Testing International (CTI)** website at [chinesetest.cn](https://www.chinesetest.cn/) before you register.

## What the HSK Exam Is and Who Should Take It

The HSK is administered by **Chinese Testing International (CTI)** under the authority of China's Ministry of Education. It certifies your ability to use Mandarin in real academic and daily contexts. Three groups of people take it most:

• **University applicants** — Chinese universities typically require HSK 4–6 for degree programs taught in Chinese (requirements vary by university and program; check the specific admission notice).

• **Scholarship candidates** — programs like the Chinese Government Scholarship usually ask for an HSK certificate or an oncoming test date as proof of language readiness.

• **Job seekers and professionals** — employers in trade, education, and translation use HSK levels as a quick, standardized signal.

There is also a separate **oral exam, HSKK** (beginner, intermediate, advanced), and tests for children (YCT) and business Chinese (BCT). The HSK itself is **not** an oral test — if you need speaking certified, register for HSKK separately.

## What the HSK Measures and How It Is Used

The HSK measures **listening, reading, and (from level 3 up) writing** against fixed vocabulary and grammar benchmarks. Results are used for university admission, scholarship applications, job applications, and — very commonly — as a personal roadmap: the level system tells you exactly what to learn next. Certificates are valid indefinitely, though institutions often prefer certificates earned within the last two years.

## HSK Levels: The Traditional Six-Level System (HSK 2.0)

The exam most test centers still administer uses the six-level system introduced in 2010, often called **HSK 2.0**. Each level has a defined vocabulary size and a fixed paper structure:

| Level | Vocabulary (cumulative) | Listening | Reading | Writing | Max / Pass |
| --- | --- | --- | --- | --- | --- |
| HSK 1 | 150 words | 20 items · 15 min | 20 items · 17 min | — | 200 / 120 |
| HSK 2 | 300 words | 35 items · 25 min | 25 items · 22 min | — | 200 / 120 |
| HSK 3 | 600 words | 40 items | 30 items | 10 items | 300 / 180 |
| HSK 4 | 1,200 words | 45 items | 40 items | 15 items | 300 / 180 |
| HSK 5 | 2,500 words | 45 items | 45 items | 10 items | 300 / 180 |
| HSK 6 | 5,000 words | 50 items | 50 items | 1 essay | 300 / 180 |

Two details worth knowing:

• **HSK 1 and HSK 2 show pinyin** above the characters in the listening and reading sections. From HSK 3 up, it is characters only.

• Sections are scored out of 100 points each (levels 3–6), and historically only the **total** had to clear the pass mark — strong listening could offset weaker writing. (Since 2013, CTI no longer publishes official pass thresholds for levels 5–6; score reports show your total and section scores.)

## The New HSK Framework (HSK 3.0): What Changed

In 2021 China's Ministry of Education announced the **HSK 3.0** standard — a "three stages, nine levels" framework (Beginner 1–3, Intermediate 4–6, Advanced 7–9) with expanded vocabulary targets and additional skills such as handwriting and translation. The rollout has been gradual: the combined **HSK 7–9** exam launched in 2022 for advanced learners, while **levels 1–6 have continued on the familiar 2.0 format**. A revised syllabus began phased implementation from late 2025, with speaking (HSKK-style tasks) expected to be integrated into more levels over time.

What this means for you practically: if you are a beginner or intermediate learner registering today, you will most likely sit the familiar six-level format — but **check the current exam outline for your test date and center**, because transition arrangements differ by location. The official syllabus and sample papers are published on [chinesetest.cn](https://www.chinesetest.cn/).

## Test Formats, Registration, Centers, Fees and Scores

**Formats.** Most centers offer a **paper-based** version and an **internet-based** version taken at the test center (some locations also offer a home edition). The content is the same; the internet-based version lets you type pinyin and select characters for the writing sections, and results typically arrive faster.

**Registration.** You register online through the official CTI portal ([chinesetest.cn](https://www.chinesetest.cn/)) or, in some countries, through the local test center's own system. The steps:

1. Create an account on the official site.

2. Search for your country and city to see available **test dates and centers**.

3. Choose your level and format, upload a passport-style photo, and pay the fee.

4. Print your admission ticket (测试准考证) before test day.

**Fees and scheduling.** Fees are set per level and **differ by country and sometimes by center**, and popular sessions fill up — register several weeks early. Test dates follow a published international calendar (also on the CTI site), typically once or twice a month at larger centers.

**Score reporting.** Results are released online a few weeks after the test (faster for internet-based sessions), and you can order additional paper score reports through your account.

## HSKK: The Oral Exam You Register for Separately

Because the written HSK tests no speaking, CTI runs a separate oral exam — **HSKK** (汉语水平口语考试) — in three levels:

| HSKK level | Written equivalent | Vocabulary target | Format highlights |
| --- | --- | --- | --- |
| Beginner (初级) | HSK 1–2 | ~200 words | Listen and repeat; short answer–question responses |
| Intermediate (中级) | HSK 3–4 | ~900 words | Listen and repeat; picture description |
| Advanced (高级) | HSK 5–6 | ~3,000 words | Listen and repeat; read aloud; answer questions on audio |

Beginner HSKK is largely **listen-and-repeat**: you hear sentences and reproduce them — a direct test of your tone training. Intermediate and advanced add genuine production: describing pictures and answering spoken questions. Registration works the same way as the written exam (same portal, same centers, usually same test days), and the two certificates together give a much fuller picture of your ability — many universities asking for "HSK 4" in practice expect conversational ability that only the oral test documents.

How to prepare: shadowing (replaying native audio and speaking over it in real time) is the single most effective HSKK exercise at every level. Record yourself weekly and compare against the model — tone drift you cannot hear in the moment becomes obvious on playback. Our [beginner method guide](/blog/how-to-learn-chinese-for-beginners) includes a shadowing routine you can start with from day one.

## How to Choose the Right Level

A practical rule of thumb used by teachers:

• **Finished ~1 month of study or know ~150 words** → HSK 1.

• **Studied one semester / ~300 words** → HSK 2.

• **Can handle everyday conversations and simple paragraphs** → HSK 3.

• **Discuss familiar topics fluently, read short articles** → HSK 4 (the level most Chinese-taught degree programs ask for).

• **Read newspapers, watch lectures** → HSK 5. **Near-native academic fluency** → HSK 6.

If you are unsure, take an official sample paper ("Do a Mock" on the CTI site) — if you comfortably pass a practice version of level N with time to spare, book N+1 instead. And remember you can take the exam as many times as you like.

## Study Resources and Preparation Strategies

A preparation plan that works:

• **Fix the vocabulary list first.** Each level's official word list is public. At HSK 1 that is [150 words](/blog/hsk-1-study-guide) — learn them to automatic recall before anything else.

• **Practice with official sample papers.** Format familiarity is half the battle: knowing that HSK 2 listening plays each dialogue twice, or that HSK 3 writing is sentence rearrangement, removes most test-day anxiety.

• **Train listening daily.** The listening section is timed and unrepeated (except the first two levels, where items play twice). Ten minutes of graded audio every day beats two hours once a week — our [beginner listening guide](/blog/how-to-learn-chinese-for-beginners) has a routine you can copy.

• **Time yourself writing.** From HSK 3, handwriting (or typing) under time pressure is a distinct skill. Practice the actual task types: rearrange words into sentences, then write short passages from pictures or prompts.

## A Realistic Preparation Timeline

**From zero to HSK 1–2 (beginner):** 2–4 months at 30–60 minutes a day. The vocabulary is small but the skill of hearing tones in fast audio needs repetition — see the [HSK 1 study plan](/blog/hsk-1-study-guide) for a day-by-day schedule.

**From HSK 2 to HSK 3–4 (intermediate):** roughly 6–12 months of steady study. This is where characters stop being optional and reading volume matters most.

**From HSK 4 to HSK 5–6 (advanced):** 1–2 years more of consistent exposure — podcasts, dramas, news, and regular writing feedback. Most learners reach HSK 4 in about two years of part-time study; the jump beyond is about volume, not cleverness.

## Common Mistakes Candidates Make

• **Booking a level they can't yet pass a mock for.** Motivating, but expensive. Take a timed sample first.

• **Ignoring the listening section until the last month.** It is the section beginners fail most often, because classroom Chinese is slower than exam audio.

• **Learning words in isolation.** The exam tests words inside sentences; learn every word with one example sentence.

• **Skipping handwriting practice for the paper-based format.** If you registered for paper, typing practice won't save you.

• **Assuming last year's format.** The framework transition means formats and availability can change — verify with your center.

## The Takeaway

The HSK exam is less a hurdle than a map: each level tells you exactly which words, grammar, and skills to master next, and the certificate turns that progress into something universities and employers can read at a glance. Pick your target level, get one official sample paper, and build a daily routine around the four skills the test actually measures. If you want guided structure, our [HSK-aligned online courses](/classes) cover the same vocabulary and grammar the exams test — with a teacher checking your pronunciation from day one.

## Frequently Asked Questions

**How long is an HSK certificate valid?**

The certificate itself does not expire, but universities and scholarship programs often ask for a certificate issued within the last two years.

**Can I take the HSK online from home?**

Some test centers offer a home internet-based edition, but availability varies by country and date. Check the test search on the official CTI website for your location.

**Is HSK 3.0 replacing the six-level exam?**

The new framework is being phased in, and the advanced HSK 7–9 exam is already live. For beginner and intermediate levels, most centers still run the familiar six-level papers — confirm the format for your specific test date and center.

**Do I need HSKK separately?**

Yes. The HSK written exam does not test speaking. If a program or employer requires certified speaking ability, register for the separate HSKK oral test (beginner, intermediate, or advanced).

**What score do I need to pass?**

For HSK 1–4 the traditional thresholds are 120/200 (levels 1–2) and 180/300 (levels 3–4); CTI no longer publishes official pass scores for levels 5–6, and score reporting shows section totals. Institutions set their own requirements, so check what your target program accepts.
`,
}
