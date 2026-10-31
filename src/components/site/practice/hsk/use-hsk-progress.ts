'use client'

// ---------------------------------------------------------------------------
// 📈 useHskProgress — learning-progress state for the structured HSK pages
//
// Signed-in users: the server snapshot is the single source of truth
// (GET /api/practice/hsk/progress; attempts are graded + persisted server-side).
// Guests: nothing is ever uploaded — the same summary shape is kept in
// localStorage as temporary progress and a sign-in banner explains that it
// is not saved across devices. Grading itself is always server-side, so a
// guest cannot fabricate persisted records.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useState } from 'react'
import { resilientJsonFetch } from '@/lib/client-fetch'
import {
  computeSummary,
  mergeAttempt,
  parseProgressJson,
  emptyProgress,
  type Hsk1ProgressSummary,
  type ProgressSummary,
} from '@/lib/practice/hsk/progress-utils'
import type {
  AttemptInput,
  GradeResult,
  HskModuleKind,
  ProgressApiResponse,
} from '@/lib/practice/hsk/types'

const LOCAL_KEY = 'ct-hsk1-local-v1'

export interface HskProgressState {
  status: 'loading' | 'ready' | 'failed'
  authenticated: boolean
  firstName?: string
  progress: Hsk1ProgressSummary
  summary: ProgressSummary
}

export interface SubmitOutcome {
  ok: boolean
  message?: string
  result?: GradeResult
}

function loadLocalProgress(): Hsk1ProgressSummary {
  try {
    return parseProgressJson(window.localStorage.getItem(LOCAL_KEY))
  } catch {
    return emptyProgress()
  }
}

export function useHskProgress() {
  const [state, setState] = useState<HskProgressState>({
    status: 'loading',
    authenticated: false,
    progress: emptyProgress(),
    summary: computeSummary(emptyProgress()),
  })

  useEffect(() => {
    let cancelled = false
    fetch('/api/practice/hsk/progress', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ProgressApiResponse | null) => {
        if (cancelled) return
        if (data?.authenticated && data.progress) {
          setState({
            status: 'ready',
            authenticated: true,
            firstName: data.firstName,
            progress: data.progress,
            summary: computeSummary(data.progress),
          })
        } else {
          const local = loadLocalProgress()
          setState({ status: 'ready', authenticated: false, progress: local, summary: computeSummary(local) })
        }
      })
      .catch(() => {
        if (cancelled) return
        const local = loadLocalProgress()
        // progress endpoint unreachable — pages still work with local data
        setState({ status: 'failed', authenticated: false, progress: local, summary: computeSummary(local) })
      })
    return () => {
      cancelled = true
    }
  }, [])

  const submit = useCallback(
    async (stage: number, module: HskModuleKind, answers: unknown[]): Promise<SubmitOutcome> => {
      const res = await resilientJsonFetch<{
        authenticated: boolean
        result?: GradeResult
        progress?: Hsk1ProgressSummary
        firstName?: string
      }>(`/api/practice/hsk/hsk1/${stage}/${module}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })
      if (!res.ok || !res.data?.result) {
        return { ok: false, message: res.ok ? 'Grading failed — please try again.' : res.message }
      }
      const result = res.data.result
      if (res.data.authenticated && res.data.progress) {
        setState({
          status: 'ready',
          authenticated: true,
          firstName: res.data.firstName,
          progress: res.data.progress,
          summary: computeSummary(res.data.progress),
        })
      } else {
        // guest — keep temporary local progress only (never uploaded)
        const at = new Date().toISOString()
        const attempt: AttemptInput = {
          stage,
          module,
          percent: result.percent,
          passed: result.passed,
          at,
          correctWords: result.correctWords,
          wrongWords: result.wrongWords,
        }
        const local = mergeAttempt(loadLocalProgress(), attempt)
        try {
          window.localStorage.setItem(LOCAL_KEY, JSON.stringify(local))
        } catch {
          // storage full/blocked — the in-memory state still updates below
        }
        setState((prev) => ({
          status: 'ready',
          authenticated: false,
          firstName: prev.firstName,
          progress: local,
          summary: computeSummary(local),
        }))
      }
      return { ok: true, result }
    },
    []
  )

  return { ...state, submit }
}
