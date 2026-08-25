import { act, renderHook } from '@testing-library/react'
import { StrictMode } from 'react'
import { describe, expect, it } from 'vitest'
import { useAgendaItems } from './useAgendaItems'
import { AGENDA_STORAGE_KEY } from '../storage/agendaStorage'
import { ESSENTIAL_TASKS_STORAGE_KEY } from '../../tasks/storage/essentialTasksStorage'
import type { AgendaItem } from '../domain/types'
import type { StorageLike } from '../storage/agendaStorage'
import type { EssentialTask } from '../../tasks/domain/types'

const TODAY = new Date(2026, 7, 24)
const YESTERDAY = new Date(2026, 7, 23)

function now(date: Date) {
  return () => date
}

class FakeStorage implements StorageLike {
  private store = new Map<string, string>()
  setItemCalls = 0
  getItemCalls = 0

  getItem(key: string): string | null {
    this.getItemCalls += 1
    return this.store.has(key) ? this.store.get(key)! : null
  }

  setItem(key: string, value: string): void {
    this.setItemCalls += 1
    this.store.set(key, value)
  }

  seedAgenda(items: AgendaItem[]): void {
    this.store.set(AGENDA_STORAGE_KEY, JSON.stringify({ version: 1, items }))
  }

  seedRawAgenda(raw: string): void {
    this.store.set(AGENDA_STORAGE_KEY, raw)
  }

  seedEssentialTasks(localDate: string, tasks: EssentialTask[]): void {
    this.store.set(ESSENTIAL_TASKS_STORAGE_KEY, JSON.stringify({ version: 1, localDate, tasks }))
  }

  readAgendaRecord(): { version: number; items: AgendaItem[] } | null {
    const raw = this.store.get(AGENDA_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  }

  readRawAgenda(): string | null {
    return this.store.get(AGENDA_STORAGE_KEY) ?? null
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

describe('useAgendaItems initialization', () => {
  it('loads a valid multiday agenda record', () => {
    const storage = new FakeStorage()
    storage.seedAgenda([
      { id: 'a1', title: 'Yesterday task', status: 'pending', localDate: '2026-08-23', startTime: null, durationMinutes: null },
      { id: 'a2', title: 'Today task', status: 'pending', localDate: '2026-08-24', startTime: null, durationMinutes: null },
    ])

    const { result } = renderHook(() => useAgendaItems({ storage, now: now(TODAY) }))

    expect(result.current.items).toHaveLength(2)
  })

  it('exposes only the items for the selected date', () => {
    const storage = new FakeStorage()
    storage.seedAgenda([
      { id: 'a1', title: 'Yesterday task', status: 'pending', localDate: '2026-08-23', startTime: null, durationMinutes: null },
      { id: 'a2', title: 'Today task', status: 'pending', localDate: '2026-08-24', startTime: null, durationMinutes: null },
    ])

    const { result } = renderHook(() => useAgendaItems({ storage, now: now(TODAY) }))

    expect(result.current.selectedDateItems).toEqual([
      { id: 'a2', title: 'Today task', status: 'pending', localDate: '2026-08-24', startTime: null, durationMinutes: null },
    ])
  })

  it('keeps the full array internally even though only one date is shown', () => {
    const storage = new FakeStorage()
    storage.seedAgenda([
      { id: 'a1', title: 'Yesterday task', status: 'pending', localDate: '2026-08-23', startTime: null, durationMinutes: null },
      { id: 'a2', title: 'Today task', status: 'pending', localDate: '2026-08-24', startTime: null, durationMinutes: null },
    ])

    const { result } = renderHook(() => useAgendaItems({ storage, now: now(TODAY) }))

    expect(result.current.items).toHaveLength(2)
    expect(result.current.selectedDateItems).toHaveLength(1)
  })

  it('does not migrate when a loaded agenda is empty', () => {
    const storage = new FakeStorage()
    storage.seedAgenda([])
    storage.seedEssentialTasks('2026-08-24', [{ id: 'essential-task-1', title: 'Legacy', status: 'pending' }])

    const { result } = renderHook(() => useAgendaItems({ storage, now: now(TODAY) }))

    expect(result.current.items).toEqual([])
    expect(storage.setItemCalls).toBe(0)
  })

  it('migrates legacy essential tasks exactly once when the agenda record is missing', () => {
    const storage = new FakeStorage()
    storage.seedEssentialTasks('2026-08-24', [{ id: 'essential-task-1', title: 'Legacy', status: 'pending' }])

    const { result } = renderHook(() => useAgendaItems({ storage, now: now(TODAY) }))

    expect(result.current.items).toEqual([
      { id: 'essential-task-1', title: 'Legacy', status: 'pending', localDate: '2026-08-24', startTime: null, durationMinutes: null },
    ])
    expect(storage.setItemCalls).toBe(1)
  })

  it('preserves title, status, and date when migrating', () => {
    const storage = new FakeStorage()
    storage.seedEssentialTasks('2026-08-24', [
      { id: 'essential-task-1', title: 'Write report', status: 'completed' },
    ])

    const { result } = renderHook(() => useAgendaItems({ storage, now: now(TODAY) }))

    expect(result.current.items).toEqual([
      { id: 'essential-task-1', title: 'Write report', status: 'completed', localDate: '2026-08-24', startTime: null, durationMinutes: null },
    ])
  })

  it('starts empty without writing when there is no agenda and no legacy data', () => {
    const storage = new FakeStorage()

    const { result } = renderHook(() => useAgendaItems({ storage, now: now(TODAY) }))

    expect(result.current.items).toEqual([])
    expect(storage.setItemCalls).toBe(0)
  })

  it('starts in memory without overwriting an invalid agenda record', () => {
    const storage = new FakeStorage()
    storage.seedRawAgenda('not valid json {{{')

    const { result } = renderHook(() => useAgendaItems({ storage, now: now(TODAY) }))

    expect(result.current.items).toEqual([])
    expect(storage.setItemCalls).toBe(0)
    expect(storage.readRawAgenda()).toBe('not valid json {{{')
  })

  it('does not crash when getItem throws', () => {
    const { result } = renderHook(() => useAgendaItems({ storage: new ThrowingGetStorage(), now: now(TODAY) }))

    expect(result.current.items).toEqual([])
  })

  it('does not crash when the window.localStorage getter throws', () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage')

    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('localStorage disabled')
      },
    })

    try {
      const { result } = renderHook(() => useAgendaItems({ now: now(TODAY) }))

      expect(result.current.items).toEqual([])
      expect(result.current.isPersistenceAvailable).toBe(false)
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(window, 'localStorage', originalDescriptor)
      }
    }
  })

  it('does not duplicate migration or writes when mounted under StrictMode', () => {
    const storage = new FakeStorage()
    storage.seedEssentialTasks('2026-08-24', [{ id: 'essential-task-1', title: 'Legacy', status: 'pending' }])

    const { result } = renderHook(() => useAgendaItems({ storage, now: now(TODAY) }), {
      wrapper: StrictMode,
    })

    expect(result.current.items).toEqual([
      { id: 'essential-task-1', title: 'Legacy', status: 'pending', localDate: '2026-08-24', startTime: null, durationMinutes: null },
    ])
    expect(storage.setItemCalls).toBe(1)
  })
})

describe('useAgendaItems dates', () => {
  it('derives the initial selected date from now', () => {
    const storage = new FakeStorage()
    const { result } = renderHook(() => useAgendaItems({ storage, now: now(TODAY) }))

    expect(result.current.selectedDate).toBe('2026-08-24')
  })

  it('changes the exposed items after a valid date switch', () => {
    const storage = new FakeStorage()
    storage.seedAgenda([
      { id: 'a1', title: 'Yesterday task', status: 'pending', localDate: '2026-08-23', startTime: null, durationMinutes: null },
      { id: 'a2', title: 'Today task', status: 'pending', localDate: '2026-08-24', startTime: null, durationMinutes: null },
    ])

    const { result } = renderHook(() => useAgendaItems({ storage, now: now(TODAY) }))

    act(() => {
      result.current.selectDate('2026-08-23')
    })

    expect(result.current.selectedDate).toBe('2026-08-23')
    expect(result.current.selectedDateItems).toEqual([
      { id: 'a1', title: 'Yesterday task', status: 'pending', localDate: '2026-08-23', startTime: null, durationMinutes: null },
    ])
  })

  it('rejects an invalid date switch without changing state', () => {
    const storage = new FakeStorage()
    const { result } = renderHook(() => useAgendaItems({ storage, now: now(TODAY) }))

    act(() => {
      result.current.selectDate('not-a-date')
    })

    expect(result.current.selectedDate).toBe('2026-08-24')
  })

  it('does not persist or delete data when switching the selected date', () => {
    const storage = new FakeStorage()
    storage.seedAgenda([
      { id: 'a1', title: 'Yesterday task', status: 'pending', localDate: '2026-08-23', startTime: null, durationMinutes: null },
    ])

    const { result } = renderHook(() => useAgendaItems({ storage, now: now(TODAY) }))
    storage.setItemCalls = 0

    act(() => {
      result.current.selectDate('2026-08-23')
    })

    expect(storage.setItemCalls).toBe(0)
    expect(result.current.items).toHaveLength(1)
  })

  it('orders items for the selected date following the domain rule', () => {
    const storage = new FakeStorage()
    storage.seedAgenda([
      { id: 'a1', title: 'No time', status: 'pending', localDate: '2026-08-24', startTime: null, durationMinutes: null },
      { id: 'a2', title: 'Later', status: 'pending', localDate: '2026-08-24', startTime: '15:00', durationMinutes: null },
      { id: 'a3', title: 'Earlier', status: 'pending', localDate: '2026-08-24', startTime: '09:00', durationMinutes: null },
    ])

    const { result } = renderHook(() => useAgendaItems({ storage, now: now(TODAY) }))

    expect(result.current.selectedDateItems.map((item) => item.id)).toEqual(['a3', 'a2', 'a1'])
  })
})

describe('useAgendaItems mutations', () => {
  it('creates an item without startTime or duration', () => {
    const storage = new FakeStorage()
    const { result } = renderHook(() => useAgendaItems({ storage, now: now(TODAY) }))

    act(() => {
      result.current.addItem({ title: 'Write report' })
    })

    expect(result.current.selectedDateItems).toEqual([
      { id: 'agenda-item-1', title: 'Write report', status: 'pending', localDate: '2026-08-24', startTime: null, durationMinutes: null },
    ])
  })

  it('creates an item with startTime and duration', () => {
    const storage = new FakeStorage()
    const { result } = renderHook(() => useAgendaItems({ storage, now: now(TODAY) }))

    act(() => {
      result.current.addItem({ title: 'Standup', startTime: '09:00', durationMinutes: 15 })
    })

    expect(result.current.selectedDateItems).toEqual([
      { id: 'agenda-item-1', title: 'Standup', status: 'pending', localDate: '2026-08-24', startTime: '09:00', durationMinutes: 15 },
    ])
  })

  it('rejects invalid data without writing', () => {
    const storage = new FakeStorage()
    const { result } = renderHook(() => useAgendaItems({ storage, now: now(TODAY) }))

    let status: string = ''
    act(() => {
      status = result.current.addItem({ title: '   ' })
    })

    expect(status).toBe('empty-title')
    expect(storage.setItemCalls).toBe(0)
    expect(result.current.items).toEqual([])
  })

  it('generates unique ids even with pre-existing persisted ids', () => {
    const storage = new FakeStorage()
    storage.seedAgenda([
      { id: 'agenda-item-1', title: 'First', status: 'pending', localDate: '2026-08-24', startTime: null, durationMinutes: null },
    ])

    const { result } = renderHook(() => useAgendaItems({ storage, now: now(TODAY) }))

    act(() => {
      result.current.addItem({ title: 'Second' })
    })

    const ids = result.current.items.map((item) => item.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toContain('agenda-item-2')
  })

  it('completing, reopening, and removing preserve items from other days', () => {
    const storage = new FakeStorage()
    storage.seedAgenda([
      { id: 'a1', title: 'Yesterday task', status: 'pending', localDate: '2026-08-23', startTime: null, durationMinutes: null },
      { id: 'a2', title: 'Today task', status: 'pending', localDate: '2026-08-24', startTime: null, durationMinutes: null },
    ])

    const { result } = renderHook(() => useAgendaItems({ storage, now: now(TODAY) }))

    act(() => {
      result.current.completeItem('a2')
    })
    expect(result.current.items.find((item) => item.id === 'a1')).toEqual({
      id: 'a1', title: 'Yesterday task', status: 'pending', localDate: '2026-08-23', startTime: null, durationMinutes: null,
    })

    act(() => {
      result.current.reopenItem('a2')
    })
    act(() => {
      result.current.removeItem('a2')
    })

    expect(result.current.items).toEqual([
      { id: 'a1', title: 'Yesterday task', status: 'pending', localDate: '2026-08-23', startTime: null, durationMinutes: null },
    ])
  })

  it('does not write when the operation targets a nonexistent id', () => {
    const storage = new FakeStorage()
    const { result } = renderHook(() => useAgendaItems({ storage, now: now(TODAY) }))

    act(() => {
      result.current.completeItem('missing-id')
    })
    act(() => {
      result.current.reopenItem('missing-id')
    })
    act(() => {
      result.current.removeItem('missing-id')
    })

    expect(storage.setItemCalls).toBe(0)
  })

  it('performs exactly one write attempt per valid mutation', () => {
    const storage = new FakeStorage()
    const { result } = renderHook(() => useAgendaItems({ storage, now: now(TODAY) }))

    act(() => {
      result.current.addItem({ title: 'Write report' })
    })
    expect(storage.setItemCalls).toBe(1)

    act(() => {
      result.current.completeItem('agenda-item-1')
    })
    expect(storage.setItemCalls).toBe(2)

    act(() => {
      result.current.reopenItem('agenda-item-1')
    })
    expect(storage.setItemCalls).toBe(3)

    act(() => {
      result.current.removeItem('agenda-item-1')
    })
    expect(storage.setItemCalls).toBe(4)
  })

  it('keeps the in-memory change when a write fails', () => {
    const { result } = renderHook(() => useAgendaItems({ storage: new ThrowingSetStorage(), now: now(TODAY) }))

    act(() => {
      result.current.addItem({ title: 'Write report' })
    })

    expect(result.current.selectedDateItems).toEqual([
      { id: 'agenda-item-1', title: 'Write report', status: 'pending', localDate: '2026-08-24', startTime: null, durationMinutes: null },
    ])
    expect(result.current.isPersistenceAvailable).toBe(false)
  })

  it('does not mutate properties or arrays passed into addItem', () => {
    const storage = new FakeStorage()
    const { result } = renderHook(() => useAgendaItems({ storage, now: now(TODAY) }))

    const input = { title: 'Write report', startTime: '09:00', durationMinutes: 30 }
    const inputSnapshot = { ...input }

    act(() => {
      result.current.addItem(input)
    })

    expect(input).toEqual(inputSnapshot)
  })
})

describe('useAgendaItems regressions', () => {
  it('recovers persisted items on remount', () => {
    const storage = new FakeStorage()
    const first = renderHook(() => useAgendaItems({ storage, now: now(TODAY) }))

    act(() => {
      first.result.current.addItem({ title: 'Write report' })
    })
    first.unmount()

    const second = renderHook(() => useAgendaItems({ storage, now: now(TODAY) }))

    expect(second.result.current.items).toEqual([
      { id: 'agenda-item-1', title: 'Write report', status: 'pending', localDate: '2026-08-24', startTime: null, durationMinutes: null },
    ])
  })

  it('keeps items from yesterday stored when adding an item today', () => {
    const storage = new FakeStorage()
    storage.seedAgenda([
      { id: 'a1', title: 'Yesterday task', status: 'pending', localDate: '2026-08-23', startTime: null, durationMinutes: null },
    ])

    const { result } = renderHook(() => useAgendaItems({ storage, now: now(TODAY) }))

    act(() => {
      result.current.addItem({ title: 'Today task' })
    })

    expect(result.current.items).toEqual([
      { id: 'a1', title: 'Yesterday task', status: 'pending', localDate: '2026-08-23', startTime: null, durationMinutes: null },
      { id: 'agenda-item-1', title: 'Today task', status: 'pending', localDate: '2026-08-24', startTime: null, durationMinutes: null },
    ])
  })

  it('does not lose other dates when switching the selected date and editing an item', () => {
    const storage = new FakeStorage()
    storage.seedAgenda([
      { id: 'a1', title: 'Yesterday task', status: 'pending', localDate: '2026-08-23', startTime: null, durationMinutes: null },
      { id: 'a2', title: 'Today task', status: 'pending', localDate: '2026-08-24', startTime: null, durationMinutes: null },
    ])

    const { result } = renderHook(() => useAgendaItems({ storage, now: now(TODAY) }))

    act(() => {
      result.current.selectDate('2026-08-23')
    })
    act(() => {
      result.current.completeItem('a1')
    })

    expect(result.current.items).toEqual([
      { id: 'a1', title: 'Yesterday task', status: 'completed', localDate: '2026-08-23', startTime: null, durationMinutes: null },
      { id: 'a2', title: 'Today task', status: 'pending', localDate: '2026-08-24', startTime: null, durationMinutes: null },
    ])
  })

  it('never touches the legacy essential-tasks record', () => {
    const storage = new FakeStorage()
    storage.seedEssentialTasks('2026-08-24', [{ id: 'essential-task-1', title: 'Legacy', status: 'pending' }])

    const { result } = renderHook(() => useAgendaItems({ storage, now: now(TODAY) }))

    act(() => {
      result.current.addItem({ title: 'New item' })
    })
    act(() => {
      result.current.completeItem('essential-task-1')
    })

    expect(JSON.parse(storage.getItem(ESSENTIAL_TASKS_STORAGE_KEY)!)).toEqual({
      version: 1,
      localDate: '2026-08-24',
      tasks: [{ id: 'essential-task-1', title: 'Legacy', status: 'pending' }],
    })
  })

  it('starts from yesterday when injected now points to another day', () => {
    const storage = new FakeStorage()
    const { result } = renderHook(() => useAgendaItems({ storage, now: now(YESTERDAY) }))

    expect(result.current.selectedDate).toBe('2026-08-23')
  })
})
