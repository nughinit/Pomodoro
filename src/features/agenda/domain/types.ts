export type AgendaItemStatus = 'pending' | 'completed'

/**
 * YYYY-MM-DD. TypeScript cannot enforce this shape at runtime — validate
 * with isValidLocalDateString before trusting a value typed as this alias.
 */
export type LocalDateString = string

/**
 * HH:mm (00:00–23:59). TypeScript cannot enforce this shape at runtime —
 * validate with isValidLocalTimeString before trusting a value typed as
 * this alias.
 */
export type LocalTimeString = string

export interface AgendaItem {
  id: string
  title: string
  status: AgendaItemStatus
  localDate: LocalDateString
  startTime: LocalTimeString | null
  durationMinutes: number | null
}

export const MAX_AGENDA_ITEM_DURATION_MINUTES = 1440
