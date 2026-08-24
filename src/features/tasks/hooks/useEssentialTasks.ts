import { useCallback, useState } from 'react'
import {
  addEssentialTask,
  completeEssentialTask,
  countCompletedEssentialTasks,
  removeEssentialTask,
  reopenEssentialTask,
} from '../domain/essentialTasks'
import { MAX_ESSENTIAL_TASKS } from '../domain/types'
import type { EssentialTask } from '../domain/types'
import type { AddEssentialTaskResult } from '../domain/essentialTasks'
import { readEssentialTasks, toLocalDateString, writeEssentialTasks } from '../storage/essentialTasksStorage'
import type { StorageLike } from '../storage/essentialTasksStorage'

export interface UseEssentialTasksOptions {
  storage?: StorageLike | null
  now?: () => Date
}

function getDefaultStorage(): StorageLike | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage
  } catch {
    return null
  }
}

function getInitialNextId(tasks: EssentialTask[]): number {
  const pattern = /^essential-task-(\d+)$/
  let max = 0

  for (const task of tasks) {
    const match = pattern.exec(task.id)
    if (!match) continue
    const value = Number(match[1])
    if (value > max) max = value
  }

  return max + 1
}

function generateUniqueId(tasks: EssentialTask[], startFrom: number): { id: string; nextCandidate: number } {
  let candidate = startFrom
  let id = `essential-task-${candidate}`

  while (tasks.some((task) => task.id === id)) {
    candidate += 1
    id = `essential-task-${candidate}`
  }

  return { id, nextCandidate: candidate + 1 }
}

export function useEssentialTasks(options: UseEssentialTasksOptions = {}) {
  const [storage] = useState<StorageLike | null>(() =>
    options.storage !== undefined ? options.storage : getDefaultStorage(),
  )
  const [now] = useState<() => Date>(() => options.now ?? (() => new Date()))
  const [localDate] = useState<string>(() => toLocalDateString(now()))

  const [tasks, setTasks] = useState<EssentialTask[]>(() => {
    if (!storage) return []

    try {
      const result = readEssentialTasks(storage, localDate)
      return result.status === 'today' ? result.tasks : []
    } catch {
      return []
    }
  })

  const [nextId, setNextId] = useState<number>(() => getInitialNextId(tasks))

  const persist = useCallback(
    (nextTasks: EssentialTask[]) => {
      if (!storage) return

      try {
        writeEssentialTasks(storage, localDate, nextTasks)
      } catch {
        // Persistence failures must not affect in-memory state.
      }
    },
    [storage, localDate],
  )

  const addTask = useCallback(
    (title: string): AddEssentialTaskResult['status'] => {
      const { id, nextCandidate } = generateUniqueId(tasks, nextId)
      const result = addEssentialTask(tasks, id, title)

      if (result.status === 'added') {
        setNextId(nextCandidate)
        setTasks(result.tasks)
        persist(result.tasks)
      }

      return result.status
    },
    [tasks, nextId, persist],
  )

  const completeTask = useCallback(
    (id: string) => {
      const nextTasks = completeEssentialTask(tasks, id)
      if (nextTasks === tasks) return

      setTasks(nextTasks)
      persist(nextTasks)
    },
    [tasks, persist],
  )

  const reopenTask = useCallback(
    (id: string) => {
      const nextTasks = reopenEssentialTask(tasks, id)
      if (nextTasks === tasks) return

      setTasks(nextTasks)
      persist(nextTasks)
    },
    [tasks, persist],
  )

  const removeTask = useCallback(
    (id: string) => {
      const nextTasks = removeEssentialTask(tasks, id)
      if (nextTasks === tasks) return

      setTasks(nextTasks)
      persist(nextTasks)
    },
    [tasks, persist],
  )

  return {
    tasks,
    addTask,
    completeTask,
    reopenTask,
    removeTask,
    completedCount: countCompletedEssentialTasks(tasks),
    isLimitReached: tasks.length >= MAX_ESSENTIAL_TASKS,
  }
}
