import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { AgendaItem, LocalDateString } from '../domain/types'
import type { AddAgendaItemResult } from '../domain/agendaItems'
import type { AddAgendaItemInput } from '../hooks/useAgendaItems'
import './DailyAgenda.css'

const EMPTY_TITLE_MESSAGE = 'Digite um título para adicionar o item.'

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' })
const LONG_DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

function toLocalDateString(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function parseLocalDate(localDate: LocalDateString): Date {
  const [year, month, day] = localDate.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function shiftLocalDate(localDate: LocalDateString, deltaDays: number): LocalDateString {
  const date = parseLocalDate(localDate)
  date.setDate(date.getDate() + deltaDays)
  return toLocalDateString(date)
}

function capitalize(value: string): string {
  return value.length === 0 ? value : value.charAt(0).toUpperCase() + value.slice(1)
}

function formatLongDate(localDate: LocalDateString): string {
  return LONG_DATE_FORMATTER.format(parseLocalDate(localDate))
}

function formatWeekdayDate(localDate: LocalDateString): string {
  const date = parseLocalDate(localDate)
  return `${capitalize(WEEKDAY_FORMATTER.format(date))}, ${LONG_DATE_FORMATTER.format(date)}`
}

export interface DailyAgendaFocusProps {
  selectedItemId: string | null
  selectItem: (id: string) => void
  canChangeSelection: boolean
}

export interface DailyAgendaProps extends DailyAgendaFocusProps {
  selectedDate: LocalDateString
  selectedDateItems: AgendaItem[]
  selectDate: (localDate: string) => void
  addItem: (input: AddAgendaItemInput) => AddAgendaItemResult['status']
  completeItem: (id: string) => void
  reopenItem: (id: string) => void
  removeItem: (id: string) => void
}

export function DailyAgenda({
  selectedDate,
  selectedDateItems,
  selectDate,
  addItem,
  completeItem,
  reopenItem,
  removeItem,
  selectedItemId,
  selectItem,
  canChangeSelection,
}: DailyAgendaProps) {
  const [title, setTitle] = useState('')
  const [feedback, setFeedback] = useState('')
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [dateSnapshotForConfirm, setDateSnapshotForConfirm] = useState(selectedDate)
  const [focusRequestId, setFocusRequestId] = useState(0)
  const pendingFocusRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const feedbackRef = useRef<HTMLParagraphElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const removeButtonRefs = useRef(new Map<string, HTMLButtonElement | null>())

  const isToday = selectedDate === toLocalDateString(new Date())
  const headingText = isToday ? 'Hoje' : formatWeekdayDate(selectedDate)

  if (dateSnapshotForConfirm !== selectedDate) {
    setDateSnapshotForConfirm(selectedDate)

    if (confirmingId !== null) {
      setConfirmingId(null)
    }
  }

  useEffect(() => {
    if (confirmingId !== null) {
      cancelButtonRef.current?.focus()
    }
  }, [confirmingId])

  useEffect(() => {
    if (!pendingFocusRef.current) return
    pendingFocusRef.current = false

    if (inputRef.current) {
      inputRef.current.focus()
    } else {
      headingRef.current?.focus()
    }
  }, [focusRequestId])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const outcome = addItem({ title })

    if (outcome === 'added') {
      setFeedback('')
      setTitle('')
      inputRef.current?.focus()
      return
    }

    if (outcome === 'empty-title') {
      setFeedback(EMPTY_TITLE_MESSAGE)
    }
  }

  const handleToggleStatus = (item: AgendaItem) => {
    if (item.status === 'completed') {
      reopenItem(item.id)
    } else {
      completeItem(item.id)
    }
  }

  const handleRequestRemove = (id: string) => {
    setConfirmingId(id)
  }

  const handleCancelRemove = (id: string) => {
    setConfirmingId(null)
    removeButtonRefs.current.get(id)?.focus()
  }

  const handleConfirmRemove = (id: string) => {
    removeItem(id)
    setConfirmingId(null)
    pendingFocusRef.current = true
    setFocusRequestId((current) => current + 1)
  }

  const handlePreviousDay = () => {
    selectDate(shiftLocalDate(selectedDate, -1))
  }

  const handleNextDay = () => {
    selectDate(shiftLocalDate(selectedDate, 1))
  }

  const handleToday = () => {
    selectDate(toLocalDateString(new Date()))
  }

  return (
    <section className="daily-agenda" aria-labelledby="daily-agenda-heading">
      <div className="daily-agenda__card">
        <nav className="daily-agenda__nav" aria-label="Navegação de datas">
          <button type="button" className="daily-agenda__nav-button" onClick={handlePreviousDay}>
            Dia anterior
          </button>
          <button type="button" className="daily-agenda__nav-button" onClick={handleToday}>
            Hoje
          </button>
          <button type="button" className="daily-agenda__nav-button" onClick={handleNextDay}>
            Próximo dia
          </button>
        </nav>

        <h2 id="daily-agenda-heading" ref={headingRef} tabIndex={-1} className="daily-agenda__title">
          {headingText}
        </h2>
        <p className="daily-agenda__date">{formatLongDate(selectedDate)}</p>

        {selectedDateItems.length === 0 ? (
          <p className="daily-agenda__empty">Nenhum item para este dia.</p>
        ) : (
          <ul className="daily-agenda__list">
            {selectedDateItems.map((item) => {
              const isCompleted = item.status === 'completed'
              const isConfirming = confirmingId === item.id
              const isSelectedForFocus = selectedItemId === item.id
              const questionId = `daily-agenda-confirm-question-${item.id}`

              return (
                <li
                  key={item.id}
                  className={
                    isCompleted
                      ? 'daily-agenda__item daily-agenda__item--completed'
                      : 'daily-agenda__item'
                  }
                >
                  <div className="daily-agenda__item-row">
                    <label className="daily-agenda__check">
                      <input
                        type="checkbox"
                        className="daily-agenda__checkbox"
                        checked={isCompleted}
                        onChange={() => handleToggleStatus(item)}
                        aria-label={
                          isCompleted ? `Reabrir item "${item.title}"` : `Concluir item "${item.title}"`
                        }
                      />
                      <span className="daily-agenda__item-body">
                        <span className="daily-agenda__item-title">{item.title}</span>
                        <span className="daily-agenda__item-meta">
                          {item.startTime ?? 'Sem horário'}
                          {item.durationMinutes !== null ? ` · ${item.durationMinutes} min` : ''}
                        </span>
                      </span>
                    </label>
                    {isCompleted && <span className="daily-agenda__status-badge">Concluído</span>}
                    {!isCompleted && (
                      <button
                        type="button"
                        className={
                          isSelectedForFocus
                            ? 'daily-agenda__focus-select daily-agenda__focus-select--selected'
                            : 'daily-agenda__focus-select'
                        }
                        aria-pressed={isSelectedForFocus}
                        aria-label={
                          isSelectedForFocus
                            ? `Item "${item.title}" selecionado para foco`
                            : `Selecionar item "${item.title}" para foco`
                        }
                        disabled={!canChangeSelection}
                        onClick={() => selectItem(item.id)}
                      >
                        {isSelectedForFocus ? 'Selecionado' : 'Selecionar foco'}
                      </button>
                    )}
                    <button
                      type="button"
                      className="daily-agenda__remove"
                      ref={(element) => {
                        removeButtonRefs.current.set(item.id, element)
                      }}
                      onClick={() => handleRequestRemove(item.id)}
                      aria-label={`Remover item "${item.title}"`}
                    >
                      Remover
                    </button>
                  </div>

                  {isConfirming && (
                    <div
                      className="daily-agenda__confirm"
                      role="group"
                      aria-label={`Confirmar remoção do item "${item.title}"`}
                    >
                      <p id={questionId} className="daily-agenda__confirm-question">
                        Remover "{item.title}"? Essa ação não pode ser desfeita.
                      </p>
                      <div className="daily-agenda__confirm-actions">
                        <button
                          type="button"
                          ref={cancelButtonRef}
                          className="daily-agenda__cancel"
                          onClick={() => handleCancelRemove(item.id)}
                          aria-describedby={questionId}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          className="daily-agenda__confirm-remove"
                          onClick={() => handleConfirmRemove(item.id)}
                          aria-describedby={questionId}
                        >
                          Confirmar remoção
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        <form className="daily-agenda__form" aria-label="Adicionar item" onSubmit={handleSubmit} noValidate>
          <label htmlFor="daily-agenda-title" className="daily-agenda__label">
            Novo item
          </label>
          <div className="daily-agenda__field">
            <input
              id="daily-agenda-title"
              ref={inputRef}
              className="daily-agenda__input"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              aria-describedby="daily-agenda-feedback"
            />
            <button type="submit" className="daily-agenda__submit">
              Adicionar
            </button>
          </div>
          <p
            id="daily-agenda-feedback"
            ref={feedbackRef}
            role="status"
            tabIndex={-1}
            className="daily-agenda__feedback"
          >
            {feedback}
          </p>
        </form>
      </div>
    </section>
  )
}
