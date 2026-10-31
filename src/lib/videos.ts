// ---------------------------------------------------------------------------
// 🎬 Teaching videos — YouTube helpers (Part 6)
//
// The admin pastes a YouTube URL; we extract the 11-character video ID and
// build SAFE embed/thumbnail URLs. Arbitrary iframe HTML is never accepted —
// only validated IDs from the three supported URL forms:
//   youtube.com/watch?v=ID · youtu.be/ID · youtube.com/shorts/ID
// ---------------------------------------------------------------------------

export const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/

/** Extract the video ID from a pasted URL (or a bare ID) — null when invalid */
export function extractYouTubeId(input: string): string | null {
  const raw = input.trim()
  if (!raw) return null
  if (YOUTUBE_ID_RE.test(raw)) return raw
  let url: URL | null = null
  try {
    url = new URL(raw.startsWith('http') ? raw : `https://${raw}`)
  } catch {
    return null
  }
  const host = url.hostname.replace(/^www\./, '').toLowerCase()
  if (host === 'youtu.be') {
    const id = url.pathname.slice(1).split('/')[0]
    return YOUTUBE_ID_RE.test(id) ? id : null
  }
  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
    const v = url.searchParams.get('v')
    if (v && YOUTUBE_ID_RE.test(v)) return v
    const parts = url.pathname.split('/').filter(Boolean)
    if (parts[0] === 'shorts' || parts[0] === 'embed' || parts[0] === 'live') {
      const id = parts[1] ?? ''
      return YOUTUBE_ID_RE.test(id) ? id : null
    }
  }
  return null
}

/** Safe embed URL — youtube-nocookie, no unrelated permissions */
export function youTubeEmbedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`
}

/** Thumbnail (always available for public videos) */
export function youTubeThumbnailUrl(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
}

export const VIDEO_LEVELS = ['beginner', 'hsk1', 'hsk2', 'hsk3', 'advanced'] as const
export const VIDEO_CATEGORIES = ['general', 'grammar', 'pronunciation', 'group-class', 'private-lesson'] as const

export const VIDEO_LEVEL_LABELS: Record<string, string> = {
  beginner: 'Beginner Chinese',
  hsk1: 'HSK 1',
  hsk2: 'HSK 2',
  hsk3: 'HSK 3',
  advanced: 'Advanced Chinese',
}

export const VIDEO_CATEGORY_LABELS: Record<string, string> = {
  general: 'Sample Lessons',
  grammar: 'Grammar Lessons',
  pronunciation: 'Pronunciation',
  'group-class': 'Sample Group Classes',
  'private-lesson': 'Sample Private Lessons',
}
