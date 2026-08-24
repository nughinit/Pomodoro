import { useCallback, useState } from 'react'
import type { EssentialTask } from '../../tasks/domain/types'
import type { TimerState } from '../../timer/domain/types'

export type FocusTimerStatus = TimerState['status']

export interface UseFocusTaskSelectionResult {
  selectedTaskId: string | null
  selectedTask: EssentialTask | null
  selectTask: (id: string) => void
  clearSelection: () => void
  canChangeSelection: boolean
}

function findEligibleTask(tasks: EssentialTask[], id: string | null): EssentialTask | null {
  if (id === null) return null
  const task = tasks.find((candidate) => candidate.id === id)
  return task && task.status === 'pending' ? task : null
}

export function useFocusTaskSelection(
  tasks: EssentialTask[],
  timerStatus: FocusTimerStatus,
): UseFocusTaskSelectionResult {
  const [internalTaskId, setInternalTaskId] = useState<string | null>(null)

  const canChangeSelection = timerStatus === 'idle' || timerStatus === 'completed'
  const selectedTask = findEligibleTask(tasks, internalTaskId)

  if (internalTaskId !== null && selectedTask === null) {
    setInternalTaskId(null)
  }

  const selectedTaskId = selectedTask ? selectedTask.id : null

  const selectTask = useCallback(
    (id: string) => {
      if (!canChangeSelection) return

      const task = tasks.find((candidate) => candidate.id === id)
      if (!task || task.status !== 'pending') return

      setInternalTaskId(id)
    },
    [canChangeSelection, tasks],
  )

  const clearSelection = useCallback(() => {
    if (!canChangeSelection) return
    setInternalTaskId(null)
  }, [canChangeSelection])

  return { selectedTaskId, selectedTask, selectTask, clearSelection, canChangeSelection }
}
