// ---------------------------------------------------------------------------
// 📚 /api/admin/hsk/[resource] — HSK practice content management (admin only)
//
// resource ∈ stages | words | grammar | pronunciations | readings
//   GET  ?level=&stageId=&query= → list
//   POST                         → create
// Sensitive JSON fields (examples/mistakes/sections/lines/notes) are validated
// before storage; every mutation is audited. Answer-carrying questions live in
// /api/admin/hsk-questions (separate surface, stricter validation).
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

const exampleSchema = z.object({ hanzi: z.string().max(300), pinyin: z.string().max(300).default(''), english: z.string().max(300).default('') })
const mistakeSchema = z.object({ wrong: z.string().max(300), right: z.string().max(300), note: z.string().max(300).default('') })
const sectionSchema = z.object({ title: z.string().max(200), body: z.string().max(3000).default(''), items: z.array(z.object({ label: z.string().max(200), note: z.string().max(300).default('') })).max(30).default([]) })
const lineSchema = z.object({ hanzi: z.string().max(500), pinyin: z.string().max(500).default(''), english: z.string().max(500).default('') })
const noteSchema = z.object({ word: z.string().max(100), meaning: z.string().max(300).default('') })

const createSchemas = {
  stages: z.object({
    level: z.enum(['hsk1', 'hsk2', 'hsk3']),
    stageNumber: z.number().int().min(1).max(50),
    title: z.string().trim().min(1).max(160),
    description: z.string().max(1000).default(''),
    published: z.boolean().default(true),
    manuallyUnlocked: z.boolean().default(false),
  }),
  words: z.object({
    stageId: z.string().min(5).max(40),
    hanzi: z.string().trim().min(1).max(40),
    pinyin: z.string().trim().max(120),
    meaning: z.string().trim().max(200),
    category: z.string().max(30).default('other'),
    example: z.string().max(500).default(''),
    examplePinyin: z.string().max(500).default(''),
    exampleEnglish: z.string().max(500).default(''),
    audioFileId: z.string().max(40).nullable().optional(),
    imageFileId: z.string().max(40).nullable().optional(),
    sortOrder: z.number().int().min(0).max(999).default(0),
    published: z.boolean().default(true),
  }),
  grammar: z.object({
    stageId: z.string().min(5).max(40),
    title: z.string().trim().min(1).max(160),
    explanation: z.string().max(3000).default(''),
    structure: z.string().max(300).default(''),
    examples: z.array(exampleSchema).max(12).default([]),
    mistakes: z.array(mistakeSchema).max(12).default([]),
    sortOrder: z.number().int().min(0).max(999).default(0),
    published: z.boolean().default(true),
  }),
  pronunciations: z.object({
    stageId: z.string().min(5).max(40),
    title: z.string().trim().min(1).max(160),
    intro: z.string().max(2000).default(''),
    sections: z.array(sectionSchema).max(12).default([]),
    audioFileId: z.string().max(40).nullable().optional(),
    sortOrder: z.number().int().min(0).max(999).default(0),
    published: z.boolean().default(true),
  }),
  readings: z.object({
    stageId: z.string().min(5).max(40),
    title: z.string().trim().min(1).max(160),
    form: z.enum(['text', 'dialogue']).default('text'),
    lines: z.array(lineSchema).max(60).default([]),
    notes: z.array(noteSchema).max(20).default([]),
    audioFileId: z.string().max(40).nullable().optional(),
    sortOrder: z.number().int().min(0).max(999).default(0),
    published: z.boolean().default(true),
  }),
} as const

function isResource(v: string): v is Resource {
  return (RESOURCES as readonly string[]).includes(v)
}

type AnyRow = { id: string }

async function listByStage(resource: Resource, stageId: string): Promise<AnyRow[]> {
  switch (resource) {
    case 'words':
      return db.hskWord.findMany({ where: { stageId }, orderBy: { sortOrder: 'asc' } })
    case 'grammar':
      return db.hskGrammar.findMany({ where: { stageId }, orderBy: { sortOrder: 'asc' } })
    case 'pronunciations':
      return db.hskPronunciation.findMany({ where: { stageId }, orderBy: { sortOrder: 'asc' } })
    case 'readings':
      return db.hskReading.findMany({ where: { stageId }, orderBy: { sortOrder: 'asc' } })
    default:
      return []
  }
}

/** Stringify the JSON-array columns before persisting (by-resource copies) */
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ resource: string }> }
) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { resource } = await params
  if (!isResource(resource)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { searchParams } = new URL(req.url)
  const level = searchParams.get('level') ?? 'hsk1'
  const stageId = searchParams.get('stageId') ?? ''

  try {
    if (resource === 'stages') {
      const rows = await db.hskStage.findMany({
        where: { level: (['hsk1', 'hsk2', 'hsk3'] as string[]).includes(level) ? level : 'hsk1' },
        orderBy: { stageNumber: 'asc' },
        include: { _count: { select: { words: true, grammar: true, readings: true, pronunciations: true } } },
      })
      return NextResponse.json({
        stages: rows.map((s) => ({
          id: s.id,
          level: s.level,
          stageNumber: s.stageNumber,
          title: s.title,
          description: s.description,
          published: s.published,
          manuallyUnlocked: s.manuallyUnlocked,
          wordCount: s._count.words,
          grammarCount: s._count.grammar,
          readingCount: s._count.readings,
          pronunciationCount: s._count.pronunciations,
        })),
      })
    }
    if (!stageId) {
      return NextResponse.json({ error: 'stageId is required' }, { status: 400 })
    }
    const items = await listByStage(resource, stageId)
    return NextResponse.json({ items })
  } catch (err) {
    console.error(`[GET /api/admin/hsk/${resource}] error:`, err)
    return NextResponse.json({ error: 'Could not load content' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ resource: string }> }
) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { resource } = await params
  if (!isResource(resource)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const body = await req.json().catch(() => null)
    const parsed = createSchemas[resource].safeParse(body)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return NextResponse.json(
        { error: first ? `${first.path.join('.') || 'field'}: ${first.message}` : 'Invalid data' },
        { status: 400 }
      )
    }
    const data = prepareData(resource, parsed.data as Record<string, unknown>)
    let row: { id: string }
    switch (resource) {
      case 'stages':
        row = await db.hskStage.create({ data: data as Parameters<typeof db.hskStage.create>[0]['data'] })
        break
      case 'words':
        row = await db.hskWord.create({ data: data as Parameters<typeof db.hskWord.create>[0]['data'] })
        break
      case 'grammar':
        row = await db.hskGrammar.create({ data: data as Parameters<typeof db.hskGrammar.create>[0]['data'] })
        break
      case 'pronunciations':
        row = await db.hskPronunciation.create({ data: data as Parameters<typeof db.hskPronunciation.create>[0]['data'] })
        break
      case 'readings':
        row = await db.hskReading.create({ data: data as Parameters<typeof db.hskReading.create>[0]['data'] })
        break
    }
    const actor = await getAdminActor(req)
    logAdminAction({
      actor,
      action: `hsk.${resource}.create`,
      targetType: 'hskContent',
      targetId: row.id,
      meta: { resource },
    })
    return NextResponse.json({ ok: true, id: row.id })
  } catch (err) {
    if (err instanceof Error && err.message.includes('Unique constraint')) {
      return NextResponse.json({ error: 'That stage number already exists for this level.' }, { status: 409 })
    }
    console.error(`[POST /api/admin/hsk/${resource}] error:`, err)
    return NextResponse.json({ error: 'Could not create the item' }, { status: 500 })
  }
}
