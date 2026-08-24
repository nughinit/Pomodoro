export type SessionType = 'focus' | 'shortBreak' | 'longBreak'

export const DEFAULT_DURATIONS_MS: Record<SessionType, number> = {
  focus: 25 * 60 * 1000,
  shortBreak: 5 * 60 * 1000,
  longBreak: 15 * 60 * 1000,
}

interface BaseState {
  sessionType: SessionType
  durationMs: number
}

export interface IdleState extends BaseState {
  status: 'idle'
}

export interface RunningState extends BaseState {
  status: 'running'
  targetTimestamp: number
}

export interface PausedState extends BaseState {
  status: 'paused'
  remainingMs: number
}

export interface CompletedState extends BaseState {
  status: 'completed'
}

export type TimerState = IdleState | RunningState | PausedState | CompletedState
