// ---------------------------------------------------------------------------
// 🧩 DB-backed exercise sets (SERVER-ONLY)
//
// When the admin has authored questions for a stage+module (HskQuestion with
// stageNumber + skill), those are the module test. Otherwise the deterministic
// generated set from builder.ts keeps every stage fully playable out of the
// box. Answer keys never leave the server in either case.
// ---------------------------------------------------------------------------

import { db } from '@/lib/db'
import { buildModuleExercises, type KeyedExercise, type AnswerKey } from '@/lib/practice/hsk/builder'
import type { ClientExercise, HskModuleKind } from '@/lib/practice/hsk/types'

const MODULE_SKILLS: Record<HskModuleKind, string[]> = {
  vocabulary: ['vocabulary'],
  grammar: ['grammar'],
  pronunciation: ['pronunciation', 'listening'],
  reading: ['reading'],
}

function parseJsonArray<T>(raw: string | null | undefined): T[] {
  if (!raw) return []
  try {
    const v = JSON.parse(raw)
    return Array.isArray(v) ? (v as T[]) : []
  } catch {
    return []
  }
}

/** Resolve an EducationalFile reference to a browser-usable URL */
async function fileUrlsOf(ids: Array<string | null>): Promise<Map<string, string>> {
  const clean = ids.filter((x): x is string => Boolean(x))
  if (clean.length === 0) return new Map()
  const rows = await db.educationalFile.findMany({
    where: { id: { in: clean } },
    select: { id: true },
  })
  return new Map(rows.map((r) => [r.id, `/api/files/${r.id}`]))
}

function shuffleDeterministic<T>(arr: readonly T[], seed: string): T[] {
  let h = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  const out = [...arr]
  let a = h >>> 0
  for (let i = out.length - 1; i > 0; i--) {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), a | 1)
    t = (t + Math.imul(t ^ (t >>> 7), t | 61)) ^ t
    const j = ((t ^ (t >>> 14)) >>> 0) % (i + 1)
    const tmp = out[i]
    out[i] = out[j]
    out[j] = tmp
  }
  return out
}

export async function buildDbModuleExercises(
  stage: number,
  module: HskModuleKind,
  level: string
): Promise<KeyedExercise[]> {
  const skills = MODULE_SKILLS[module]
  let rows: Array<{
    id: string
    kind: string
    prompt: string
    hanzi: string
    pinyin: string
    options: string
    answerIndex: number | null
    matchLeft: string
    matchOptions: string
    tiles: string
    audioFileId: string | null
    imageFileId: string | null
    sortOrder: number
  }> = []
  try {
    rows = await db.hskQuestion.findMany({
      where: { level, stageNumber: stage, skill: { in: skills }, published: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })
  } catch (e) {
    console.error('[buildDbModuleExercises] query failed:', e instanceof Error ? e.message : e)
    return []
  }
  if (rows.length === 0) return []

  const fileUrls = await fileUrlsOf(rows.flatMap((r) => [r.audioFileId, r.imageFileId]))
  const out: KeyedExercise[] = []
  for (const r of rows) {
    const options = parseJsonArray<string>(r.options)
    const matchLeft = parseJsonArray<string>(r.matchLeft)
    const matchOptions = parseJsonArray<string>(r.matchOptions)
    const tiles = parseJsonArray<string>(r.tiles)
    const ex: ClientExercise = {
      id: r.id,
      kind: r.kind as ClientExercise['kind'],
      prompt: r.prompt,
      hanzi: r.hanzi || undefined,
      pinyin: r.pinyin || undefined,
      audioUrl: r.audioFileId ? fileUrls.get(r.audioFileId) : undefined,
      imageUrl: r.imageFileId ? fileUrls.get(r.imageFileId) : undefined,
    }
    let key: AnswerKey
    if (r.kind === 'match') {
      if (matchLeft.length === 0 || matchLeft.length !== matchOptions.length) continue
      const shuffled = shuffleDeterministic(matchOptions, r.id)
      ex.matchLeft = matchLeft
      ex.options = shuffled
      key = { t: 'match', value: matchOptions.map((m) => shuffled.indexOf(m)) }
    } else if (r.kind === 'order') {
      if (tiles.length < 2) continue
      const display = shuffleDeterministic(tiles, r.id)
      const identity = display.length === tiles.length && display.every((t, j) => t === tiles[j])
      const finalDisplay = identity ? [...display.slice(1), display[0]] : display
      const queues = new Map<string, number[]>()
      finalDisplay.forEach((t, idx) => {
        const q = queues.get(t) ?? []
        q.push(idx)
        queues.set(t, q)
      })
      key = { t: 'order', value: tiles.map((t) => queues.get(t)?.shift() ?? finalDisplay.indexOf(t)) }
      ex.tiles = finalDisplay
    } else {
      if (options.length === 0 || r.answerIndex === null || r.answerIndex < 0 || r.answerIndex >= options.length) continue
      ex.options = options
      key = { t: 'index', value: r.answerIndex }
    }
    out.push({ exercise: ex, key })
  }
  return out
}

/** DB questions when authored, otherwise the deterministic generated set */
export async function getModuleExercisesWithKeys(
  stage: number,
  module: HskModuleKind,
  level = 'hsk1'
): Promise<{ keyed: KeyedExercise[]; source: 'db' | 'generated' }> {
  const fromDb = await buildDbModuleExercises(stage, module, level)
  if (fromDb.length > 0) {
    return { keyed: fromDb, source: 'db' }
  }
  return { keyed: buildModuleExercises(stage, module), source: 'generated' }
}
