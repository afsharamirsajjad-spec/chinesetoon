// ---------------------------------------------------------------------------
// 🗂️ Educational files — shared storage layer (Part 5)
//
// ONE upload system for every educational asset (audio, images, documents,
// video, data) — Practice, Exams and lessons all reference rows of
// EducationalFile by id; no per-feature upload code paths.
//
// Storage: Vercel Blob (the site's only persistent backend) with
// content-addressed pathnames (sha256 → edu/<hash>.<ext>) — re-uploading the
// same bytes yields the same object. Private blob stores are handled by
// putBlobFile; private objects are streamed to browsers through
// /api/files/[id] with the server token.
//
// Validation: type is detected from MAGIC BYTES (never the browser's claim),
// only whitelisted formats pass, and size is capped under the Vercel
// serverless body limit (4.5 MB).
// ---------------------------------------------------------------------------

import { createHash } from 'crypto'
import { putBlobFile, fetchBlobResponse } from '@/lib/blob-store'

export const MAX_EDU_FILE_BYTES = 4 * 1024 * 1024 // 4MB — under the 4.5MB serverless body limit

export const EDU_KINDS = ['image', 'audio', 'video', 'document', 'data', 'other'] as const
export type EduFileKind = (typeof EDU_KINDS)[number]

export const EDU_MIME_WHITELIST: Record<string, EduFileKind> = {
  // documents
  'application/pdf': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'document',
  'text/csv': 'data',
  'text/plain': 'data',
  // audio
  'audio/mpeg': 'audio',
  'audio/wav': 'audio',
  'audio/x-wav': 'audio',
  'audio/wave': 'audio',
  'audio/mp4': 'audio',
  // video
  'video/mp4': 'video',
  // images
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'image/gif': 'image',
}

const EXT_BY_MIME: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'text/csv': 'csv',
  'text/plain': 'txt',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/wave': 'wav',
  'audio/mp4': 'm4a',
  'video/mp4': 'mp4',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

export class EduFileError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EduFileError'
  }
}

export class EduStorageUnavailableError extends Error {
  constructor() {
    super(
      'File storage is not configured. Connect a Vercel Blob store to this project (Storage → Create → Blob) so BLOB_READ_WRITE_TOKEN is set, then redeploy.'
    )
    this.name = 'EduStorageUnavailableError'
  }
}

/**
 * Detect the real type from magic bytes. Returns null for anything outside
 * the whitelist (executables, SVG with scripts, archives, … are rejected).
 */
export function detectEduFileType(bytes: Uint8Array): { mime: string; kind: EduFileKind } | null {
  if (bytes.length < 12) return null
  const ascii = (start: number, text: string) =>
    [...text].every((ch, i) => bytes[start + i] === ch.charCodeAt(0))
  // documents
  if (ascii(0, '%PDF')) return { mime: 'application/pdf', kind: 'document' }
  if (bytes[0] === 0x50 && bytes[1] === 0x4b && (bytes[2] === 0x03 || bytes[2] === 0x05 || bytes[2] === 0x07)) {
    // ZIP container — docx/xlsx (distinguished by the client-sent name only for display;
    // both are office documents) — the mime comes from the extension check below
    return { mime: 'application/zip', kind: 'document' }
  }
  // audio
  if (ascii(0, 'ID3')) return { mime: 'audio/mpeg', kind: 'audio' }
  if (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) return { mime: 'audio/mpeg', kind: 'audio' }
  if (ascii(0, 'RIFF') && ascii(8, 'WAVE')) return { mime: 'audio/wav', kind: 'audio' }
  if (ascii(4, 'ftyp')) {
    // MP4 container — could be audio (m4a) or video; display name decides
    return { mime: 'video/mp4', kind: 'video' }
  }
  // images (same detection as the image system)
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { mime: 'image/jpeg', kind: 'image' }
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return { mime: 'image/png', kind: 'image' }
  if (bytes[0] === 0x52 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return { mime: 'image/webp', kind: 'image' }
  }
  if (ascii(0, 'GIF8')) return { mime: 'image/gif', kind: 'image' }
  // plain text / csv (utf-8 bom or printable)
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) return { mime: 'text/plain', kind: 'data' }
  return null
}

/**
 * Refine the detected container type using the file name extension:
 * docx vs xlsx inside the ZIP container, m4a vs mp4 inside ftyp.
 * Returns null when the claimed extension is not whitelisted.
 */
export function refineEduType(
  detected: { mime: string; kind: EduFileKind },
  fileName: string
): { mime: string; kind: EduFileKind; ext: string } | null {
  const ext = (fileName.split('.').pop() ?? '').toLowerCase()
  if (detected.mime === 'application/zip') {
    if (ext === 'docx') return { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', kind: 'document', ext }
    if (ext === 'xlsx') return { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', kind: 'document', ext }
    return null
  }
  if (detected.mime === 'video/mp4' && ext === 'm4a') {
    return { mime: 'audio/mp4', kind: 'audio', ext }
  }
  const mime = EDU_MIME_WHITELIST[detected.mime] ? detected.mime : null
  if (!mime) return null
  const knownExt = EXT_BY_MIME[mime] ?? ext
  // the sniffed type wins over the claimed extension (anti-spoofing)
  return { mime, kind: EDU_MIME_WHITELIST[mime], ext: knownExt }
}

export interface SavedEduFile {
  url: string
  isPrivate: boolean
  hash: string
  mime: string
  kind: EduFileKind
  ext: string
  size: number
}

/** Save validated bytes to Blob — content-addressed, deduped */
export async function saveEduFile(
  mime: string,
  kind: EduFileKind,
  ext: string,
  data: Buffer
): Promise<SavedEduFile> {
  const hash = createHash('sha256').update(data).digest('hex')
  const res = await putBlobFile(`edu/${hash}.${ext}`, data)
  if (!res) throw new EduStorageUnavailableError()
  return { url: res.url, isPrivate: res.isPrivate, hash, mime, kind, ext, size: data.length }
}

/** Stream a (possibly private) blob object to the browser — server-side only */
export async function fetchEduFileResponse(url: string): Promise<Response> {
  return fetchBlobResponse(url)
}

/** Display helper */
export function formatEduSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
