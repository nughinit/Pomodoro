import { MAX_AGENDA_ITEM_DURATION_MINUTES } from './types'
import type { AgendaItem, LocalDateString, LocalTimeString } from './types'

export type AddAgendaItemResult =
  | { status: 'added'; items: AgendaItem[] }
  | { status: 'empty-title' }
  | { status: 'invalid-id' }
  | { status: 'invalid-date' }
  | { status: 'invalid-time' }
  | { status: 'invalid-duration' }
  | { status: 'duplicate-id' }

export function addAgendaItem(
  items: AgendaItem[],
  id: string,
  title: string,
  localDate: LocalDateString,
  startTime: LocalTimeString | null,
  durationMinutes: number | null,
): AddAgendaItemResult {
  if (typeof id !== 'string' || id.trim() === '') return { status: 'invalid-id' }

  const normalizedTitle = title.trim()
  if (normalizedTitle === '') return { status: 'empty-title' }

  if (!isValidLocalDateString(localDate)) return { status: 'invalid-date' }
  if (startTime !== null && !isValidLocalTimeString(startTime)) return { status: 'invalid-time' }
  if (durationMinutes !== null && !isValidDurationMinutes(durationMinutes)) {
    return { status: 'invalid-duration' }
  }

  if (items.some((item) => item.id === id)) return { status: 'duplicate-id' }

  return {
    status: 'added',
    items: [
      ...items,
      {
        id,
        title: normalizedTitle,
        status: 'pending',
        localDate,
        startTime,
        durationMinutes,
      },
    ],
  }
}

export function completeAgendaItem(items: AgendaItem[], id: string): AgendaItem[] {
  return setAgendaItemStatus(items, id, 'completed')
}

export function reopenAgendaItem(items: AgendaItem[], id: string): AgendaItem[] {
  return setAgendaItemStatus(items, id, 'pending')
}

export function removeAgendaItem(items: AgendaItem[], id: string): AgendaItem[] {
  if (!items.some((item) => item.id === id)) return items

  return items.filter((item) => item.id !== id)
}

export type GetAgendaItemsForDateResult =
  | { status: 'ok'; items: AgendaItem[] }
  | { status: 'invalid-date' }

/**
 * Returns the items whose localDate exactly matches the queried date, in
 * their original order. An invalid query date is reported as its own
 * status so callers can tell it apart from a genuinely empty day.
 */
export function getAgendaItemsForDate(
  items: AgendaItem[],
  localDate: string,
): GetAgendaItemsForDateResult {
  if (!isValidLocalDateString(localDate)) return { status: 'invalid-date' }

  return { status: 'ok', items: items.filter((item) => item.localDate === localDate) }
}

/**
 * Orders items already belonging to a single day: scheduled items first
 * (ascending by startTime), then unscheduled items. Ties preserve the
 * original array order. Does not filter or validate by date itself.
 */
export function sortAgendaItemsByTime(items: AgendaItem[]): AgendaItem[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const aHasTime = a.item.startTime !== null
      const bHasTime = b.item.startTime !== null

      if (aHasTime && !bHasTime) return -1
      if (!aHasTime && bHasTime) return 1

      if (aHasTime && bHasTime && a.item.startTime !== b.item.startTime) {
        return a.item.startTime! < b.item.startTime! ? -1 : 1
      }

      return a.index - b.index
    })
    .map(({ item }) => item)
}

export type DeriveAgendaItemEndTimeResult =
  | { status: 'ok'; endTime: LocalTimeString; dayOffset: number }
  | { status: 'unavailable' }

/**
 * Derives the end time from startTime + durationMinutes using
 * minutes-since-midnight arithmetic (no Date object). Only available when
 * both a startTime and a durationMinutes are present.
 */
export function deriveAgendaItemEndTime(
  startTime: LocalTimeString | null,
  durationMinutes: number | null,
): DeriveAgendaItemEndTimeResult {
  if (startTime === null || durationMinutes === null) return { status: 'unavailable' }

  const startMinutes = toMinutesSinceMidnight(startTime)
  const totalMinutes = startMinutes + durationMinutes
  const endMinutes = totalMinutes % 1440
  const dayOffset = Math.floor(totalMinutes / 1440)

  return { status: 'ok', endTime: fromMinutesSinceMidnight(endMinutes), dayOffset }
}

/**
 * Validates YYYY-MM-DD without Date.parse (which accepts non-ISO and
 * partial formats). This duplicates the equivalent check in
 * src/features/tasks/storage/essentialTasksStorage.ts; consolidating the
 * two is left as a follow-up for the future storage/schema migration.
 */
export function isValidLocalDateString(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  const date = new Date(year, month - 1, day)

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

export function isValidLocalTimeString(value: string): boolean {
  const match = /^(\d{2}):(\d{2})$/.exec(value)
  if (!match) return false

  const hours = Number(match[1])
  const minutes = Number(match[2])

  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59
}

export function isValidDurationMinutes(value: number): boolean {
  return Number.isInteger(value) && value > 0 && value <= MAX_AGENDA_ITEM_DURATION_MINUTES
}

function setAgendaItemStatus(
  items: AgendaItem[],
  id: string,
  status: AgendaItem['status'],
): AgendaItem[] {
  const item = items.find((candidate) => candidate.id === id)
  if (!item || item.status === status) return items

  return items.map((candidate) => (candidate.id === id ? { ...candidate, status } : candidate))
}

function toMinutesSinceMidnight(time: LocalTimeString): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function fromMinutesSinceMidnight(minutes: number): LocalTimeString {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}`
}
