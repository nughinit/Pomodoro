import { describe, expect, it } from 'vitest'
import type { AgendaItem } from './types'
import {
  addAgendaItem,
  completeAgendaItem,
  deriveAgendaItemEndTime,
  getAgendaItemsForDate,
  isValidDurationMinutes,
  isValidLocalDateString,
  isValidLocalTimeString,
  removeAgendaItem,
  reopenAgendaItem,
  sortAgendaItemsByTime,
} from './agendaItems'

describe('addAgendaItem', () => {
  it('adds an item without startTime or durationMinutes', () => {
    const result = addAgendaItem([], 'id-1', 'Write report', '2026-08-25', null, null)

    expect(result).toEqual({
      status: 'added',
      items: [
        {
          id: 'id-1',
          title: 'Write report',
          status: 'pending',
          localDate: '2026-08-25',
          startTime: null,
          durationMinutes: null,
        },
      ],
    })
  })

  it('adds an item with only a startTime', () => {
    const result = addAgendaItem([], 'id-1', 'Standup', '2026-08-25', '09:00', null)

    expect(result.status).toBe('added')
    if (result.status === 'added') {
      expect(result.items[0].startTime).toBe('09:00')
      expect(result.items[0].durationMinutes).toBeNull()
    }
  })

  it('adds an item with only a durationMinutes', () => {
    const result = addAgendaItem([], 'id-1', 'Deep work', '2026-08-25', null, 90)

    expect(result.status).toBe('added')
    if (result.status === 'added') {
      expect(result.items[0].startTime).toBeNull()
      expect(result.items[0].durationMinutes).toBe(90)
    }
  })

  it('adds an item with both startTime and durationMinutes', () => {
    const result = addAgendaItem([], 'id-1', 'Meeting', '2026-08-25', '10:00', 30)

    expect(result.status).toBe('added')
    if (result.status === 'added') {
      expect(result.items[0].startTime).toBe('10:00')
      expect(result.items[0].durationMinutes).toBe(30)
    }
  })

  it('trims the title', () => {
    const result = addAgendaItem([], 'id-1', '  Write report  ', '2026-08-25', null, null)

    expect(result.status).toBe('added')
    if (result.status === 'added') expect(result.items[0].title).toBe('Write report')
  })

  it('preserves the id exactly as received', () => {
    const result = addAgendaItem([], '  id-1  ', 'Task', '2026-08-25', null, null)

    expect(result.status).toBe('added')
    if (result.status === 'added') expect(result.items[0].id).toBe('  id-1  ')
  })

  it('does not mutate the original collection', () => {
    const original: AgendaItem[] = [
      {
        id: 'id-1',
        title: 'Existing',
        status: 'pending',
        localDate: '2026-08-25',
        startTime: null,
        durationMinutes: null,
      },
    ]

    const result = addAgendaItem(original, 'id-2', 'New', '2026-08-25', null, null)

    expect(original).toHaveLength(1)
    expect(result.status).toBe('added')
    if (result.status === 'added') expect(result.items).not.toBe(original)
  })

  it('rejects an empty title', () => {
    const result = addAgendaItem([], 'id-1', '   ', '2026-08-25', null, null)
    expect(result).toEqual({ status: 'empty-title' })
  })

  it('rejects an empty id', () => {
    const result = addAgendaItem([], '   ', 'Task', '2026-08-25', null, null)
    expect(result).toEqual({ status: 'invalid-id' })
  })

  it('rejects a duplicate id', () => {
    const first = addAgendaItem([], 'id-1', 'First', '2026-08-25', null, null)
    expect(first.status).toBe('added')
    if (first.status !== 'added') return

    const second = addAgendaItem(first.items, 'id-1', 'Second', '2026-08-25', null, null)
    expect(second).toEqual({ status: 'duplicate-id' })
  })

  it('rejects an invalid date', () => {
    const result = addAgendaItem([], 'id-1', 'Task', '2026-02-30', null, null)
    expect(result).toEqual({ status: 'invalid-date' })
  })

  it('rejects an invalid time', () => {
    const result = addAgendaItem([], 'id-1', 'Task', '2026-08-25', '24:00', null)
    expect(result).toEqual({ status: 'invalid-time' })
  })

  it('rejects an invalid duration', () => {
    const result = addAgendaItem([], 'id-1', 'Task', '2026-08-25', null, 0)
    expect(result).toEqual({ status: 'invalid-duration' })
  })

  it('new items start as pending', () => {
    const result = addAgendaItem([], 'id-1', 'Task', '2026-08-25', null, null)
    expect(result.status).toBe('added')
    if (result.status === 'added') expect(result.items[0].status).toBe('pending')
  })
})

describe('isValidLocalDateString', () => {
  it('accepts a common date', () => {
    expect(isValidLocalDateString('2026-08-25')).toBe(true)
  })

  it('accepts a valid leap day', () => {
    expect(isValidLocalDateString('2024-02-29')).toBe(true)
  })

  it('rejects an invalid leap day on a non-leap year', () => {
    expect(isValidLocalDateString('2023-02-29')).toBe(false)
  })

  it('rejects day 30 for a 29-day month', () => {
    expect(isValidLocalDateString('2026-02-30')).toBe(false)
  })

  it('rejects month 00', () => {
    expect(isValidLocalDateString('2026-00-10')).toBe(false)
  })

  it('rejects month 13', () => {
    expect(isValidLocalDateString('2026-13-10')).toBe(false)
  })

  it('rejects day 00', () => {
    expect(isValidLocalDateString('2026-08-00')).toBe(false)
  })

  it('rejects an incorrect format', () => {
    expect(isValidLocalDateString('08/25/2026')).toBe(false)
  })

  it('rejects a string with a time component', () => {
    expect(isValidLocalDateString('2026-08-25T00:00:00')).toBe(false)
  })

  it('rejects a string with surrounding spaces', () => {
    expect(isValidLocalDateString(' 2026-08-25 ')).toBe(false)
  })

  it('rejects partial coercion input', () => {
    expect(isValidLocalDateString('2026-8-25')).toBe(false)
  })
})

describe('isValidLocalTimeString', () => {
  it('accepts 00:00', () => {
    expect(isValidLocalTimeString('00:00')).toBe(true)
  })

  it('accepts 09:05', () => {
    expect(isValidLocalTimeString('09:05')).toBe(true)
  })

  it('accepts 23:59', () => {
    expect(isValidLocalTimeString('23:59')).toBe(true)
  })

  it('rejects an unpadded hour', () => {
    expect(isValidLocalTimeString('9:05')).toBe(false)
  })

  it('rejects an unpadded minute', () => {
    expect(isValidLocalTimeString('09:5')).toBe(false)
  })

  it('rejects hour 24', () => {
    expect(isValidLocalTimeString('24:00')).toBe(false)
  })

  it('rejects minute 60', () => {
    expect(isValidLocalTimeString('12:60')).toBe(false)
  })

  it('rejects a value with seconds', () => {
    expect(isValidLocalTimeString('12:30:00')).toBe(false)
  })

  it('rejects a value with spaces', () => {
    expect(isValidLocalTimeString(' 12:30')).toBe(false)
  })

  it('rejects an empty string', () => {
    expect(isValidLocalTimeString('')).toBe(false)
  })
})

describe('isValidDurationMinutes', () => {
  it('accepts 1', () => {
    expect(isValidDurationMinutes(1)).toBe(true)
  })

  it('accepts 1440', () => {
    expect(isValidDurationMinutes(1440)).toBe(true)
  })

  it('rejects 0', () => {
    expect(isValidDurationMinutes(0)).toBe(false)
  })

  it('rejects a negative value', () => {
    expect(isValidDurationMinutes(-10)).toBe(false)
  })

  it('rejects 1441', () => {
    expect(isValidDurationMinutes(1441)).toBe(false)
  })

  it('rejects a decimal value', () => {
    expect(isValidDurationMinutes(30.5)).toBe(false)
  })

  it('rejects NaN', () => {
    expect(isValidDurationMinutes(Number.NaN)).toBe(false)
  })

  it('rejects Infinity', () => {
    expect(isValidDurationMinutes(Number.POSITIVE_INFINITY)).toBe(false)
  })
})

function makeItem(overrides: Partial<AgendaItem>): AgendaItem {
  return {
    id: 'id',
    title: 'Task',
    status: 'pending',
    localDate: '2026-08-25',
    startTime: null,
    durationMinutes: null,
    ...overrides,
  }
}

describe('getAgendaItemsForDate', () => {
  it('returns items matching the queried date', () => {
    const items = [
      makeItem({ id: 'a', localDate: '2026-08-25' }),
      makeItem({ id: 'b', localDate: '2026-08-26' }),
      makeItem({ id: 'c', localDate: '2026-08-25' }),
    ]

    const result = getAgendaItemsForDate(items, '2026-08-25')

    expect(result.status).toBe('ok')
    if (result.status === 'ok') expect(result.items.map((item) => item.id)).toEqual(['a', 'c'])
  })

  it('returns an empty list for a valid date with no items', () => {
    const result = getAgendaItemsForDate([], '2026-08-25')
    expect(result).toEqual({ status: 'ok', items: [] })
  })

  it('returns invalid-date for a malformed query', () => {
    const result = getAgendaItemsForDate([], '2026-02-30')
    expect(result).toEqual({ status: 'invalid-date' })
  })

  it('does not mutate the original collection', () => {
    const items = [makeItem({ id: 'a' })]
    getAgendaItemsForDate(items, '2026-08-25')
    expect(items).toHaveLength(1)
  })
})

describe('sortAgendaItemsByTime', () => {
  it('places scheduled items before unscheduled items', () => {
    const items = [
      makeItem({ id: 'no-time', startTime: null }),
      makeItem({ id: 'scheduled', startTime: '09:00' }),
    ]

    const result = sortAgendaItemsByTime(items)

    expect(result.map((item) => item.id)).toEqual(['scheduled', 'no-time'])
  })

  it('orders scheduled items ascending by startTime', () => {
    const items = [
      makeItem({ id: 'late', startTime: '15:00' }),
      makeItem({ id: 'early', startTime: '08:00' }),
      makeItem({ id: 'mid', startTime: '12:00' }),
    ]

    const result = sortAgendaItemsByTime(items)

    expect(result.map((item) => item.id)).toEqual(['early', 'mid', 'late'])
  })

  it('preserves original order for ties on the same startTime', () => {
    const items = [
      makeItem({ id: 'first', startTime: '09:00' }),
      makeItem({ id: 'second', startTime: '09:00' }),
    ]

    const result = sortAgendaItemsByTime(items)

    expect(result.map((item) => item.id)).toEqual(['first', 'second'])
  })

  it('preserves original order among unscheduled items', () => {
    const items = [
      makeItem({ id: 'first', startTime: null }),
      makeItem({ id: 'second', startTime: null }),
    ]

    const result = sortAgendaItemsByTime(items)

    expect(result.map((item) => item.id)).toEqual(['first', 'second'])
  })

  it('does not mutate the original array', () => {
    const items = [
      makeItem({ id: 'b', startTime: '10:00' }),
      makeItem({ id: 'a', startTime: '09:00' }),
    ]
    const original = [...items]

    sortAgendaItemsByTime(items)

    expect(items).toEqual(original)
  })
})

describe('completeAgendaItem', () => {
  it('marks a pending item as completed', () => {
    const items = [makeItem({ id: 'id-1', status: 'pending' })]
    const result = completeAgendaItem(items, 'id-1')
    expect(result[0].status).toBe('completed')
  })

  it('returns the same array when already completed', () => {
    const items = [makeItem({ id: 'id-1', status: 'completed' })]
    const result = completeAgendaItem(items, 'id-1')
    expect(result).toBe(items)
  })

  it('returns the same array when the id does not exist', () => {
    const items = [makeItem({ id: 'id-1' })]
    const result = completeAgendaItem(items, 'unknown')
    expect(result).toBe(items)
  })
})

describe('reopenAgendaItem', () => {
  it('marks a completed item as pending', () => {
    const items = [makeItem({ id: 'id-1', status: 'completed' })]
    const result = reopenAgendaItem(items, 'id-1')
    expect(result[0].status).toBe('pending')
  })

  it('returns the same array when already pending', () => {
    const items = [makeItem({ id: 'id-1', status: 'pending' })]
    const result = reopenAgendaItem(items, 'id-1')
    expect(result).toBe(items)
  })

  it('returns the same array when the id does not exist', () => {
    const items = [makeItem({ id: 'id-1' })]
    const result = reopenAgendaItem(items, 'unknown')
    expect(result).toBe(items)
  })
})

describe('removeAgendaItem', () => {
  it('removes the item with the matching id', () => {
    const items = [makeItem({ id: 'id-1' }), makeItem({ id: 'id-2' })]
    const result = removeAgendaItem(items, 'id-1')
    expect(result.map((item) => item.id)).toEqual(['id-2'])
  })

  it('returns the same array when the id does not exist', () => {
    const items = [makeItem({ id: 'id-1' })]
    const result = removeAgendaItem(items, 'unknown')
    expect(result).toBe(items)
  })
})

describe('deriveAgendaItemEndTime', () => {
  it('derives an end time on the same day', () => {
    expect(deriveAgendaItemEndTime('09:00', 50)).toEqual({
      status: 'ok',
      endTime: '09:50',
      dayOffset: 0,
    })
  })

  it('derives an end time landing exactly at midnight', () => {
    expect(deriveAgendaItemEndTime('23:00', 60)).toEqual({
      status: 'ok',
      endTime: '00:00',
      dayOffset: 1,
    })
  })

  it('derives an end time crossing midnight', () => {
    expect(deriveAgendaItemEndTime('23:30', 60)).toEqual({
      status: 'ok',
      endTime: '00:30',
      dayOffset: 1,
    })
  })

  it('derives an end time for a full 1440-minute duration', () => {
    expect(deriveAgendaItemEndTime('00:00', 1440)).toEqual({
      status: 'ok',
      endTime: '00:00',
      dayOffset: 1,
    })
  })

  it('is unavailable without a startTime', () => {
    expect(deriveAgendaItemEndTime(null, 60)).toEqual({ status: 'unavailable' })
  })

  it('is unavailable without a durationMinutes', () => {
    expect(deriveAgendaItemEndTime('09:00', null)).toEqual({ status: 'unavailable' })
  })
})
