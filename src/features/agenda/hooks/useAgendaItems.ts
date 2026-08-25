import { useCallback, useMemo, useState } from 'react'
import {
  addAgendaItem,
  completeAgendaItem,
  getAgendaItemsForDate,
  isValidLocalDateString,
  removeAgendaItem,
  reopenAgendaItem,
  sortAgendaItemsByTime,
} from '../domain/agendaItems'
import type { AddAgendaItemResult } from '../domain/agendaItems'
import type { AgendaItem, LocalDateString, LocalTimeString } from '../domain/types'
import {
  migrateEssentialTasksToAgenda,
  readAgendaItems,
  writeAgendaItems,
} from '../storage/agendaStorage'
import type { StorageLike } from '../storage/agendaStorage'
import { toLocalDateString } from '../../tasks/storage/essentialTasksStorage'

export interface UseAgendaItemsOptions {
  storage?: StorageLike | null
  now?: () => Date
}

export interface AddAgendaItemInput {
  title: string
  localDate?: LocalDateString
  startTime?: LocalTimeString | null
  durationMinutes?: number | null
}

export interface UseAgendaItemsResult {
  items: AgendaItem[]
  selectedDate: LocalDateString
  selectedDateItems: AgendaItem[]
  selectDate: (localDate: string) => void
  addItem: (input: AddAgendaItemInput) => AddAgendaItemResult['status']
  completeItem: (id: string) => void
  reopenItem: (id: string) => void
  removeItem: (id: string) => void
  isPersistenceAvailable: boolean
}

function getDefaultStorage(): StorageLike | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage
  } catch {
    return null
  }
}

function initializeAgendaItems(storage: StorageLike | null, currentLocalDate: string): AgendaItem[] {
  if (!storage) return []

  try {
    const readResult = readAgendaItems(storage)
    if (readResult.status === 'loaded') return readResult.items
    if (readResult.status === 'invalid') return []

    const migrateResult = migrateEssentialTasksToAgenda(storage, currentLocalDate)
    if (migrateResult.status === 'migrated') return migrateResult.items

    if (migrateResult.status === 'already-initialized') {
      const rereadResult = readAgendaItems(storage)
      return rereadResult.status === 'loaded' ? rereadResult.items : []
    }

    return []
  } catch {
    return []
  }
}

function getInitialNextId(items: AgendaItem[]): number {
  const pattern = /^agenda-item-(\d+)$/
  let max = 0

  for (const item of items) {
    const match = pattern.exec(item.id)
    if (!match) continue
    const value = Number(match[1])
    if (value > max) max = value
  }

  return max + 1
}

function generateUniqueId(items: AgendaItem[], startFrom: number): { id: string; nextCandidate: number } {
  let candidate = startFrom
  let id = `agenda-item-${candidate}`

  while (items.some((item) => item.id === id)) {
    candidate += 1
    id = `agenda-item-${candidate}`
  }

  return { id, nextCandidate: candidate + 1 }
}

export function useAgendaItems(options: UseAgendaItemsOptions = {}): UseAgendaItemsResult {
  const [storage] = useState<StorageLike | null>(() =>
    options.storage !== undefined ? options.storage : getDefaultStorage(),
  )
  const [now] = useState<() => Date>(() => options.now ?? (() => new Date()))
  const [selectedDate, setSelectedDate] = useState<string>(() => toLocalDateString(now()))

  const [items, setItems] = useState<AgendaItem[]>(() => initializeAgendaItems(storage, selectedDate))
  const [nextId, setNextId] = useState<number>(() => getInitialNextId(items))
  const [isPersistenceAvailable, setIsPersistenceAvailable] = useState<boolean>(() => storage !== null)

  const persist = useCallback(
    (nextItems: AgendaItem[]) => {
      if (!storage) return

      try {
        const result = writeAgendaItems(storage, nextItems)
        if (result.status !== 'ok') setIsPersistenceAvailable(false)
      } catch {
        setIsPersistenceAvailable(false)
      }
    },
    [storage],
  )

  const selectedDateItems = useMemo(() => {
    const result = getAgendaItemsForDate(items, selectedDate)
    if (result.status !== 'ok') return []

    return sortAgendaItemsByTime(result.items)
  }, [items, selectedDate])

  const selectDate = useCallback((localDate: string) => {
    if (!isValidLocalDateString(localDate)) return
    setSelectedDate(localDate)
  }, [])

  const addItem = useCallback(
    (input: AddAgendaItemInput): AddAgendaItemResult['status'] => {
      const localDate = input.localDate ?? selectedDate
      const startTime = input.startTime ?? null
      const durationMinutes = input.durationMinutes ?? null

      const { id, nextCandidate } = generateUniqueId(items, nextId)
      const result = addAgendaItem(items, id, input.title, localDate, startTime, durationMinutes)

      if (result.status === 'added') {
        setNextId(nextCandidate)
        setItems(result.items)
        persist(result.items)
      }

      return result.status
    },
    [items, nextId, selectedDate, persist],
  )

  const completeItem = useCallback(
    (id: string) => {
      const nextItems = completeAgendaItem(items, id)
      if (nextItems === items) return

      setItems(nextItems)
      persist(nextItems)
    },
    [items, persist],
  )

  const reopenItem = useCallback(
    (id: string) => {
      const nextItems = reopenAgendaItem(items, id)
      if (nextItems === items) return

      setItems(nextItems)
      persist(nextItems)
    },
    [items, persist],
  )

  const removeItem = useCallback(
    (id: string) => {
      const nextItems = removeAgendaItem(items, id)
      if (nextItems === items) return

      setItems(nextItems)
      persist(nextItems)
    },
    [items, persist],
  )

  return {
    items,
    selectedDate,
    selectedDateItems,
    selectDate,
    addItem,
    completeItem,
    reopenItem,
    removeItem,
    isPersistenceAvailable,
  }
}
