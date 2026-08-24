import { useCallback, useEffect, useState } from 'react'
import { createIdleState, getRemainingMs, pause, reset, resume, start, tick } from '../domain/timer'
import type { TimerState } from '../domain/types'

const TICK_INTERVAL_MS = 250

export interface UseFocusTimerResult {
  state: TimerState
  remainingMs: number
  handleStart: () => void
  handlePause: () => void
  handleResume: () => void
  handleReset: () => void
}

export function useFocusTimer(): UseFocusTimerResult {
  const [state, setState] = useState<TimerState>(() => createIdleState('focus'))
  const [, forceTick] = useState(0)

  useEffect(() => {
    if (state.status !== 'running') return

    const intervalId = window.setInterval(() => {
      const now = Date.now()
      setState((current) => tick(current, now))
      forceTick((count) => count + 1)
    }, TICK_INTERVAL_MS)

    return () => window.clearInterval(intervalId)
  }, [state])

  const handleStart = useCallback(() => setState((current) => start(current, Date.now())), [])
  const handlePause = useCallback(() => setState((current) => pause(current, Date.now())), [])
  const handleResume = useCallback(() => setState((current) => resume(current, Date.now())), [])
  const handleReset = useCallback(() => setState((current) => reset(current)), [])

  const remainingMs = getRemainingMs(state, Date.now())

  return { state, remainingMs, handleStart, handlePause, handleResume, handleReset }
}
