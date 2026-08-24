import { useCallback, useRef, useState } from 'react'
import { addEssentialTask, countCompletedEssentialTasks } from '../domain/essentialTasks'
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

  return {
    tasks,
    addTask,
    completedCount: countCompletedEssentialTasks(tasks),
    isLimitReached: tasks.length >= MAX_ESSENTIAL_TASKS,
  }
}
