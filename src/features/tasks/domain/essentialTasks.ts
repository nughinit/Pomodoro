import { MAX_ESSENTIAL_TASKS } from './types'
import type { EssentialTask } from './types'

export type AddEssentialTaskResult =
  | { status: 'added'; tasks: EssentialTask[] }
  | { status: 'empty-title' }
  | { status: 'limit-reached' }

export function addEssentialTask(
  tasks: EssentialTask[],
  id: string,
  title: string,
): AddEssentialTaskResult {
  const normalizedTitle = title.trim()

  if (normalizedTitle === '') return { status: 'empty-title' }
  if (tasks.length >= MAX_ESSENTIAL_TASKS) return { status: 'limit-reached' }

  return {
    status: 'added',
    tasks: [...tasks, { id, title: normalizedTitle, status: 'pending' }],
  }
}

export function completeEssentialTask(tasks: EssentialTask[], id: string): EssentialTask[] {
  return setEssentialTaskStatus(tasks, id, 'completed')
}

export function reopenEssentialTask(tasks: EssentialTask[], id: string): EssentialTask[] {
  return setEssentialTaskStatus(tasks, id, 'pending')
}

export function removeEssentialTask(tasks: EssentialTask[], id: string): EssentialTask[] {
  if (!tasks.some((task) => task.id === id)) return tasks

  return tasks.filter((task) => task.id !== id)
}

export function countCompletedEssentialTasks(tasks: EssentialTask[]): number {
  return tasks.filter((task) => task.status === 'completed').length
}

function setEssentialTaskStatus(
  tasks: EssentialTask[],
  id: string,
  status: EssentialTask['status'],
): EssentialTask[] {
  const task = tasks.find((candidate) => candidate.id === id)
  if (!task || task.status === status) return tasks

  return tasks.map((candidate) => (candidate.id === id ? { ...candidate, status } : candidate))
}
