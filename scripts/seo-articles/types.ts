// ---------------------------------------------------------------------------
// تایپ مشترک مقالاتِ سِد سئو — هر مقاله یک ماژول در همین پوشه
// ---------------------------------------------------------------------------

export type SeedTag = 'news' | 'culture' | 'tips' | 'hsk'
export type SeedColor = 'sage' | 'butter' | 'peach'

export interface SeedPost {
  slug: string
  title: string
  tag: SeedTag
  emoji: string
  color: SeedColor
  /** ۱۴۰–۱۶۰ کاراکتر — همان meta description صفحهٔ مقاله است */
  excerpt: string
  content: string
}
