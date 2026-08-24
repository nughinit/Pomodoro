import { MAX_ESSENTIAL_TASKS } from '../domain/types'
import type { EssentialTask, EssentialTaskStatus } from '../domain/types'

export const ESSENTIAL_TASKS_STORAGE_KEY = 'via:essential-tasks'

const ESSENTIAL_TASKS_SCHEMA_VERSION = 1

export interface EssentialTasksRecord {
  version: 1
  localDate: string
  tasks: EssentialTask[]
}

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export type ReadEssentialTasksResult =
  | { status: 'today'; tasks: EssentialTask[] }
  | { status: 'other-day'; localDate: string; tasks: EssentialTask[] }
  | { status: 'empty' }

export type WriteEssentialTasksResult = { status: 'ok' } | { status: 'error' }

export function toLocalDateString(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function readEssentialTasks(storage: StorageLike, localDate: string): ReadEssentialTasksResult {
  const record = readRecord(storage)
  if (!record) return { status: 'empty' }

  if (record.localDate !== localDate) {
    return { status: 'other-day', localDate: record.localDate, tasks: record.tasks }
  }

  return { status: 'today', tasks: record.tasks }
}

export function writeEssentialTasks(
  storage: StorageLike,
  localDate: string,
  tasks: EssentialTask[],
): WriteEssentialTasksResult {
  const record: EssentialTasksRecord = {
    version: ESSENTIAL_TASKS_SCHEMA_VERSION,
    localDate,
    tasks: [...tasks],
  }

  try {
    const serialized = JSON.stringify(record)
    storage.setItem(ESSENTIAL_TASKS_STORAGE_KEY, serialized)
    return { status: 'ok' }
  } catch {
    return { status: 'error' }
  }
}

function readRecord(storage: StorageLike): EssentialTasksRecord | null {
  let raw: string | null
  try {
    raw = storage.getItem(ESSENTIAL_TASKS_STORAGE_KEY)
  } catch {
    return null
  }

  if (raw === null) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  return parseRecord(parsed)
}

function parseRecord(value: unknown): EssentialTasksRecord | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null

  const envelope = value as Record<string, unknown>

  if (envelope.version !== ESSENTIAL_TASKS_SCHEMA_VERSION) return null
  if (typeof envelope.localDate !== 'string' || !isValidLocalDateString(envelope.localDate)) return null
  if (!Array.isArray(envelope.tasks)) return null

  return {
    version: ESSENTIAL_TASKS_SCHEMA_VERSION,
    localDate: envelope.localDate,
    tasks: parseTasks(envelope.tasks),
  }
}

function parseTasks(rawTasks: unknown[]): EssentialTask[] {
  const seenIds = new Set<string>()
  const tasks: EssentialTask[] = []

  for (const rawTask of rawTasks) {
    if (tasks.length >= MAX_ESSENTIAL_TASKS) break

    const task = parseTask(rawTask)
    if (!task) continue
    if (seenIds.has(task.id)) continue

    seenIds.add(task.id)
    tasks.push(task)
  }

  return tasks
}

function parseTask(value: unknown): EssentialTask | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null

  const candidate = value as Record<string, unknown>

  if (typeof candidate.id !== 'string' || candidate.id === '') return null
  if (typeof candidate.title !== 'string' || candidate.title.trim() === '') return null
  if (!isValidStatus(candidate.status)) return null

  return { id: candidate.id, title: candidate.title, status: candidate.status }
}

function isValidStatus(value: unknown): value is EssentialTaskStatus {
  return value === 'pending' || value === 'completed'
}

function isValidLocalDateString(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  const date = new Date(year, month - 1, day)

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}
