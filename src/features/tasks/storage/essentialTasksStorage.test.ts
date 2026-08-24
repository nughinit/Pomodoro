import { describe, expect, it } from 'vitest'
import {
  ESSENTIAL_TASKS_STORAGE_KEY,
  readEssentialTasks,
  toLocalDateString,
  writeEssentialTasks,
} from './essentialTasksStorage'
import type { EssentialTask } from '../domain/types'
import type { StorageLike } from './essentialTasksStorage'

class FakeStorage implements StorageLike {
  private store = new Map<string, string>()

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value)
  }

  seed(key: string, value: string): void {
    this.store.set(key, value)
  }
}

class ThrowingStorage implements StorageLike {
  getItem(): string | null {
    throw new Error('getItem failed')
  }

  setItem(): void {
    throw new Error('setItem failed')
  }
}

function record(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    version: 1,
    localDate: '2026-08-24',
    tasks: [{ id: 'a', title: 'Task A', status: 'pending' }],
    ...overrides,
  })
}

describe('toLocalDateString', () => {
  it('pads month and day with leading zeros', () => {
    expect(toLocalDateString(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('derives the day from local getters, not toISOString/UTC', () => {
    // Simulates a moment where the local date (Jan 1) and the UTC date
    // (Dec 31) disagree, independent of the machine's actual timezone.
    const nearUtcBoundary = {
      getFullYear: () => 2026,
      getMonth: () => 0,
      getDate: () => 1,
      getUTCFullYear: () => 2025,
      getUTCMonth: () => 11,
      getUTCDate: () => 31,
      toISOString: () => '2025-12-31T23:30:00.000Z',
    } as unknown as Date

    expect(toLocalDateString(nearUtcBoundary)).toBe('2026-01-01')
  })
})

describe('readEssentialTasks', () => {
  it('returns empty when key is absent', () => {
    const storage = new FakeStorage()
    expect(readEssentialTasks(storage, '2026-08-24')).toEqual({ status: 'empty' })
  })

  it('returns today tasks for a valid v1 record matching the requested date', () => {
    const storage = new FakeStorage()
    storage.seed(ESSENTIAL_TASKS_STORAGE_KEY, record())

    expect(readEssentialTasks(storage, '2026-08-24')).toEqual({
      status: 'today',
      tasks: [{ id: 'a', title: 'Task A', status: 'pending' }],
    })
  })

  it('returns other-day for a valid record belonging to a different date', () => {
    const storage = new FakeStorage()
    storage.seed(ESSENTIAL_TASKS_STORAGE_KEY, record({ localDate: '2026-08-23' }))

    expect(readEssentialTasks(storage, '2026-08-24')).toEqual({
      status: 'other-day',
      localDate: '2026-08-23',
      tasks: [{ id: 'a', title: 'Task A', status: 'pending' }],
    })
  })

  it('returns empty for invalid JSON', () => {
    const storage = new FakeStorage()
    storage.seed(ESSENTIAL_TASKS_STORAGE_KEY, '{not valid json')

    expect(readEssentialTasks(storage, '2026-08-24')).toEqual({ status: 'empty' })
  })

  it.each([
    ['null', 'null'],
    ['array', '[]'],
    ['primitive', '"hello"'],
  ])('returns empty when envelope is %s', (_name, json) => {
    const storage = new FakeStorage()
    storage.seed(ESSENTIAL_TASKS_STORAGE_KEY, json)

    expect(readEssentialTasks(storage, '2026-08-24')).toEqual({ status: 'empty' })
  })

  it('returns empty when version is missing', () => {
    const storage = new FakeStorage()
    storage.seed(ESSENTIAL_TASKS_STORAGE_KEY, record({ version: undefined }))

    expect(readEssentialTasks(storage, '2026-08-24')).toEqual({ status: 'empty' })
  })

  it('returns empty when version is unknown', () => {
    const storage = new FakeStorage()
    storage.seed(ESSENTIAL_TASKS_STORAGE_KEY, record({ version: 2 }))

    expect(readEssentialTasks(storage, '2026-08-24')).toEqual({ status: 'empty' })
  })

  it('returns empty when localDate is missing', () => {
    const storage = new FakeStorage()
    storage.seed(ESSENTIAL_TASKS_STORAGE_KEY, record({ localDate: undefined }))

    expect(readEssentialTasks(storage, '2026-08-24')).toEqual({ status: 'empty' })
  })

  it('returns empty when localDate is malformed', () => {
    const storage = new FakeStorage()
    storage.seed(ESSENTIAL_TASKS_STORAGE_KEY, record({ localDate: '2026/08/24' }))

    expect(readEssentialTasks(storage, '2026-08-24')).toEqual({ status: 'empty' })
  })

  it('returns empty when localDate is an impossible date', () => {
    const storage = new FakeStorage()
    storage.seed(ESSENTIAL_TASKS_STORAGE_KEY, record({ localDate: '2026-02-30' }))

    expect(readEssentialTasks(storage, '2026-08-24')).toEqual({ status: 'empty' })
  })

  it('returns empty when tasks is missing', () => {
    const storage = new FakeStorage()
    storage.seed(ESSENTIAL_TASKS_STORAGE_KEY, record({ tasks: undefined }))

    expect(readEssentialTasks(storage, '2026-08-24')).toEqual({ status: 'empty' })
  })

  it('returns empty when tasks is not an array', () => {
    const storage = new FakeStorage()
    storage.seed(ESSENTIAL_TASKS_STORAGE_KEY, record({ tasks: 'not-an-array' }))

    expect(readEssentialTasks(storage, '2026-08-24')).toEqual({ status: 'empty' })
  })

  it('ignores a task without a valid id', () => {
    const storage = new FakeStorage()
    storage.seed(
      ESSENTIAL_TASKS_STORAGE_KEY,
      record({ tasks: [{ id: '', title: 'No id', status: 'pending' }] }),
    )

    expect(readEssentialTasks(storage, '2026-08-24')).toEqual({ status: 'today', tasks: [] })
  })

  it('ignores a task without a valid title', () => {
    const storage = new FakeStorage()
    storage.seed(
      ESSENTIAL_TASKS_STORAGE_KEY,
      record({ tasks: [{ id: 'a', title: '   ', status: 'pending' }] }),
    )

    expect(readEssentialTasks(storage, '2026-08-24')).toEqual({ status: 'today', tasks: [] })
  })

  it('ignores a task with an unknown status', () => {
    const storage = new FakeStorage()
    storage.seed(
      ESSENTIAL_TASKS_STORAGE_KEY,
      record({ tasks: [{ id: 'a', title: 'Task A', status: 'archived' }] }),
    )

    expect(readEssentialTasks(storage, '2026-08-24')).toEqual({ status: 'today', tasks: [] })
  })

  it('keeps valid entries while discarding invalid ones from the same envelope', () => {
    const storage = new FakeStorage()
    storage.seed(
      ESSENTIAL_TASKS_STORAGE_KEY,
      record({
        tasks: [
          { id: 'a', title: 'Valid A', status: 'pending' },
          { id: '', title: 'Invalid id', status: 'pending' },
          { id: 'b', title: '  ', status: 'pending' },
          { id: 'c', title: 'Valid C', status: 'completed' },
          { id: 'd', title: 'Bad status', status: 'archived' },
        ],
      }),
    )

    expect(readEssentialTasks(storage, '2026-08-24')).toEqual({
      status: 'today',
      tasks: [
        { id: 'a', title: 'Valid A', status: 'pending' },
        { id: 'c', title: 'Valid C', status: 'completed' },
      ],
    })
  })

  it('keeps only the first occurrence of a duplicate id', () => {
    const storage = new FakeStorage()
    storage.seed(
      ESSENTIAL_TASKS_STORAGE_KEY,
      record({
        tasks: [
          { id: 'a', title: 'First', status: 'pending' },
          { id: 'a', title: 'Second', status: 'completed' },
        ],
      }),
    )

    expect(readEssentialTasks(storage, '2026-08-24')).toEqual({
      status: 'today',
      tasks: [{ id: 'a', title: 'First', status: 'pending' }],
    })
  })

  it('caps valid tasks at MAX_ESSENTIAL_TASKS', () => {
    const storage = new FakeStorage()
    const tasks: EssentialTask[] = Array.from({ length: 6 }, (_, index) => ({
      id: `t${index}`,
      title: `Task ${index}`,
      status: 'pending',
    }))
    storage.seed(ESSENTIAL_TASKS_STORAGE_KEY, record({ tasks }))

    const result = readEssentialTasks(storage, '2026-08-24')
    expect(result.status).toBe('today')
    if (result.status === 'today') {
      expect(result.tasks).toHaveLength(4)
      expect(result.tasks.map((task) => task.id)).toEqual(['t0', 't1', 't2', 't3'])
    }
  })

  it('preserves title and status exactly as stored', () => {
    const storage = new FakeStorage()
    storage.seed(
      ESSENTIAL_TASKS_STORAGE_KEY,
      record({ tasks: [{ id: 'a', title: '  Padded Title  ', status: 'completed' }] }),
    )

    const result = readEssentialTasks(storage, '2026-08-24')
    expect(result).toEqual({
      status: 'today',
      tasks: [{ id: 'a', title: '  Padded Title  ', status: 'completed' }],
    })
  })

  it('returns empty when getItem throws', () => {
    expect(readEssentialTasks(new ThrowingStorage(), '2026-08-24')).toEqual({ status: 'empty' })
  })
})

describe('writeEssentialTasks', () => {
  it('writes version, localDate and tasks correctly', () => {
    const storage = new FakeStorage()
    const tasks: EssentialTask[] = [{ id: 'a', title: 'Task A', status: 'pending' }]

    const result = writeEssentialTasks(storage, '2026-08-24', tasks)

    expect(result).toEqual({ status: 'ok' })
    expect(JSON.parse(storage.getItem(ESSENTIAL_TASKS_STORAGE_KEY)!)).toEqual({
      version: 1,
      localDate: '2026-08-24',
      tasks,
    })
  })

  it('does not mutate the tasks passed in', () => {
    const storage = new FakeStorage()
    const tasks: EssentialTask[] = [{ id: 'a', title: 'Task A', status: 'pending' }]
    const snapshot = JSON.parse(JSON.stringify(tasks))

    writeEssentialTasks(storage, '2026-08-24', tasks)

    expect(tasks).toEqual(snapshot)
  })

  it('returns an error result when setItem throws', () => {
    const result = writeEssentialTasks(new ThrowingStorage(), '2026-08-24', [])
    expect(result).toEqual({ status: 'error' })
  })
})
