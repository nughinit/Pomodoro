import {
  isValidDurationMinutes,
  isValidLocalDateString,
  isValidLocalTimeString,
} from '../domain/agendaItems'
import type { AgendaItem, AgendaItemStatus } from '../domain/types'
import { readEssentialTasks } from '../../tasks/storage/essentialTasksStorage'
import type { StorageLike } from '../../tasks/storage/essentialTasksStorage'

export type { StorageLike }

export const AGENDA_STORAGE_KEY = 'via:agenda'

const AGENDA_SCHEMA_VERSION = 1

export interface AgendaRecord {
  version: 1
  items: AgendaItem[]
}

export type ReadAgendaItemsResult =
  | { status: 'loaded'; items: AgendaItem[] }
  | { status: 'missing' }
  | { status: 'invalid' }

export type WriteAgendaItemsResult =
  | { status: 'ok' }
  | { status: 'invalid-items' }
  | { status: 'error' }

export type MigrateEssentialTasksToAgendaResult =
  | { status: 'migrated'; items: AgendaItem[] }
  | { status: 'already-initialized' }
  | { status: 'no-legacy-data' }
  | { status: 'invalid-current-date' }
  | { status: 'invalid-agenda-record' }
  | { status: 'write-error' }

/**
 * Reads and validates the multiday agenda record. Never throws: a broken
 * storage backend, malformed JSON, or an invalid envelope all surface as
 * `invalid` rather than propagating an exception.
 */
export function readAgendaItems(storage: StorageLike): ReadAgendaItemsResult {
  let raw: string | null
  try {
    raw = storage.getItem(AGENDA_STORAGE_KEY)
  } catch {
    return { status: 'invalid' }
  }

  if (raw === null) return { status: 'missing' }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { status: 'invalid' }
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { status: 'invalid' }
  }

  const envelope = parsed as Record<string, unknown>

  if (envelope.version !== AGENDA_SCHEMA_VERSION) return { status: 'invalid' }
  if (!Array.isArray(envelope.items)) return { status: 'invalid' }

  return { status: 'loaded', items: parseAgendaItems(envelope.items) }
}

/**
 * Writes the multiday agenda record. Validation is strict: unlike
 * readAgendaItems, this never silently drops an invalid entry supplied by
 * the caller — any invalid item or duplicate id fails the whole write
 * before storage.setItem is ever called.
 */
export function writeAgendaItems(
  storage: StorageLike,
  items: AgendaItem[],
): WriteAgendaItemsResult {
  const seenIds = new Set<string>()

  for (const item of items) {
    if (!isValidAgendaItemCandidate(item)) return { status: 'invalid-items' }
    if (seenIds.has(item.id)) return { status: 'invalid-items' }
    seenIds.add(item.id)
  }

  const record: AgendaRecord = {
    version: AGENDA_SCHEMA_VERSION,
    items: items.map((item) => ({ ...item })),
  }

  let serialized: string
  try {
    serialized = JSON.stringify(record)
  } catch {
    return { status: 'error' }
  }

  try {
    storage.setItem(AGENDA_STORAGE_KEY, serialized)
  } catch {
    return { status: 'error' }
  }

  return { status: 'ok' }
}

/**
 * One-time, idempotent migration from the single-day legacy essential
 * tasks record into the multiday agenda record. Never runs automatically
 * and never touches `via:essential-tasks` — callers must invoke it
 * explicitly (e.g. once at app startup, outside this module).
 */
export function migrateEssentialTasksToAgenda(
  storage: StorageLike,
  currentLocalDate: string,
): MigrateEssentialTasksToAgendaResult {
  if (!isValidLocalDateString(currentLocalDate)) return { status: 'invalid-current-date' }

  const agendaResult = readAgendaItems(storage)
  if (agendaResult.status === 'loaded') return { status: 'already-initialized' }
  if (agendaResult.status === 'invalid') return { status: 'invalid-agenda-record' }

  const legacyResult = readEssentialTasks(storage, currentLocalDate)
  if (legacyResult.status === 'empty') return { status: 'no-legacy-data' }
  if (legacyResult.tasks.length === 0) return { status: 'no-legacy-data' }

  const resolvedLocalDate =
    legacyResult.status === 'today' ? currentLocalDate : legacyResult.localDate

  const migratedItems: AgendaItem[] = legacyResult.tasks.map((task) => ({
    id: task.id,
    title: task.title,
    status: task.status,
    localDate: resolvedLocalDate,
    startTime: null,
    durationMinutes: null,
  }))

  const writeResult = writeAgendaItems(storage, migratedItems)
  if (writeResult.status !== 'ok') return { status: 'write-error' }

  return { status: 'migrated', items: migratedItems }
}

function parseAgendaItems(rawItems: unknown[]): AgendaItem[] {
  const seenIds = new Set<string>()
  const items: AgendaItem[] = []

  for (const rawItem of rawItems) {
    if (!isValidAgendaItemCandidate(rawItem)) continue
    if (seenIds.has(rawItem.id)) continue

    seenIds.add(rawItem.id)
    items.push({
      id: rawItem.id,
      title: rawItem.title,
      status: rawItem.status,
      localDate: rawItem.localDate,
      startTime: rawItem.startTime,
      durationMinutes: rawItem.durationMinutes,
    })
  }

  return items
}

function isValidAgendaItemCandidate(value: unknown): value is AgendaItem {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false

  const candidate = value as Record<string, unknown>

  if (!isNonEmptyAfterTrim(candidate.id)) return false
  if (!isNonEmptyAfterTrim(candidate.title)) return false
  if (!isValidAgendaItemStatus(candidate.status)) return false
  if (typeof candidate.localDate !== 'string' || !isValidLocalDateString(candidate.localDate)) {
    return false
  }
  if (
    candidate.startTime !== null &&
    (typeof candidate.startTime !== 'string' || !isValidLocalTimeString(candidate.startTime))
  ) {
    return false
  }
  if (
    candidate.durationMinutes !== null &&
    (typeof candidate.durationMinutes !== 'number' ||
      !isValidDurationMinutes(candidate.durationMinutes))
  ) {
    return false
  }

  return true
}

function isNonEmptyAfterTrim(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== ''
}

function isValidAgendaItemStatus(value: unknown): value is AgendaItemStatus {
  return value === 'pending' || value === 'completed'
}
