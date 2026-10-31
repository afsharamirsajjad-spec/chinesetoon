'use client'

// ---------------------------------------------------------------------------
// 📚 useStageContent — teaching content for stage pages
// Starts from the bundled curriculum (instant render, offline-safe) and swaps
// in the admin-managed DB content when the API returns it. A stage that exists
// only unpublished in the DB is reported as unpublished so pages can gate it.
// ---------------------------------------------------------------------------

import { useEffect, useState } from 'react'
import { getHsk1Stage, HSK1_STAGES } from '@/lib/practice/hsk/content'
import { resilientJsonFetch } from '@/lib/client-fetch'
import type { HskStageMeta } from '@/lib/practice/hsk/types'

export interface StageContentState {
  content: HskStageMeta | null
  /** true when the DB explicitly marks this stage unpublished (gate the page) */
  unpublished: boolean
  loading: boolean
}

export function useStageContent(stage: number, level = 'hsk1'): StageContentState {
  const [state, setState] = useState<StageContentState>(() => ({
    content: getHsk1Stage(stage),
    unpublished: false,
    loading: true,
  }))

  useEffect(() => {
    let cancelled = false
    resilientJsonFetch<{ stages: Array<{ stageNumber: number; published: boolean; title: string; description: string }> }>(`/api/practice/hsk/overview?level=${level}`, { cache: 'no-store' }).then(async (overviewRes) => {
      if (cancelled) return
      const overviewStage =
        overviewRes.ok && overviewRes.data
          ? overviewRes.data.stages.find((s) => s.stageNumber === stage)
          : null
      if (overviewStage && !overviewStage.published) {
        setState({ content: null, unpublished: true, loading: false })
        return
      }
      const res = await resilientJsonFetch<{ content: HskStageMeta }>(
        `/api/practice/hsk/content?level=${level}&stage=${stage}`,
        { cache: 'no-store' }
      )
      if (cancelled) return
      if (res.ok && res.data?.content) {
        setState({ content: res.data.content, unpublished: false, loading: false })
      } else {
        // DB stage absent but the bundled curriculum has it → keep static
        setState((prev) => ({
          content: prev.content ?? getHsk1Stage(stage) ?? HSK1_STAGES[0],
          unpublished: false,
          loading: false,
        }))
      }
    })
    return () => {
      cancelled = true
    }
  }, [stage, level])

  return state
}
