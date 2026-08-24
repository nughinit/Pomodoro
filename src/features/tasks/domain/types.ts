export type EssentialTaskStatus = 'pending' | 'completed'

export interface EssentialTask {
  id: string
  title: string
  status: EssentialTaskStatus
}

export const MAX_ESSENTIAL_TASKS = 4
