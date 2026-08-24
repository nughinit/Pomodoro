import { formatTime } from '../domain/formatTime'
import { useFocusTimer } from '../hooks/useFocusTimer'
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

export function FocusTimer() {
  const { state, remainingMs, handleStart, handlePause, handleResume, handleReset } = useFocusTimer()

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

  return (
    <section className="focus-timer" aria-label="Cronômetro de foco">
      <p className="focus-timer__session">{SESSION_LABELS[state.sessionType]}</p>

      <p className="focus-timer__time" aria-label={`Tempo restante ${formatTime(remainingMs)}`}>
        {formatTime(remainingMs)}
      </p>

      <p className="focus-timer__status" role="status">
        {statusMessage}
      </p>

      <div className="focus-timer__actions">
        <button type="button" className="focus-timer__button focus-timer__button--primary" onClick={handlePrimaryAction}>
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
