import { formatTime } from '../domain/formatTime'
import type { UseFocusTimerResult } from '../hooks/useFocusTimer'
import type { EssentialTask } from '../../tasks/domain/types'
import './FocusTimer.css'

const SESSION_LABELS = {
  focus: 'Foco',
  shortBreak: 'Pausa curta',
  longBreak: 'Pausa longa',
} as const

const STATUS_LABELS = {
  idle: null,
  running: null,
  paused: 'Pausado',
  completed: 'Sessão concluída',
} as const

function getPrimaryLabel(status: string): string {
  switch (status) {
    case 'running':
      return 'Pausar'
    case 'paused':
      return 'Continuar'
    case 'completed':
      return 'Iniciar novamente'
    default:
      return 'Iniciar'
  }
}

export interface FocusTimerFocusTaskProps {
  selectedTask: EssentialTask | null
  clearSelection: () => void
  canChangeSelection: boolean
}

export type FocusTimerProps = UseFocusTimerResult & FocusTimerFocusTaskProps

export function FocusTimer({
  state,
  remainingMs,
  handleStart,
  handlePause,
  handleResume,
  handleReset,
  selectedTask,
  clearSelection,
  canChangeSelection,
}: FocusTimerProps) {
  const handlePrimaryAction = () => {
    switch (state.status) {
      case 'idle':
        handleStart()
        break
      case 'running':
        handlePause()
        break
      case 'paused':
        handleResume()
        break
      case 'completed':
        handleStart()
        break
    }
  }

  const statusMessage = STATUS_LABELS[state.status]
  const requiresSelection = state.status === 'idle' || state.status === 'completed'
  const isPrimaryDisabled = requiresSelection && selectedTask === null

  return (
    <section className="focus-timer" aria-label="Cronômetro de foco">
      <p className="focus-timer__session">{SESSION_LABELS[state.sessionType]}</p>

      <div className="focus-timer__focus-task" aria-live="polite">
        <p className="focus-timer__focus-label">Tarefa em foco</p>
        {selectedTask ? (
          <p className="focus-timer__focus-title">{selectedTask.title}</p>
        ) : (
          <p className="focus-timer__focus-empty">Escolha uma tarefa essencial para iniciar.</p>
        )}
        {selectedTask && (
          <button
            type="button"
            className="focus-timer__unlink"
            onClick={clearSelection}
            disabled={!canChangeSelection}
          >
            Desvincular tarefa do foco
          </button>
        )}
      </div>

      <p className="focus-timer__time" aria-label={`Tempo restante ${formatTime(remainingMs)}`}>
        {formatTime(remainingMs)}
      </p>

      <p className="focus-timer__status" role="status">
        {statusMessage}
      </p>

      <div className="focus-timer__actions">
        <button
          type="button"
          className="focus-timer__button focus-timer__button--primary"
          onClick={handlePrimaryAction}
          disabled={isPrimaryDisabled}
        >
          {getPrimaryLabel(state.status)}
        </button>
        <button
          type="button"
          className="focus-timer__button focus-timer__button--secondary"
          onClick={handleReset}
          disabled={state.status === 'idle'}
        >
          Reiniciar
        </button>
      </div>
    </section>
  )
}
