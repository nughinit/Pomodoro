import { describe, expect, it } from 'vitest'
import { DEFAULT_DURATIONS_MS } from './types'
import { createIdleState, getRemainingMs, pause, reset, resume, start, tick } from './timer'

const T0 = 1_000_000

describe('createIdleState', () => {
  it('creates an idle focus state with the default duration', () => {
    const state = createIdleState()

    expect(state).toEqual({
      status: 'idle',
      sessionType: 'focus',
      durationMs: DEFAULT_DURATIONS_MS.focus,
    })
  })

  it('uses the correct default duration for all session types', () => {
    expect(createIdleState('focus').durationMs).toBe(25 * 60 * 1000)
    expect(createIdleState('shortBreak').durationMs).toBe(5 * 60 * 1000)
    expect(createIdleState('longBreak').durationMs).toBe(15 * 60 * 1000)
  })
})

describe('start', () => {
  it('transitions idle to running with the correct target timestamp', () => {
    const idle = createIdleState('focus')
    const running = start(idle, T0)

    expect(running).toEqual({
      status: 'running',
      sessionType: 'focus',
      durationMs: DEFAULT_DURATIONS_MS.focus,
      targetTimestamp: T0 + DEFAULT_DURATIONS_MS.focus,
    })
  })
})

describe('pause', () => {
  it('transitions running to paused with correctly calculated remaining time', () => {
    const running = start(createIdleState('focus'), T0)
    const elapsed = 60_000
    const paused = pause(running, T0 + elapsed)

    expect(paused).toEqual({
      status: 'paused',
      sessionType: 'focus',
      durationMs: DEFAULT_DURATIONS_MS.focus,
      remainingMs: DEFAULT_DURATIONS_MS.focus - elapsed,
    })
  })

  it('clamps remaining time to zero when paused after the target', () => {
    const running = start(createIdleState('focus'), T0)
    const paused = pause(running, T0 + DEFAULT_DURATIONS_MS.focus + 5_000)

    expect(paused.status).toBe('paused')
    expect((paused as { remainingMs: number }).remainingMs).toBe(0)
  })
})

describe('resume', () => {
  it('transitions paused to running with a new correct target timestamp', () => {
    const running = start(createIdleState('focus'), T0)
    const paused = pause(running, T0 + 60_000)
    const resumedAt = T0 + 120_000
    const resumed = resume(paused, resumedAt)

    expect(resumed).toEqual({
      status: 'running',
      sessionType: 'focus',
      durationMs: DEFAULT_DURATIONS_MS.focus,
      targetTimestamp: resumedAt + (DEFAULT_DURATIONS_MS.focus - 60_000),
    })
  })
})

describe('tick', () => {
  it('remains running before the target timestamp', () => {
    const running = start(createIdleState('focus'), T0)
    const result = tick(running, T0 + DEFAULT_DURATIONS_MS.focus - 1)

    expect(result.status).toBe('running')
  })

  it('transitions to completed exactly at the target timestamp', () => {
    const running = start(createIdleState('focus'), T0)
    const result = tick(running, T0 + DEFAULT_DURATIONS_MS.focus)

    expect(result).toEqual({
      status: 'completed',
      sessionType: 'focus',
      durationMs: DEFAULT_DURATIONS_MS.focus,
    })
  })

  it('transitions to completed after the target timestamp', () => {
    const running = start(createIdleState('focus'), T0)
    const result = tick(running, T0 + DEFAULT_DURATIONS_MS.focus + 10_000)

    expect(result.status).toBe('completed')
  })
})

describe('reset', () => {
  it('resets from running back to idle with the full duration', () => {
    const running = start(createIdleState('shortBreak'), T0)
    const idle = reset(running)

    expect(idle).toEqual(createIdleState('shortBreak'))
  })

  it('resets from paused back to idle with the full duration', () => {
    const running = start(createIdleState('longBreak'), T0)
    const paused = pause(running, T0 + 1_000)
    const idle = reset(paused)

    expect(idle).toEqual(createIdleState('longBreak'))
  })

  it('resets from completed back to idle with the full duration', () => {
    const running = start(createIdleState('focus'), T0)
    const completed = tick(running, T0 + DEFAULT_DURATIONS_MS.focus)
    const idle = reset(completed)

    expect(idle).toEqual(createIdleState('focus'))
  })
})

describe('invalid transitions', () => {
  it('ignores pause when idle', () => {
    const idle = createIdleState('focus')
    expect(pause(idle, T0)).toBe(idle)
  })

  it('ignores start when already running', () => {
    const running = start(createIdleState('focus'), T0)
    expect(start(running, T0 + 1_000)).toBe(running)
  })

  it('ignores resume when running', () => {
    const running = start(createIdleState('focus'), T0)
    expect(resume(running, T0 + 1_000)).toBe(running)
  })

  it('ignores start when completed', () => {
    const running = start(createIdleState('focus'), T0)
    const completed = tick(running, T0 + DEFAULT_DURATIONS_MS.focus)
    expect(start(completed, T0)).toBe(completed)
  })
})

describe('getRemainingMs', () => {
  it('computes remaining time for a running state from the target timestamp', () => {
    const running = start(createIdleState('focus'), T0)
    expect(getRemainingMs(running, T0 + 60_000)).toBe(DEFAULT_DURATIONS_MS.focus - 60_000)
  })

  it('never returns a negative value', () => {
    const running = start(createIdleState('focus'), T0)
    expect(getRemainingMs(running, T0 + DEFAULT_DURATIONS_MS.focus + 60_000)).toBe(0)
  })
})
