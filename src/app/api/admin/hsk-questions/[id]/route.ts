// ---------------------------------------------------------------------------
// 🧩 /api/admin/hsk-questions/[id] — single question (admin only)
// GET    → full question WITH the answer key (admin-only surface; the public
//          API never returns keys)
// PATCH  → partial update (same validation as create)
// DELETE → remove (exams referencing it simply skip the missing id)
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isAuthorized, getAdminActor } from '@/lib/admin-auth'
import { isSameOrigin } from '@/lib/http-guard'
import { logAdminAction } from '@/lib/audit'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const KINDS = ['mcq', 'truefalse', 'fill', 'match', 'order', 'listen'] as const
const SKILLS = ['vocabulary', 'grammar', 'pronunciation', 'reading', 'listening'] as const

const patchSchema = z
  .object({
    kind: z.enum(KINDS).optional(),
    prompt: z.string().trim().min(1).max(600).optional(),
    hanzi: z.string().max(600).optional(),
    pinyin: z.string().max(600).optional(),
    options: z.array(z.string().max(300)).max(8).optional(),
    answerIndex: z.number().int().min(0).max(7).nullable().optional(),
    matchLeft: z.array(z.string().max(300)).max(8).optional(),
    matchOptions: z.array(z.string().max(300)).max(8).optional(),
    tiles: z.array(z.string().max(120)).max(14).optional(),
    explanation: z.string().max(1000).optional(),
    level: z.enum(['hsk1', 'hsk2', 'hsk3']).optional(),
    skill: z.enum(SKILLS).optional(),
    stageNumber: z.number().int().min(1).max(50).nullable().optional(),
    points: z.number().int().min(1).max(100).optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    audioFileId: z.string().max(40).nullable().optional(),
    imageFileId: z.string().max(40).nullable().optional(),
    passageId: z.string().max(40).nullable().optional(),
    published: z.boolean().optional(),
    sortOrder: z.number().int().min(0).max(9999).optional(),
  })
  .strict()

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { id } = await params
    const row = await db.hskQuestion.findUnique({ where: { id } })
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({
      question: {
        ...row,
        options: JSON.parse(row.options),
        matchLeft: JSON.parse(row.matchLeft),
        matchOptions: JSON.parse(row.matchOptions),
        tiles: JSON.parse(row.tiles),
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      },
    })
  } catch (err) {
    console.error('[GET /api/admin/hsk-questions/[id]] error:', err)
    return NextResponse.json({ error: 'Could not load the question' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const { id } = await params
    const existing = await db.hskQuestion.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const body = await req.json().catch(() => null)
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return NextResponse.json(
        { error: first ? `${first.path.join('.') || 'field'}: ${first.message}` : 'Invalid question data' },
        { status: 400 }
      )
    }
    const data = { ...parsed.data } as Record<string, unknown>
    const kind = (data.kind as string | undefined) ?? existing.kind
    for (const key of ['options', 'matchLeft', 'matchOptions', 'tiles']) {
      if (key in data) data[key] = JSON.stringify(data[key])
    }
    if (kind === 'match' || kind === 'order') {
      data.answerIndex = null
    } else if ('options' in data || 'answerIndex' in data) {
      const options: string[] =
        'options' in data
          ? (JSON.parse(data.options as string) as string[])
          : (JSON.parse(existing.options) as string[])
      const idx = ('answerIndex' in data ? (data.answerIndex as number | null) : existing.answerIndex) ?? -1
      if (idx < 0 || idx >= options.length) {
        return NextResponse.json({ error: 'Pick which option is correct.' }, { status: 400 })
      }
    }
    await db.hskQuestion.update({ where: { id }, data })
    const actor = await getAdminActor(req)
    logAdminAction({
      actor,
      action: 'hskQuestion.update',
      targetType: 'hskQuestion',
      targetId: id,
      meta: { kind },
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PATCH /api/admin/hsk-questions/[id]] error:', err)
    return NextResponse.json({ error: 'Could not update the question' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const { id } = await params
    const existing = await db.hskQuestion.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await db.hskQuestion.delete({ where: { id } })
    const actor = await getAdminActor(req)
    logAdminAction({
      actor,
      action: 'hskQuestion.delete',
      targetType: 'hskQuestion',
      targetId: id,
      meta: { kind: existing.kind },
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/admin/hsk-questions/[id]] error:', err)
    return NextResponse.json({ error: 'Could not delete the question' }, { status: 500 })
  }
}
