import { useCallback, useEffect, useState } from 'react'
import { getRemainingMs, createIdleState, pause, reset, resume, start, tick } from '../domain/timer'
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
  const [remainingMs, setRemainingMs] = useState<number>(() => state.durationMs)

  const runningTarget = state.status === 'running' ? state.targetTimestamp : null

  useEffect(() => {
    if (state.status !== 'running' || runningTarget === null) return

    const target = runningTarget

    const intervalId = window.setInterval(() => {
      const now = Date.now()
      setState((current) => tick(current, now))
      setRemainingMs(Math.max(0, target - now))
    }, TICK_INTERVAL_MS)

    return () => window.clearInterval(intervalId)
  }, [state.status, runningTarget])

  const handleStart = useCallback(() => {
    const now = Date.now()
    const next = state.status === 'completed' ? start(reset(state), now) : start(state, now)
    setState(next)
    setRemainingMs(getRemainingMs(next, now))
  }, [state])

  const handlePause = useCallback(() => {
    const now = Date.now()
    const next = pause(state, now)
    setState(next)
    setRemainingMs(getRemainingMs(next, now))
  }, [state])

  const handleResume = useCallback(() => {
    const now = Date.now()
    const next = resume(state, now)
    setState(next)
    setRemainingMs(getRemainingMs(next, now))
  }, [state])

  const handleReset = useCallback(() => {
    const next = reset(state)
    setState(next)
    setRemainingMs(next.durationMs)
  }, [state])

  return { state, remainingMs, handleStart, handlePause, handleResume, handleReset }
}
