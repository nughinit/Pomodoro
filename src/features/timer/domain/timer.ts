import { DEFAULT_DURATIONS_MS } from './types'
import type { SessionType, TimerState } from './types'

export function createIdleState(sessionType: SessionType = 'focus'): TimerState {
  return {
    status: 'idle',
    sessionType,
    durationMs: DEFAULT_DURATIONS_MS[sessionType],
  }
}

export function start(state: TimerState, now: number): TimerState {
  if (state.status !== 'idle') return state

  return {
    status: 'running',
    sessionType: state.sessionType,
    durationMs: state.durationMs,
    targetTimestamp: now + state.durationMs,
  }
}

export function pause(state: TimerState, now: number): TimerState {
  if (state.status !== 'running') return state

  return {
    status: 'paused',
    sessionType: state.sessionType,
    durationMs: state.durationMs,
    remainingMs: clampToZero(state.targetTimestamp - now),
  }
}

export function resume(state: TimerState, now: number): TimerState {
  if (state.status !== 'paused') return state

  return {
    status: 'running',
    sessionType: state.sessionType,
    durationMs: state.durationMs,
    targetTimestamp: now + state.remainingMs,
  }
}

export function reset(state: TimerState): TimerState {
  return createIdleState(state.sessionType)
}

export function tick(state: TimerState, now: number): TimerState {
  if (state.status !== 'running') return state
  if (now < state.targetTimestamp) return state

  return {
    status: 'completed',
    sessionType: state.sessionType,
    durationMs: state.durationMs,
  }
}

export function getRemainingMs(state: TimerState, now: number): number {
  switch (state.status) {
    case 'idle':
      return state.durationMs
    case 'running':
      return clampToZero(state.targetTimestamp - now)
    case 'paused':
      return state.remainingMs
    case 'completed':
      return 0
  }
}

function clampToZero(value: number): number {
  return value > 0 ? value : 0
}
