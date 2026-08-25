import { describe, expect, it } from 'vitest'
import {
  AGENDA_STORAGE_KEY,
  migrateEssentialTasksToAgenda,
  readAgendaItems,
  writeAgendaItems,
} from './agendaStorage'
import type { StorageLike } from './agendaStorage'
import { ESSENTIAL_TASKS_STORAGE_KEY } from '../../tasks/storage/essentialTasksStorage'
import type { AgendaItem } from '../domain/types'

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

class ThrowingGetStorage implements StorageLike {
  getItem(): string | null {
    throw new Error('getItem failed')
  }

  setItem(): void {
    throw new Error('setItem failed')
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

function agendaItem(overrides: Partial<AgendaItem> = {}): AgendaItem {
  return {
    id: 'a',
    title: 'Item A',
    status: 'pending',
    localDate: '2026-08-24',
    startTime: null,
    durationMinutes: null,
    ...overrides,
  }
}

function record(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    version: 1,
    items: [agendaItem()],
    ...overrides,
  })
}

function essentialTasksRecord(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    version: 1,
    localDate: '2026-08-24',
    tasks: [{ id: 'e1', title: 'Essential A', status: 'pending' }],
    ...overrides,
  })
}

describe('readAgendaItems', () => {
  it('returns missing when key is absent', () => {
    const storage = new FakeStorage()
    expect(readAgendaItems(storage)).toEqual({ status: 'missing' })
  })

  it('returns loaded with an empty list for an empty v1 record', () => {
    const storage = new FakeStorage()
    storage.seed(AGENDA_STORAGE_KEY, record({ items: [] }))

    expect(readAgendaItems(storage)).toEqual({ status: 'loaded', items: [] })
  })

  it('preserves items from multiple different dates in one record', () => {
    const storage = new FakeStorage()
    const items = [
      agendaItem({ id: 'a', localDate: '2026-08-24' }),
      agendaItem({ id: 'b', localDate: '2026-08-25' }),
      agendaItem({ id: 'c', localDate: '2026-09-01' }),
    ]
    storage.seed(AGENDA_STORAGE_KEY, record({ items }))

    expect(readAgendaItems(storage)).toEqual({ status: 'loaded', items })
  })

  it('returns invalid for malformed JSON', () => {
    const storage = new FakeStorage()
    storage.seed(AGENDA_STORAGE_KEY, '{not valid json')

    expect(readAgendaItems(storage)).toEqual({ status: 'invalid' })
  })

  it.each([
    ['null', 'null'],
    ['array', '[]'],
    ['primitive', '"hello"'],
  ])('returns invalid when envelope is %s', (_name, json) => {
    const storage = new FakeStorage()
    storage.seed(AGENDA_STORAGE_KEY, json)

    expect(readAgendaItems(storage)).toEqual({ status: 'invalid' })
  })

  it('returns invalid when version is missing', () => {
    const storage = new FakeStorage()
    storage.seed(AGENDA_STORAGE_KEY, record({ version: undefined }))

    expect(readAgendaItems(storage)).toEqual({ status: 'invalid' })
  })

  it('returns invalid when version is unknown', () => {
    const storage = new FakeStorage()
    storage.seed(AGENDA_STORAGE_KEY, record({ version: 2 }))

    expect(readAgendaItems(storage)).toEqual({ status: 'invalid' })
  })

  it('returns invalid when items is missing', () => {
    const storage = new FakeStorage()
    storage.seed(AGENDA_STORAGE_KEY, record({ items: undefined }))

    expect(readAgendaItems(storage)).toEqual({ status: 'invalid' })
  })

  it('returns invalid when items is not an array', () => {
    const storage = new FakeStorage()
    storage.seed(AGENDA_STORAGE_KEY, record({ items: 'not-an-array' }))

    expect(readAgendaItems(storage)).toEqual({ status: 'invalid' })
  })

  it('returns invalid when getItem throws', () => {
    expect(readAgendaItems(new ThrowingGetStorage())).toEqual({ status: 'invalid' })
  })

  it('keeps valid items while discarding invalid ones from the same record', () => {
    const storage = new FakeStorage()
    storage.seed(
      AGENDA_STORAGE_KEY,
      record({
        items: [
          agendaItem({ id: 'a', title: 'Valid A' }),
          { id: '', title: 'Invalid id', status: 'pending', localDate: '2026-08-24', startTime: null, durationMinutes: null },
          agendaItem({ id: 'c', title: 'Valid C', status: 'completed' }),
        ],
      }),
    )

    expect(readAgendaItems(storage)).toEqual({
      status: 'loaded',
      items: [agendaItem({ id: 'a', title: 'Valid A' }), agendaItem({ id: 'c', title: 'Valid C', status: 'completed' })],
    })
  })

  it('ignores an item with an invalid id', () => {
    const storage = new FakeStorage()
    storage.seed(AGENDA_STORAGE_KEY, record({ items: [agendaItem({ id: '   ' })] }))

    expect(readAgendaItems(storage)).toEqual({ status: 'loaded', items: [] })
  })

  it('ignores an item with an invalid title', () => {
    const storage = new FakeStorage()
    storage.seed(AGENDA_STORAGE_KEY, record({ items: [agendaItem({ title: '   ' })] }))

    expect(readAgendaItems(storage)).toEqual({ status: 'loaded', items: [] })
  })

  it('ignores an item with an invalid status', () => {
    const storage = new FakeStorage()
    storage.seed(
      AGENDA_STORAGE_KEY,
      record({ items: [{ ...agendaItem(), status: 'archived' }] }),
    )

    expect(readAgendaItems(storage)).toEqual({ status: 'loaded', items: [] })
  })

  it('ignores an item with an invalid date', () => {
    const storage = new FakeStorage()
    storage.seed(AGENDA_STORAGE_KEY, record({ items: [agendaItem({ localDate: '2026/08/24' })] }))

    expect(readAgendaItems(storage)).toEqual({ status: 'loaded', items: [] })
  })

  it('ignores an item with an invalid time', () => {
    const storage = new FakeStorage()
    storage.seed(AGENDA_STORAGE_KEY, record({ items: [agendaItem({ startTime: '25:99' })] }))

    expect(readAgendaItems(storage)).toEqual({ status: 'loaded', items: [] })
  })

  it('ignores an item with an invalid duration', () => {
    const storage = new FakeStorage()
    storage.seed(
      AGENDA_STORAGE_KEY,
      record({ items: [agendaItem({ durationMinutes: 0 })] }),
    )

    expect(readAgendaItems(storage)).toEqual({ status: 'loaded', items: [] })
  })

  it('keeps only the first occurrence of a duplicate id', () => {
    const storage = new FakeStorage()
    storage.seed(
      AGENDA_STORAGE_KEY,
      record({
        items: [
          agendaItem({ id: 'a', title: 'First' }),
          agendaItem({ id: 'a', title: 'Second' }),
        ],
      }),
    )

    expect(readAgendaItems(storage)).toEqual({
      status: 'loaded',
      items: [agendaItem({ id: 'a', title: 'First' })],
    })
  })

  it('ignores extra properties on an item', () => {
    const storage = new FakeStorage()
    storage.seed(
      AGENDA_STORAGE_KEY,
      record({ items: [{ ...agendaItem(), extra: 'nope' }] }),
    )

    expect(readAgendaItems(storage)).toEqual({ status: 'loaded', items: [agendaItem()] })
  })

  it('preserves id and title exactly as stored, without trimming', () => {
    const storage = new FakeStorage()
    storage.seed(
      AGENDA_STORAGE_KEY,
      record({ items: [agendaItem({ id: 'a', title: '  Padded Title  ' })] }),
    )

    expect(readAgendaItems(storage)).toEqual({
      status: 'loaded',
      items: [agendaItem({ id: 'a', title: '  Padded Title  ' })],
    })
  })

  it('preserves original item order', () => {
    const storage = new FakeStorage()
    const items = [
      agendaItem({ id: 'c', localDate: '2026-08-26' }),
      agendaItem({ id: 'a', localDate: '2026-08-24' }),
      agendaItem({ id: 'b', localDate: '2026-08-25' }),
    ]
    storage.seed(AGENDA_STORAGE_KEY, record({ items }))

    const result = readAgendaItems(storage)
    expect(result.status).toBe('loaded')
    if (result.status === 'loaded') {
      expect(result.items.map((item) => item.id)).toEqual(['c', 'a', 'b'])
    }
  })
})

describe('writeAgendaItems', () => {
  it('writes an empty list', () => {
    const storage = new FakeStorage()

    const result = writeAgendaItems(storage, [])

    expect(result).toEqual({ status: 'ok' })
    expect(JSON.parse(storage.getItem(AGENDA_STORAGE_KEY)!)).toEqual({ version: 1, items: [] })
  })

  it('writes items spanning multiple dates', () => {
    const storage = new FakeStorage()
    const items = [
      agendaItem({ id: 'a', localDate: '2026-08-24' }),
      agendaItem({ id: 'b', localDate: '2026-08-25' }),
    ]

    const result = writeAgendaItems(storage, items)

    expect(result).toEqual({ status: 'ok' })
    expect(JSON.parse(storage.getItem(AGENDA_STORAGE_KEY)!)).toEqual({ version: 1, items })
  })

  it('writes the exact expected record shape', () => {
    const storage = new FakeStorage()
    const items = [agendaItem()]

    writeAgendaItems(storage, items)

    expect(storage.getItem(AGENDA_STORAGE_KEY)).toBe(JSON.stringify({ version: 1, items }))
  })

  it('does not mutate the items array passed in', () => {
    const storage = new FakeStorage()
    const items = [agendaItem()]
    const originalArray = items

    writeAgendaItems(storage, items)

    expect(items).toBe(originalArray)
    expect(items).toEqual([agendaItem()])
  })

  it('does not mutate individual items passed in', () => {
    const storage = new FakeStorage()
    const item = agendaItem()
    const snapshot = { ...item }

    writeAgendaItems(storage, [item])

    expect(item).toEqual(snapshot)
  })

  it('rejects a duplicate id and does not call setItem', () => {
    const storage = new FakeStorage()
    const items = [agendaItem({ id: 'a' }), agendaItem({ id: 'a' })]

    const result = writeAgendaItems(storage, items)

    expect(result).toEqual({ status: 'invalid-items' })
    expect(storage.getItem(AGENDA_STORAGE_KEY)).toBeNull()
  })

  it.each([
    ['empty id', agendaItem({ id: '   ' })],
    ['empty title', agendaItem({ title: '   ' })],
    ['invalid status', { ...agendaItem(), status: 'archived' } as unknown as AgendaItem],
    ['invalid date', agendaItem({ localDate: '2026/08/24' })],
    ['invalid time', agendaItem({ startTime: '25:99' })],
    ['invalid duration', agendaItem({ durationMinutes: 0 })],
  ])('rejects an item with %s and does not call setItem', (_name, invalidItem) => {
    const storage = new FakeStorage()

    const result = writeAgendaItems(storage, [invalidItem])

    expect(result).toEqual({ status: 'invalid-items' })
    expect(storage.getItem(AGENDA_STORAGE_KEY)).toBeNull()
  })

  it('does not call setItem for any item when one item in the batch is invalid', () => {
    const storage = new FakeStorage()
    const items = [agendaItem({ id: 'a' }), agendaItem({ id: 'b', title: '   ' })]

    writeAgendaItems(storage, items)

    expect(storage.getItem(AGENDA_STORAGE_KEY)).toBeNull()
  })

  it('returns an error result when JSON.stringify throws', () => {
    const storage = new FakeStorage()
    // A valid-shaped item carrying an extra circular property: it passes
    // the field-by-field validator (which only reads known fields) but
    // fails serialization, since writeAgendaItems copies all own
    // properties via spread before calling JSON.stringify.
    const circularItem = agendaItem() as unknown as Record<string, unknown>
    circularItem.self = circularItem

    const result = writeAgendaItems(storage, [circularItem as unknown as AgendaItem])

    expect(result).toEqual({ status: 'error' })
    expect(storage.getItem(AGENDA_STORAGE_KEY)).toBeNull()
  })

  it('returns an error result when setItem throws', () => {
    const result = writeAgendaItems(new ThrowingSetStorage(), [agendaItem()])
    expect(result).toEqual({ status: 'error' })
  })
})

describe('migrateEssentialTasksToAgenda', () => {
  it("migrates today's essential tasks into the agenda", () => {
    const storage = new FakeStorage()
    storage.seed(ESSENTIAL_TASKS_STORAGE_KEY, essentialTasksRecord())

    const result = migrateEssentialTasksToAgenda(storage, '2026-08-24')

    expect(result).toEqual({
      status: 'migrated',
      items: [
        {
          id: 'e1',
          title: 'Essential A',
          status: 'pending',
          localDate: '2026-08-24',
          startTime: null,
          durationMinutes: null,
        },
      ],
    })
    expect(readAgendaItems(storage)).toEqual({ status: 'loaded', items: result.status === 'migrated' ? result.items : [] })
  })

  it('migrates essential tasks belonging to a different day using their own date', () => {
    const storage = new FakeStorage()
    storage.seed(ESSENTIAL_TASKS_STORAGE_KEY, essentialTasksRecord({ localDate: '2026-08-20' }))

    const result = migrateEssentialTasksToAgenda(storage, '2026-08-24')

    expect(result.status).toBe('migrated')
    if (result.status === 'migrated') {
      expect(result.items[0].localDate).toBe('2026-08-20')
    }
  })

  it('preserves pending and completed statuses during migration', () => {
    const storage = new FakeStorage()
    storage.seed(
      ESSENTIAL_TASKS_STORAGE_KEY,
      essentialTasksRecord({
        tasks: [
          { id: 'e1', title: 'Pending one', status: 'pending' },
          { id: 'e2', title: 'Completed one', status: 'completed' },
        ],
      }),
    )

    const result = migrateEssentialTasksToAgenda(storage, '2026-08-24')

    expect(result.status).toBe('migrated')
    if (result.status === 'migrated') {
      expect(result.items.map((item) => item.status)).toEqual(['pending', 'completed'])
    }
  })

  it('does not overwrite an agenda that already has items', () => {
    const storage = new FakeStorage()
    storage.seed(AGENDA_STORAGE_KEY, record({ items: [agendaItem({ id: 'existing' })] }))
    storage.seed(ESSENTIAL_TASKS_STORAGE_KEY, essentialTasksRecord())

    const result = migrateEssentialTasksToAgenda(storage, '2026-08-24')

    expect(result).toEqual({ status: 'already-initialized' })
    expect(readAgendaItems(storage)).toEqual({
      status: 'loaded',
      items: [agendaItem({ id: 'existing' })],
    })
  })

  it('does not overwrite an agenda that is loaded but empty', () => {
    const storage = new FakeStorage()
    storage.seed(AGENDA_STORAGE_KEY, record({ items: [] }))
    storage.seed(ESSENTIAL_TASKS_STORAGE_KEY, essentialTasksRecord())

    const result = migrateEssentialTasksToAgenda(storage, '2026-08-24')

    expect(result).toEqual({ status: 'already-initialized' })
    expect(readAgendaItems(storage)).toEqual({ status: 'loaded', items: [] })
  })

  it('does not write when the agenda record is invalid', () => {
    const storage = new FakeStorage()
    storage.seed(AGENDA_STORAGE_KEY, 'not valid json')
    storage.seed(ESSENTIAL_TASKS_STORAGE_KEY, essentialTasksRecord())

    const result = migrateEssentialTasksToAgenda(storage, '2026-08-24')

    expect(result).toEqual({ status: 'invalid-agenda-record' })
    expect(storage.getItem(AGENDA_STORAGE_KEY)).toBe('not valid json')
  })

  it('returns no-legacy-data when there is no legacy record', () => {
    const storage = new FakeStorage()

    const result = migrateEssentialTasksToAgenda(storage, '2026-08-24')

    expect(result).toEqual({ status: 'no-legacy-data' })
    expect(storage.getItem(AGENDA_STORAGE_KEY)).toBeNull()
  })

  it('returns no-legacy-data when the legacy record is invalid', () => {
    const storage = new FakeStorage()
    storage.seed(ESSENTIAL_TASKS_STORAGE_KEY, 'not valid json')

    const result = migrateEssentialTasksToAgenda(storage, '2026-08-24')

    expect(result).toEqual({ status: 'no-legacy-data' })
    expect(storage.getItem(AGENDA_STORAGE_KEY)).toBeNull()
  })

  it('returns invalid-current-date for a malformed date', () => {
    const storage = new FakeStorage()
    storage.seed(ESSENTIAL_TASKS_STORAGE_KEY, essentialTasksRecord())

    const result = migrateEssentialTasksToAgenda(storage, '2026/08/24')

    expect(result).toEqual({ status: 'invalid-current-date' })
    expect(storage.getItem(AGENDA_STORAGE_KEY)).toBeNull()
  })

  it('returns write-error when the agenda write fails', () => {
    class MigrationWriteFailsStorage implements StorageLike {
      private essentialTasks = essentialTasksRecord()

      getItem(key: string): string | null {
        if (key === ESSENTIAL_TASKS_STORAGE_KEY) return this.essentialTasks
        return null
      }

      setItem(key: string): void {
        if (key === AGENDA_STORAGE_KEY) throw new Error('setItem failed')
      }
    }

    const result = migrateEssentialTasksToAgenda(new MigrationWriteFailsStorage(), '2026-08-24')

    expect(result).toEqual({ status: 'write-error' })
  })

  it('is idempotent: a repeated call after success reports already-initialized', () => {
    const storage = new FakeStorage()
    storage.seed(ESSENTIAL_TASKS_STORAGE_KEY, essentialTasksRecord())

    const first = migrateEssentialTasksToAgenda(storage, '2026-08-24')
    const second = migrateEssentialTasksToAgenda(storage, '2026-08-24')

    expect(first.status).toBe('migrated')
    expect(second).toEqual({ status: 'already-initialized' })
  })

  it('leaves the legacy record byte-for-byte unchanged', () => {
    const storage = new FakeStorage()
    const legacyRaw = essentialTasksRecord()
    storage.seed(ESSENTIAL_TASKS_STORAGE_KEY, legacyRaw)

    migrateEssentialTasksToAgenda(storage, '2026-08-24')

    expect(storage.getItem(ESSENTIAL_TASKS_STORAGE_KEY)).toBe(legacyRaw)
  })

  it('does not call setItem when the agenda is already initialized', () => {
    let setItemCalls = 0
    class CountingStorage implements StorageLike {
      private store = new Map<string, string>()

      getItem(key: string): string | null {
        return this.store.has(key) ? this.store.get(key)! : null
      }

      setItem(key: string, value: string): void {
        setItemCalls += 1
        this.store.set(key, value)
      }

      seed(key: string, value: string): void {
        this.store.set(key, value)
      }
    }

    const storage = new CountingStorage()
    storage.seed(AGENDA_STORAGE_KEY, record({ items: [] }))
    storage.seed(ESSENTIAL_TASKS_STORAGE_KEY, essentialTasksRecord())

    migrateEssentialTasksToAgenda(storage, '2026-08-24')

    expect(setItemCalls).toBe(0)
  })

  it('does not call setItem when there is no legacy data', () => {
    let setItemCalls = 0
    class CountingStorage implements StorageLike {
      private store = new Map<string, string>()

      getItem(key: string): string | null {
        return this.store.has(key) ? this.store.get(key)! : null
      }

      setItem(key: string, value: string): void {
        setItemCalls += 1
        this.store.set(key, value)
      }
    }

    migrateEssentialTasksToAgenda(new CountingStorage(), '2026-08-24')

    expect(setItemCalls).toBe(0)
  })
})
