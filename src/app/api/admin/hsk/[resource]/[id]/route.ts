// ---------------------------------------------------------------------------
// 📚 /api/admin/hsk/[resource]/[id] — edit / delete HSK content (admin only)
// PATCH accepts a partial payload (fields are re-validated per resource);
// JSON array fields are replaced wholesale when present.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isAuthorized, getAdminActor } from '@/lib/admin-auth'
import { isSameOrigin } from '@/lib/http-guard'
import { logAdminAction } from '@/lib/audit'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const RESOURCES = ['stages', 'words', 'grammar', 'pronunciations', 'readings'] as const
type Resource = (typeof RESOURCES)[number]

const patchSchemas = {
  stages: z
    .object({
      stageNumber: z.number().int().min(1).max(50).optional(),
      title: z.string().trim().min(1).max(160).optional(),
      description: z.string().max(1000).optional(),
      published: z.boolean().optional(),
      manuallyUnlocked: z.boolean().optional(),
      coverImageId: z.string().max(40).nullable().optional(),
    })
    .strict(),
  words: z
    .object({
      hanzi: z.string().trim().min(1).max(40).optional(),
      pinyin: z.string().trim().max(120).optional(),
      meaning: z.string().trim().max(200).optional(),
      category: z.string().max(30).optional(),
      example: z.string().max(500).optional(),
      examplePinyin: z.string().max(500).optional(),
      exampleEnglish: z.string().max(500).optional(),
      audioFileId: z.string().max(40).nullable().optional(),
      imageFileId: z.string().max(40).nullable().optional(),
      sortOrder: z.number().int().min(0).max(999).optional(),
      published: z.boolean().optional(),
    })
    .strict(),
  grammar: z
    .object({
      title: z.string().trim().min(1).max(160).optional(),
      explanation: z.string().max(3000).optional(),
      structure: z.string().max(300).optional(),
      examples: z
        .array(z.object({ hanzi: z.string().max(300), pinyin: z.string().max(300).default(''), english: z.string().max(300).default('') }))
        .max(12)
        .optional(),
      mistakes: z
        .array(z.object({ wrong: z.string().max(300), right: z.string().max(300), note: z.string().max(300).default('') }))
        .max(12)
        .optional(),
      sortOrder: z.number().int().min(0).max(999).optional(),
      published: z.boolean().optional(),
    })
    .strict(),
  pronunciations: z
    .object({
      title: z.string().trim().min(1).max(160).optional(),
      intro: z.string().max(2000).optional(),
      sections: z
        .array(
          z.object({
            title: z.string().max(200),
            body: z.string().max(3000).default(''),
            items: z.array(z.object({ label: z.string().max(200), note: z.string().max(300).default('') })).max(30).default([]),
          })
        )
        .max(12)
        .optional(),
      audioFileId: z.string().max(40).nullable().optional(),
      sortOrder: z.number().int().min(0).max(999).optional(),
      published: z.boolean().optional(),
    })
    .strict(),
  readings: z
    .object({
      title: z.string().trim().min(1).max(160).optional(),
      form: z.enum(['text', 'dialogue']).optional(),
      lines: z
        .array(z.object({ hanzi: z.string().max(500), pinyin: z.string().max(500).default(''), english: z.string().max(500).default('') }))
        .max(60)
        .optional(),
      notes: z.array(z.object({ word: z.string().max(100), meaning: z.string().max(300).default('') })).max(20).optional(),
      audioFileId: z.string().max(40).nullable().optional(),
      sortOrder: z.number().int().min(0).max(999).optional(),
      published: z.boolean().optional(),
    })
    .strict(),
} as const

function prepareData(resource: Resource, data: Record<string, unknown>): Record<string, unknown> {
  if (resource === 'stages') return { ...data }
  const copy = { ...data }
  for (const key of ['examples', 'mistakes', 'sections', 'lines', 'notes']) {
    if (key in copy) copy[key] = JSON.stringify(copy[key])
  }
  for (const key of ['audioFileId', 'imageFileId']) {
    if (copy[key] === undefined) delete copy[key]
  }
  return copy
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ resource: string; id: string }> }
) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { resource, id } = await params
  if (!(RESOURCES as readonly string[]).includes(resource)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const resourceKey = resource as Resource
  try {
    const body = await req.json().catch(() => null)
    const parsed = patchSchemas[resourceKey].safeParse(body)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return NextResponse.json(
        { error: first ? `${first.path.join('.') || 'field'}: ${first.message}` : 'Invalid data' },
        { status: 400 }
      )
    }
    const data = prepareData(resourceKey, parsed.data as Record<string, unknown>)
    switch (resourceKey) {
      case 'stages':
        await db.hskStage.update({ where: { id }, data: data as Parameters<typeof db.hskStage.update>[0]['data'] })
        break
      case 'words':
        await db.hskWord.update({ where: { id }, data: data as Parameters<typeof db.hskWord.update>[0]['data'] })
        break
      case 'grammar':
        await db.hskGrammar.update({ where: { id }, data: data as Parameters<typeof db.hskGrammar.update>[0]['data'] })
        break
      case 'pronunciations':
        await db.hskPronunciation.update({ where: { id }, data: data as Parameters<typeof db.hskPronunciation.update>[0]['data'] })
        break
      case 'readings':
        await db.hskReading.update({ where: { id }, data: data as Parameters<typeof db.hskReading.update>[0]['data'] })
        break
    }
    const actor = await getAdminActor(req)
    logAdminAction({
      actor,
      action: `hsk.${resourceKey}.update`,
      targetType: 'hskContent',
      targetId: id,
      meta: { resource: resourceKey },
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(`[PATCH /api/admin/hsk/${resource}/[id]] error:`, err)
    return NextResponse.json({ error: 'Could not update the item' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ resource: string; id: string }> }
) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { resource, id } = await params
  if (!(RESOURCES as readonly string[]).includes(resource)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  try {
    switch (resource as Resource) {
      case 'stages':
        await db.hskStage.delete({ where: { id } })
        break
      case 'words':
        await db.hskWord.delete({ where: { id } })
        break
      case 'grammar':
        await db.hskGrammar.delete({ where: { id } })
        break
      case 'pronunciations':
        await db.hskPronunciation.delete({ where: { id } })
        break
      case 'readings':
        await db.hskReading.delete({ where: { id } })
        break
    }
    const actor = await getAdminActor(req)
    logAdminAction({
      actor,
      action: `hsk.${resource}.delete`,
      targetType: 'hskContent',
      targetId: id,
      meta: { resource },
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(`[DELETE /api/admin/hsk/${resource}/[id]] error:`, err)
    return NextResponse.json({ error: 'Could not delete the item' }, { status: 500 })
  }
}
