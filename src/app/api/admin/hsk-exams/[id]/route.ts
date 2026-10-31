// ---------------------------------------------------------------------------
// 📝 /api/admin/hsk-exams/[id] — edit / publish / delete an exam (admin only)
// Editing rules/config is safe: past attempts are graded from their VERSION
// snapshots, so historical results never change.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isAuthorized, getAdminActor } from '@/lib/admin-auth'
import { isSameOrigin } from '@/lib/http-guard'
import { logAdminAction } from '@/lib/audit'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const patchSchema = z
  .object({
    slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/).optional(),
    title: z.string().trim().min(1).max(160).optional(),
    description: z.string().max(1500).optional(),
    level: z.enum(['hsk1', 'hsk2', 'hsk3']).optional(),
    examType: z.enum(['mock', 'listening', 'reading', 'vocabulary', 'grammar', 'timed', 'untimed']).optional(),
    durationMin: z.number().int().min(0).max(300).optional(),
    passPercent: z.number().int().min(1).max(100).optional(),
    questionIds: z.array(z.string().max(40)).max(200).optional(),
    randomizeQuestions: z.boolean().optional(),
    randomizeOptions: z.boolean().optional(),
    allowPause: z.boolean().optional(),
    allowReview: z.boolean().optional(),
    showCorrectAnswers: z.boolean().optional(),
    showExplanations: z.boolean().optional(),
    audioReplayLimit: z.number().int().min(0).max(20).optional(),
    access: z.enum(['free', 'restricted']).optional(),
    published: z.boolean().optional(),
    sortOrder: z.number().int().min(0).max(9999).optional(),
  })
  .strict()

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
    const existing = await db.hskExam.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const body = await req.json().catch(() => null)
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return NextResponse.json(
        { error: first ? `${first.path.join('.') || 'field'}: ${first.message}` : 'Invalid exam data' },
        { status: 400 }
      )
    }
    const data = { ...parsed.data } as Record<string, unknown>
    if ('questionIds' in data) data.questionIds = JSON.stringify(data.questionIds)
    await db.hskExam.update({ where: { id }, data })
    const actor = await getAdminActor(req)
    logAdminAction({
      actor,
      action: 'hskExam.update',
      targetType: 'hskExam',
      targetId: id,
      meta: { slug: existing.slug, published: data.published as boolean | undefined },
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof Error && err.message.includes('Unique constraint')) {
      return NextResponse.json({ error: 'That slug is already in use.' }, { status: 409 })
    }
    console.error('[PATCH /api/admin/hsk-exams/[id]] error:', err)
    return NextResponse.json({ error: 'Could not update the exam' }, { status: 500 })
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
    const existing = await db.hskExam.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await db.hskExam.delete({ where: { id } })
    const actor = await getAdminActor(req)
    logAdminAction({
      actor,
      action: 'hskExam.delete',
      targetType: 'hskExam',
      targetId: id,
      meta: { slug: existing.slug },
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/admin/hsk-exams/[id]] error:', err)
    return NextResponse.json({ error: 'Could not delete the exam' }, { status: 500 })
  }
}
