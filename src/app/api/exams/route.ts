import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAuthorized } from '@/lib/admin-auth'
import { parseExamXml, safeParseExamQuestions } from '@/lib/exams'

// ---------------------------------------------------------------------------
// 📝 /api/exams — آزمون‌های چندسؤالی (HSK-مانند)
//
// GET  عمومی: آزمون‌های منتشرشده (فقط متادیتا + تعداد سؤال — بدون سؤال‌ها)
// GET  ?all=1 با x-admin-key: همهٔ آزمون‌ها با سؤالات (برای پنل)
// POST مدیریت: multipart با فایل .xml (یا .txt هم‌محتوا) → پارس + upsert بر
//      اساس slug — سؤالات جایگزین می‌شوند. فیلد published اختیاری.
// PATCH مدیریت: فقط تغییر انتشار {id, published}
// DELETE مدیریت: {id}
// ---------------------------------------------------------------------------

export const dynamic = 'force-dynamic'

function metaView(e: {
  id: string
  slug: string
  title: string
  description: string
  level: string
  durationMin: number
  passPercent: number
  published: boolean
  sortOrder: number
  questions: string
  createdAt: Date
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
    published: e.published,
    sortOrder: e.sortOrder,
    questionCount: questions.length,
    createdAt: e.createdAt,
  }
}

export async function GET(req: NextRequest) {
  try {
    const admin = await isAuthorized(req)
    const wantsAll = req.nextUrl.searchParams.get('all') === '1'
    const rows = await db.exam.findMany({
      where: admin && wantsAll ? {} : { published: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      take: 200, // 🛡️ سقف دفاعی
    })
    return NextResponse.json({
      exams: rows.map((e) => (admin && wantsAll ? { ...metaView(e), questions: safeParseExamQuestions(e.questions) } : metaView(e))),
    })
  } catch (err) {
    console.error('[GET /api/exams] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const contentType = req.headers.get('content-type') ?? ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Expected multipart/form-data with an XML file' }, { status: 400 })
    }
    const form = await req.formData()
    const file = form.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'XML file is required' }, { status: 400 })
    }
    const xml = await file.text()
    const parsed = parseExamXml(xml) // ExamParseError → 400 با پیام دقیق
    const published = String(form.get('published') ?? 'true') !== 'false'
    const sortOrder = Number.parseInt(String(form.get('sortOrder') ?? '0'), 10) || 0

    const data = {
      slug: parsed.slug,
      title: parsed.title,
      description: parsed.description,
      level: parsed.level,
      durationMin: parsed.durationMin,
      passPercent: parsed.passPercent,
      published,
      sortOrder: Number.isFinite(sortOrder) ? Math.max(0, Math.min(9999, sortOrder)) : 0,
      questions: JSON.stringify(parsed.questions),
    }

    const saved = await db.exam.upsert({
      where: { slug: parsed.slug },
      update: data,
      create: data,
    })
    return NextResponse.json(
      {
        ok: true,
        id: saved.id,
        slug: saved.slug,
        questionCount: parsed.questions.length,
        replaced: true,
      },
      { status: 201 }
    )
  } catch (err) {
    if (err instanceof Error && err.name === 'ExamParseError') {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    console.error('[POST /api/exams] error:', err)
    return NextResponse.json({ error: 'Could not save the exam — try again.' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = (await req.json().catch(() => null)) as { id?: string; published?: boolean } | null
    const id = typeof body?.id === 'string' ? body.id : ''
    if (!id || typeof body?.published !== 'boolean') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    await db.exam.update({ where: { id }, data: { published: body.published } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PATCH /api/exams] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = (await req.json().catch(() => null)) as { id?: string } | null
    const id = typeof body?.id === 'string' ? body.id : ''
    if (!id) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    await db.exam.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/exams] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
