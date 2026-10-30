import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { rateLimit, tooManyRequests } from '@/lib/rate-limit'
import { guardResponse } from '@/lib/http-guard'
import { safeParseExamQuestions, gradeExam } from '@/lib/exams'

// ---------------------------------------------------------------------------
// 📝 /api/exams/[slug] — جزئیات آزمون برای کاربر عمومی
//
// GET   سؤال‌ها «بدون پاسخ درست» برمی‌گردند (options فقط) — کلاینت هرگز
//       پاسخ را نمی‌بیند؛ نمره‌دهی کامل سمت سرور است.
// POST  {answers: (number|null)[]} → نمره‌دهی از روی DB + اعلام نتیجه.
//       rate-limit ۲۰ درخواست/ساعت/IP (ضد سوءاستفادهٔ نمره‌دهی).
// ---------------------------------------------------------------------------

export const dynamic = 'force-dynamic'

const submitSchema = z.object({
  answers: z.array(z.number().int().nullable()).max(200),
})

function publicView(e: {
  id: string
  slug: string
  title: string
  description: string
  level: string
  durationMin: number
  passPercent: number
  questions: string
}) {
  const questions = safeParseExamQuestions(e.questions)
  return {
    id: e.id,
    slug: e.slug,
    title: e.title,
    description: e.description,
    level: e.level,
    durationMin: e.durationMin,
    passPercent: e.passPercent,
    // 🙈 بدون فیلد answer — گزینه‌ها فقط متن
    questions: questions.map((q) => ({ q: q.q, options: q.options })),
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    if (!slug || slug.length > 80) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const row = await db.exam.findUnique({ where: { slug } })
    if (!row || !row.published) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ exam: publicView(row) })
  } catch (err) {
    console.error('[GET /api/exams/[slug]] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const guard = guardResponse(req)
  if (guard) return guard
  const rl = await rateLimit('exams-submit', req, 20, 3600, 3600)
  if (!rl.ok) return tooManyRequests(rl)

  try {
    const { slug } = await params
    if (!slug || slug.length > 80) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const row = await db.exam.findUnique({ where: { slug } })
    if (!row || !row.published) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await req.json().catch(() => null)
    const parsed = submitSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid answers payload' }, { status: 400 })
    }

    const questions = safeParseExamQuestions(row.questions)
    const grade = gradeExam(questions, parsed.data.answers, row.passPercent)
    // 📋 بازخورد کامل پس از نمره‌دهی — حالا که نمره ثبت شد، افشای پاسخ درست آزاد است
    const review = questions.map((q, i) => ({
      q: q.q,
      options: q.options,
      answer: q.answer,
      picked: typeof parsed.data.answers[i] === 'number' ? (parsed.data.answers[i] as number) : null,
      correct: grade.correct[i],
    }))
    return NextResponse.json({
      ok: true,
      score: grade.score,
      maxScore: grade.maxScore,
      percent: grade.percent,
      passed: grade.passed,
      review,
    })
  } catch (err) {
    console.error('[POST /api/exams/[slug]] error:', err)
    return NextResponse.json({ error: 'Could not grade the exam — try again.' }, { status: 500 })
  }
}
