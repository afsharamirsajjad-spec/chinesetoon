// ---------------------------------------------------------------------------
// فهرست مرکزی مقاله‌های سئو — هم اسکریپت seed و هم مسیر API ایمپورت از پنل
// اینجا import می‌کنند تا همیشه یک منبع حقیقت باشد.
// ---------------------------------------------------------------------------

import { HSK_EXAM } from './hsk-exam-guide'
import { SCHOLARSHIPS } from './china-scholarships'
import { BEGINNERS } from './learn-chinese-beginners'
import { STUDY_IN_CHINA } from './study-in-china'
import { HSK1 } from './hsk-1-study-guide'
import { HSK2 } from './hsk-2-study-guide'
import { HSK3 } from './hsk-3-preparation-plan'
import { LISTENING } from './mandarin-listening-practice-guide'
import type { SeedPost } from './types'

export const ARTICLES: SeedPost[] = [
  HSK_EXAM,
  SCHOLARSHIPS,
  BEGINNERS,
  STUDY_IN_CHINA,
  HSK1,
  HSK2,
  HSK3,
  LISTENING,
]

export type { SeedPost }
