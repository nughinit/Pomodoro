import { describe, expect, it } from 'vitest'
import { MAX_ESSENTIAL_TASKS } from './types'
import type { EssentialTask } from './types'
import {
  addEssentialTask,
  completeEssentialTask,
  countCompletedEssentialTasks,
  removeEssentialTask,
  reopenEssentialTask,
} from './essentialTasks'

describe('addEssentialTask', () => {
  it('adds a task with a normalized title and pending status', () => {
    const result = addEssentialTask([], 'id-1', '  Write report  ')

    expect(result).toEqual({
      status: 'added',
      tasks: [{ id: 'id-1', title: 'Write report', status: 'pending' }],
    })
  })

  it('does not mutate the original collection', () => {
    const original: EssentialTask[] = [{ id: 'id-1', title: 'Existing', status: 'pending' }]

    const result = addEssentialTask(original, 'id-2', 'New task')

    expect(original).toEqual([{ id: 'id-1', title: 'Existing', status: 'pending' }])
    expect(result.status).toBe('added')
    if (result.status === 'added') {
      expect(result.tasks).not.toBe(original)
      expect(result.tasks).toHaveLength(2)
    }
  })

  it('rejects an empty title', () => {
    const result = addEssentialTask([], 'id-1', '')

    expect(result).toEqual({ status: 'empty-title' })
  })

  it('rejects a title made only of whitespace', () => {
    const result = addEssentialTask([], 'id-1', '    ')

    expect(result).toEqual({ status: 'empty-title' })
  })

  it('does not alter the collection when the title is empty', () => {
    const original: EssentialTask[] = [{ id: 'id-1', title: 'Existing', status: 'pending' }]

    addEssentialTask(original, 'id-2', '   ')

    expect(original).toEqual([{ id: 'id-1', title: 'Existing', status: 'pending' }])
  })

  it('rejects a fifth task once the limit is reached', () => {
    const tasks: EssentialTask[] = Array.from({ length: MAX_ESSENTIAL_TASKS }, (_, index) => ({
      id: `id-${index}`,
      title: `Task ${index}`,
      status: 'pending' as const,
    }))

    const result = addEssentialTask(tasks, 'id-5', 'One too many')

    expect(result).toEqual({ status: 'limit-reached' })
    expect(tasks).toHaveLength(MAX_ESSENTIAL_TASKS)
  })

  it('allows exactly four tasks', () => {
    let tasks: EssentialTask[] = []

    for (let index = 0; index < MAX_ESSENTIAL_TASKS; index += 1) {
      const result = addEssentialTask(tasks, `id-${index}`, `Task ${index}`)
      expect(result.status).toBe('added')
      if (result.status === 'added') tasks = result.tasks
    }

    expect(tasks).toHaveLength(MAX_ESSENTIAL_TASKS)
  })
})

describe('completeEssentialTask', () => {
  it('marks a pending task as completed', () => {
    const tasks: EssentialTask[] = [{ id: 'id-1', title: 'Task', status: 'pending' }]

    const result = completeEssentialTask(tasks, 'id-1')

    expect(result).toEqual([{ id: 'id-1', title: 'Task', status: 'completed' }])
    expect(tasks[0].status).toBe('pending')
  })

  it('does not change an already completed task', () => {
    const tasks: EssentialTask[] = [{ id: 'id-1', title: 'Task', status: 'completed' }]

    const result = completeEssentialTask(tasks, 'id-1')

    expect(result).toBe(tasks)
  })

  it('returns the same collection when the id does not exist', () => {
    const tasks: EssentialTask[] = [{ id: 'id-1', title: 'Task', status: 'pending' }]

    const result = completeEssentialTask(tasks, 'unknown-id')

    expect(result).toBe(tasks)
  })
})

describe('reopenEssentialTask', () => {
  it('marks a completed task as pending', () => {
    const tasks: EssentialTask[] = [{ id: 'id-1', title: 'Task', status: 'completed' }]

    const result = reopenEssentialTask(tasks, 'id-1')

    expect(result).toEqual([{ id: 'id-1', title: 'Task', status: 'pending' }])
    expect(tasks[0].status).toBe('completed')
  })

  it('does not change an already pending task', () => {
    const tasks: EssentialTask[] = [{ id: 'id-1', title: 'Task', status: 'pending' }]

    const result = reopenEssentialTask(tasks, 'id-1')

    expect(result).toBe(tasks)
  })

  it('returns the same collection when the id does not exist', () => {
    const tasks: EssentialTask[] = [{ id: 'id-1', title: 'Task', status: 'completed' }]

    const result = reopenEssentialTask(tasks, 'unknown-id')

    expect(result).toBe(tasks)
  })
})

describe('removeEssentialTask', () => {
  it('removes the task with the matching id', () => {
    const tasks: EssentialTask[] = [
      { id: 'id-1', title: 'First', status: 'pending' },
      { id: 'id-2', title: 'Second', status: 'completed' },
    ]

    const result = removeEssentialTask(tasks, 'id-1')

    expect(result).toEqual([{ id: 'id-2', title: 'Second', status: 'completed' }])
    expect(tasks).toHaveLength(2)
  })

  it('returns the same collection when the id does not exist', () => {
    const tasks: EssentialTask[] = [{ id: 'id-1', title: 'Task', status: 'pending' }]

    const result = removeEssentialTask(tasks, 'unknown-id')

    expect(result).toBe(tasks)
  })
})

describe('countCompletedEssentialTasks', () => {
  it('counts only completed tasks', () => {
    const tasks: EssentialTask[] = [
      { id: 'id-1', title: 'First', status: 'completed' },
      { id: 'id-2', title: 'Second', status: 'pending' },
      { id: 'id-3', title: 'Third', status: 'completed' },
    ]

    expect(countCompletedEssentialTasks(tasks)).toBe(2)
  })

  it('returns zero for an empty collection', () => {
    expect(countCompletedEssentialTasks([])).toBe(0)
  })

  it('returns zero when no task is completed', () => {
    const tasks: EssentialTask[] = [{ id: 'id-1', title: 'First', status: 'pending' }]

    expect(countCompletedEssentialTasks(tasks)).toBe(0)
  })
})
