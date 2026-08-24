import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useFocusTaskSelection } from './useFocusTaskSelection'
import type { EssentialTask } from '../../tasks/domain/types'

const pendingA: EssentialTask = { id: 'task-1', title: 'Write report', status: 'pending' }
const pendingB: EssentialTask = { id: 'task-2', title: 'Plan day', status: 'pending' }
const completedA: EssentialTask = { id: 'task-1', title: 'Write report', status: 'completed' }

function renderSelection(initialTasks: EssentialTask[], initialStatus: 'idle' | 'running' | 'paused' | 'completed') {
  return renderHook(
    ({ tasks, status }: { tasks: EssentialTask[]; status: typeof initialStatus }) =>
      useFocusTaskSelection(tasks, status),
    { initialProps: { tasks: initialTasks, status: initialStatus } },
  )
}

describe('useFocusTaskSelection', () => {
  it('starts with no selection', () => {
    const { result } = renderSelection([pendingA], 'idle')

    expect(result.current.selectedTaskId).toBeNull()
    expect(result.current.selectedTask).toBeNull()
  })

  it('selects an existing pending task while idle', () => {
    const { result } = renderSelection([pendingA], 'idle')

    act(() => {
      result.current.selectTask('task-1')
    })

    expect(result.current.selectedTaskId).toBe('task-1')
    expect(result.current.selectedTask).toEqual(pendingA)
  })

  it('selects an existing pending task while completed', () => {
    const { result } = renderSelection([pendingA], 'completed')

    act(() => {
      result.current.selectTask('task-1')
    })

    expect(result.current.selectedTaskId).toBe('task-1')
  })

  it('rejects a nonexistent id and keeps the selection unchanged', () => {
    const { result } = renderSelection([pendingA], 'idle')

    act(() => {
      result.current.selectTask('does-not-exist')
    })

    expect(result.current.selectedTaskId).toBeNull()
  })

  it('rejects a completed task and keeps the selection unchanged', () => {
    const { result } = renderSelection([completedA], 'idle')

    act(() => {
      result.current.selectTask('task-1')
    })

    expect(result.current.selectedTaskId).toBeNull()
  })

  it('is idempotent when selecting the already selected task', () => {
    const { result } = renderSelection([pendingA], 'idle')

    act(() => {
      result.current.selectTask('task-1')
    })
    act(() => {
      result.current.selectTask('task-1')
    })

    expect(result.current.selectedTaskId).toBe('task-1')
  })

  it('switches from one pending task to another while idle', () => {
    const { result } = renderSelection([pendingA, pendingB], 'idle')

    act(() => {
      result.current.selectTask('task-1')
    })
    act(() => {
      result.current.selectTask('task-2')
    })

    expect(result.current.selectedTaskId).toBe('task-2')
  })

  it('blocks changing the selection while running', () => {
    const { result, rerender } = renderSelection([pendingA, pendingB], 'idle')

    act(() => {
      result.current.selectTask('task-1')
    })

    rerender({ tasks: [pendingA, pendingB], status: 'running' })
    expect(result.current.canChangeSelection).toBe(false)

    act(() => {
      result.current.selectTask('task-2')
    })

    expect(result.current.selectedTaskId).toBe('task-1')
  })

  it('blocks changing the selection while paused', () => {
    const { result } = renderSelection([pendingA, pendingB], 'paused')

    act(() => {
      result.current.selectTask('task-1')
    })

    expect(result.current.selectedTaskId).toBeNull()
    expect(result.current.canChangeSelection).toBe(false)
  })

  it('blocks manual clearSelection while running', () => {
    const { result, rerender } = renderSelection([pendingA], 'idle')

    act(() => {
      result.current.selectTask('task-1')
    })

    rerender({ tasks: [pendingA], status: 'running' })

    act(() => {
      result.current.clearSelection()
    })

    expect(result.current.selectedTaskId).toBe('task-1')
  })

  it('blocks manual clearSelection while paused', () => {
    const { result, rerender } = renderSelection([pendingA], 'idle')

    act(() => {
      result.current.selectTask('task-1')
    })

    rerender({ tasks: [pendingA], status: 'paused' })

    act(() => {
      result.current.clearSelection()
    })

    expect(result.current.selectedTaskId).toBe('task-1')
  })

  it('allows clearSelection while idle', () => {
    const { result } = renderSelection([pendingA], 'idle')

    act(() => {
      result.current.selectTask('task-1')
    })
    act(() => {
      result.current.clearSelection()
    })

    expect(result.current.selectedTaskId).toBeNull()
  })

  it('preserves the selection when the timer moves from running to paused', () => {
    const { result, rerender } = renderSelection([pendingA], 'idle')

    act(() => {
      result.current.selectTask('task-1')
    })

    rerender({ tasks: [pendingA], status: 'running' })
    expect(result.current.selectedTaskId).toBe('task-1')

    rerender({ tasks: [pendingA], status: 'paused' })
    expect(result.current.selectedTaskId).toBe('task-1')
  })

  it('preserves the selection when the timer moves to completed', () => {
    const { result, rerender } = renderSelection([pendingA], 'idle')

    act(() => {
      result.current.selectTask('task-1')
    })

    rerender({ tasks: [pendingA], status: 'running' })
    rerender({ tasks: [pendingA], status: 'completed' })

    expect(result.current.selectedTaskId).toBe('task-1')
  })

  it('invalidates the selection when the selected task is completed', () => {
    const { result, rerender } = renderSelection([pendingA], 'idle')

    act(() => {
      result.current.selectTask('task-1')
    })

    rerender({ tasks: [completedA], status: 'idle' })

    expect(result.current.selectedTaskId).toBeNull()
    expect(result.current.selectedTask).toBeNull()
  })

  it('invalidates the selection when the selected task is removed', () => {
    const { result, rerender } = renderSelection([pendingA, pendingB], 'idle')

    act(() => {
      result.current.selectTask('task-1')
    })

    rerender({ tasks: [pendingB], status: 'idle' })

    expect(result.current.selectedTaskId).toBeNull()
  })

  it('invalidates the selection when the task list is replaced on a rollover', () => {
    const { result, rerender } = renderSelection([pendingA], 'idle')

    act(() => {
      result.current.selectTask('task-1')
    })

    rerender({ tasks: [], status: 'idle' })

    expect(result.current.selectedTaskId).toBeNull()
  })

  it('does not auto-select a task that was just reopened', () => {
    const { result, rerender } = renderSelection([completedA], 'idle')

    rerender({ tasks: [pendingA], status: 'idle' })

    expect(result.current.selectedTaskId).toBeNull()
  })

  it('allows selecting again after an invalidation', () => {
    const { result, rerender } = renderSelection([pendingA, pendingB], 'idle')

    act(() => {
      result.current.selectTask('task-1')
    })

    rerender({ tasks: [completedA, pendingB], status: 'idle' })
    expect(result.current.selectedTaskId).toBeNull()

    act(() => {
      result.current.selectTask('task-2')
    })

    expect(result.current.selectedTaskId).toBe('task-2')
  })
})
