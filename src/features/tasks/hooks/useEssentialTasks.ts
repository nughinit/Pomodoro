import { useCallback, useRef, useState } from 'react'
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

export function useEssentialTasks() {
  const [tasks, setTasks] = useState<EssentialTask[]>([])
  const nextId = useRef(1)

  const addTask = useCallback(
    (title: string): AddEssentialTaskResult['status'] => {
      const id = `essential-task-${nextId.current}`
      const result = addEssentialTask(tasks, id, title)

      if (result.status === 'added') {
        nextId.current += 1
        setTasks(result.tasks)
      }

      return result.status
    },
    [tasks],
  )

  const completeTask = useCallback((id: string) => {
    setTasks((current) => completeEssentialTask(current, id))
  }, [])

  const reopenTask = useCallback((id: string) => {
    setTasks((current) => reopenEssentialTask(current, id))
  }, [])

  const removeTask = useCallback((id: string) => {
    setTasks((current) => removeEssentialTask(current, id))
  }, [])

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
