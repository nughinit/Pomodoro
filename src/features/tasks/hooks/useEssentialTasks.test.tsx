import { act, renderHook } from '@testing-library/react'
import { StrictMode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { useEssentialTasks } from './useEssentialTasks'
import { ESSENTIAL_TASKS_STORAGE_KEY } from '../storage/essentialTasksStorage'
import type { EssentialTask } from '../domain/types'
import type { StorageLike } from '../storage/essentialTasksStorage'

const TODAY = new Date(2026, 7, 24)
const YESTERDAY = new Date(2026, 7, 23)

function now(date: Date) {
  return () => date
}

class FakeStorage implements StorageLike {
  private store = new Map<string, string>()
  setItemCalls = 0

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null
  }

  setItem(key: string, value: string): void {
    this.setItemCalls += 1
    this.store.set(key, value)
  }

  seedRecord(localDate: string, tasks: EssentialTask[]): void {
    this.store.set(
      ESSENTIAL_TASKS_STORAGE_KEY,
      JSON.stringify({ version: 1, localDate, tasks }),
    )
  }

  readRecord(): { version: number; localDate: string; tasks: EssentialTask[] } | null {
    const raw = this.store.get(ESSENTIAL_TASKS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  }
}

class ThrowingGetStorage implements StorageLike {
  getItem(): string | null {
    throw new Error('getItem failed')
  }

  setItem(): void {
    // no-op
  }
}

class ThrowingSetStorage implements StorageLike {
  private store = new Map<string, string>()

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null
  }

  setItem(): void {
    throw new Error('setItem failed')
  }
}

describe('useEssentialTasks hydration', () => {
  it('hydrates pending and completed tasks for the current local date on first render', () => {
    const storage = new FakeStorage()
    storage.seedRecord('2026-08-24', [
      { id: 'essential-task-1', title: 'Write report', status: 'pending' },
      { id: 'essential-task-2', title: 'Plan day', status: 'completed' },
    ])

    const { result } = renderHook(() => useEssentialTasks({ storage, now: now(TODAY) }))

    expect(result.current.tasks).toEqual([
      { id: 'essential-task-1', title: 'Write report', status: 'pending' },
      { id: 'essential-task-2', title: 'Plan day', status: 'completed' },
    ])
    expect(result.current.completedCount).toBe(1)
  })

  it('presents an empty Today list when the stored record belongs to another day', () => {
    const storage = new FakeStorage()
    storage.seedRecord('2026-08-23', [{ id: 'essential-task-1', title: 'Old task', status: 'pending' }])

    const { result } = renderHook(() => useEssentialTasks({ storage, now: now(TODAY) }))

    expect(result.current.tasks).toEqual([])
  })

  it('presents an empty list when there is no stored record', () => {
    const storage = new FakeStorage()

    const { result } = renderHook(() => useEssentialTasks({ storage, now: now(TODAY) }))

    expect(result.current.tasks).toEqual([])
  })
})

describe('useEssentialTasks: no write on mount', () => {
  it('does not call setItem just because the hook mounted', () => {
    const storage = new FakeStorage()
    storage.seedRecord('2026-08-24', [{ id: 'essential-task-1', title: 'Write report', status: 'pending' }])

    renderHook(() => useEssentialTasks({ storage, now: now(TODAY) }))

    expect(storage.setItemCalls).toBe(0)
  })

  it('does not call setItem on mount under React StrictMode', () => {
    const storage = new FakeStorage()
    storage.seedRecord('2026-08-24', [{ id: 'essential-task-1', title: 'Write report', status: 'pending' }])

    renderHook(() => useEssentialTasks({ storage, now: now(TODAY) }), {
      wrapper: StrictMode,
    })

    expect(storage.setItemCalls).toBe(0)
  })

  it('preserves an other-day record after simply mounting, without overwriting it', () => {
    const storage = new FakeStorage()
    storage.seedRecord('2026-08-23', [{ id: 'essential-task-1', title: 'Old task', status: 'pending' }])

    renderHook(() => useEssentialTasks({ storage, now: now(TODAY) }))

    expect(storage.readRecord()).toEqual({
      version: 1,
      localDate: '2026-08-23',
      tasks: [{ id: 'essential-task-1', title: 'Old task', status: 'pending' }],
    })
  })
})

describe('useEssentialTasks mutations persist', () => {
  it('persists the updated list after adding a task', () => {
    const storage = new FakeStorage()
    const { result } = renderHook(() => useEssentialTasks({ storage, now: now(TODAY) }))

    act(() => {
      result.current.addTask('Write report')
    })

    expect(storage.readRecord()).toEqual({
      version: 1,
      localDate: '2026-08-24',
      tasks: [{ id: 'essential-task-1', title: 'Write report', status: 'pending' }],
    })
  })

  it('persists completed status after completing a task', () => {
    const storage = new FakeStorage()
    const { result } = renderHook(() => useEssentialTasks({ storage, now: now(TODAY) }))

    act(() => {
      result.current.addTask('Write report')
    })
    act(() => {
      result.current.completeTask('essential-task-1')
    })

    expect(storage.readRecord()?.tasks).toEqual([
      { id: 'essential-task-1', title: 'Write report', status: 'completed' },
    ])
  })

  it('persists pending status after reopening a task', () => {
    const storage = new FakeStorage()
    const { result } = renderHook(() => useEssentialTasks({ storage, now: now(TODAY) }))

    act(() => {
      result.current.addTask('Write report')
    })
    act(() => {
      result.current.completeTask('essential-task-1')
    })
    act(() => {
      result.current.reopenTask('essential-task-1')
    })

    expect(storage.readRecord()?.tasks).toEqual([
      { id: 'essential-task-1', title: 'Write report', status: 'pending' },
    ])
  })

  it('persists the list without the removed task after removal', () => {
    const storage = new FakeStorage()
    const { result } = renderHook(() => useEssentialTasks({ storage, now: now(TODAY) }))

    act(() => {
      result.current.addTask('Write report')
    })
    act(() => {
      result.current.addTask('Plan day')
    })
    act(() => {
      result.current.removeTask('essential-task-1')
    })

    expect(storage.readRecord()?.tasks).toEqual([
      { id: 'essential-task-2', title: 'Plan day', status: 'pending' },
    ])
  })

  it('does not write when adding an empty title', () => {
    const storage = new FakeStorage()
    const { result } = renderHook(() => useEssentialTasks({ storage, now: now(TODAY) }))

    act(() => {
      result.current.addTask('   ')
    })

    expect(storage.setItemCalls).toBe(0)
  })

  it('does not write an additional time when the task limit is reached', () => {
    const storage = new FakeStorage()
    const { result } = renderHook(() => useEssentialTasks({ storage, now: now(TODAY) }))

    act(() => {
      result.current.addTask('Task one')
    })
    act(() => {
      result.current.addTask('Task two')
    })
    act(() => {
      result.current.addTask('Task three')
    })
    act(() => {
      result.current.addTask('Task four')
    })

    const callsAtLimit = storage.setItemCalls

    act(() => {
      result.current.addTask('Task five')
    })

    expect(storage.setItemCalls).toBe(callsAtLimit)
    expect(result.current.tasks).toHaveLength(4)
  })
})

describe('useEssentialTasks id handling', () => {
  it('assigns new ids that do not collide with hydrated tasks', () => {
    const storage = new FakeStorage()
    storage.seedRecord('2026-08-24', [
      { id: 'essential-task-1', title: 'First', status: 'pending' },
      { id: 'essential-task-2', title: 'Second', status: 'pending' },
    ])

    const { result } = renderHook(() => useEssentialTasks({ storage, now: now(TODAY) }))

    act(() => {
      result.current.addTask('Third')
    })

    const ids = result.current.tasks.map((task) => task.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toContain('essential-task-3')
  })

  it('preserves a persisted id outside the essential-task-N pattern and assigns the next pattern id without collision', () => {
    const storage = new FakeStorage()
    storage.seedRecord('2026-08-24', [
      { id: 'custom-task-id', title: 'Legacy', status: 'pending' },
      { id: 'essential-task-1', title: 'First', status: 'pending' },
    ])

    const { result } = renderHook(() => useEssentialTasks({ storage, now: now(TODAY) }))

    act(() => {
      result.current.addTask('New task')
    })

    const ids = result.current.tasks.map((task) => task.id)
    expect(ids).toContain('custom-task-id')
    expect(ids).toContain('essential-task-2')
    expect(new Set(ids).size).toBe(ids.length)

    expect(storage.readRecord()).toEqual({
      version: 1,
      localDate: '2026-08-24',
      tasks: [
        { id: 'custom-task-id', title: 'Legacy', status: 'pending' },
        { id: 'essential-task-1', title: 'First', status: 'pending' },
        { id: 'essential-task-2', title: 'New task', status: 'pending' },
      ],
    })
  })
})

describe('useEssentialTasks storage failures', () => {
  it('starts with an empty list and keeps operating when getItem throws', () => {
    const { result } = renderHook(() =>
      useEssentialTasks({ storage: new ThrowingGetStorage(), now: now(TODAY) }),
    )

    expect(result.current.tasks).toEqual([])

    act(() => {
      result.current.addTask('Write report')
    })

    expect(result.current.tasks).toEqual([{ id: 'essential-task-1', title: 'Write report', status: 'pending' }])
  })

  it('keeps the in-memory state updated when setItem throws', () => {
    const { result } = renderHook(() =>
      useEssentialTasks({ storage: new ThrowingSetStorage(), now: now(TODAY) }),
    )

    act(() => {
      result.current.addTask('Write report')
    })

    expect(result.current.tasks).toEqual([{ id: 'essential-task-1', title: 'Write report', status: 'pending' }])

    act(() => {
      result.current.completeTask('essential-task-1')
    })

    expect(result.current.tasks[0].status).toBe('completed')
  })

  it('falls back to an empty in-memory list and stays functional when localStorage access itself throws', () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage')

    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('localStorage disabled')
      },
    })

    try {
      const { result } = renderHook(() => useEssentialTasks({ now: now(TODAY) }))

      expect(result.current.tasks).toEqual([])

      act(() => {
        result.current.addTask('Write report')
      })

      expect(result.current.tasks).toEqual([
        { id: 'essential-task-1', title: 'Write report', status: 'pending' },
      ])
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(window, 'localStorage', originalDescriptor)
      }
    }
  })
})

describe('useEssentialTasks remount', () => {
  it('recovers persisted titles and statuses on a new mount for the same day', () => {
    const storage = new FakeStorage()
    const first = renderHook(() => useEssentialTasks({ storage, now: now(TODAY) }))

    act(() => {
      first.result.current.addTask('Write report')
    })
    act(() => {
      first.result.current.completeTask('essential-task-1')
    })
    first.unmount()

    const second = renderHook(() => useEssentialTasks({ storage, now: now(TODAY) }))

    expect(second.result.current.tasks).toEqual([
      { id: 'essential-task-1', title: 'Write report', status: 'completed' },
    ])
  })

  it('does not carry over yesterday tasks into a same-session remount for a new day', () => {
    const storage = new FakeStorage()
    const first = renderHook(() => useEssentialTasks({ storage, now: now(YESTERDAY) }))

    act(() => {
      first.result.current.addTask('Old task')
    })
    first.unmount()

    const second = renderHook(() => useEssentialTasks({ storage, now: now(TODAY) }))

    expect(second.result.current.tasks).toEqual([])
  })
})

describe('useEssentialTasks default now', () => {
  it('uses the real current date when no now function is injected', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 24, 10, 0, 0))

    try {
      const storage = new FakeStorage()
      storage.seedRecord('2026-08-24', [{ id: 'essential-task-1', title: 'Task', status: 'pending' }])

      const { result } = renderHook(() => useEssentialTasks({ storage }))

      expect(result.current.tasks).toEqual([{ id: 'essential-task-1', title: 'Task', status: 'pending' }])
    } finally {
      vi.useRealTimers()
    }
  })
})
