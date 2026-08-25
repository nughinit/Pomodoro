import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FocusTimer } from './FocusTimer'
import { useFocusTimer } from '../hooks/useFocusTimer'
import type { EssentialTask } from '../../tasks/domain/types'

const DEFAULT_SELECTED_TASK: EssentialTask = { id: 'task-1', title: 'Write the report', status: 'pending' }

function FocusTimerHarness({
  selectedTask = DEFAULT_SELECTED_TASK,
  clearSelection = () => {},
  canChangeSelection = true,
}: {
  selectedTask?: EssentialTask | null
  clearSelection?: () => void
  canChangeSelection?: boolean
} = {}) {
  const timer = useFocusTimer()
  return (
    <FocusTimer
      {...timer}
      selectedTask={selectedTask}
      clearSelection={clearSelection}
      canChangeSelection={canChangeSelection}
    />
  )
}

function clickPrimaryButton() {
  fireEvent.click(screen.getByRole('button', { name: /^(iniciar|iniciar novamente|pausar|continuar)$/i }))
}

describe('FocusTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 1, 9, 0, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows the initial focus session at 25:00 with the start action', () => {
    render(<FocusTimerHarness />)

    expect(screen.getByLabelText('Tempo restante 25:00')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Iniciar' })).toBeInTheDocument()
  })

  it('changes the primary action to Pausar after starting', () => {
    render(<FocusTimerHarness />)

    act(() => clickPrimaryButton())

    expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument()
  })

  it('updates the visible countdown as time elapses', () => {
    render(<FocusTimerHarness />)

    act(() => clickPrimaryButton())
    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    expect(screen.getByLabelText('Tempo restante 24:00')).toBeInTheDocument()
  })

  it('freezes the visible time when paused', () => {
    render(<FocusTimerHarness />)

    act(() => clickPrimaryButton())
    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    act(() => clickPrimaryButton())

    expect(screen.getByRole('button', { name: 'Continuar' })).toBeInTheDocument()
    expect(screen.getByText('Pausado')).toBeInTheDocument()
    expect(screen.getByLabelText('Tempo restante 24:00')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(10_000)
    })

    expect(screen.getByLabelText('Tempo restante 24:00')).toBeInTheDocument()
  })

  it('resumes from the remaining time when continued', () => {
    render(<FocusTimerHarness />)

    act(() => clickPrimaryButton())
    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    act(() => clickPrimaryButton())
    act(() => clickPrimaryButton())
    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    expect(screen.getByLabelText('Tempo restante 23:00')).toBeInTheDocument()
  })

  it('restores 25:00 on reset', () => {
    render(<FocusTimerHarness />)

    act(() => clickPrimaryButton())
    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Reiniciar' })))

    expect(screen.getByLabelText('Tempo restante 25:00')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Iniciar' })).toBeInTheDocument()
  })

  it('displays 00:00 and completion status when the target time is reached', () => {
    render(<FocusTimerHarness />)

    act(() => clickPrimaryButton())
    act(() => {
      vi.advanceTimersByTime(25 * 60 * 1000)
    })

    expect(screen.getByLabelText('Tempo restante 00:00')).toBeInTheDocument()
    expect(screen.getByText('Sessão concluída')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Iniciar novamente' })).toBeInTheDocument()
  })

  it('clears the interval when the component unmounts while running', () => {
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval')
    const { unmount } = render(<FocusTimerHarness />)

    act(() => clickPrimaryButton())
    unmount()

    expect(clearIntervalSpy).toHaveBeenCalled()
  })

  it('clears the interval when the timer is paused', () => {
    render(<FocusTimerHarness />)

    act(() => clickPrimaryButton())
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval')
    act(() => clickPrimaryButton())

    expect(clearIntervalSpy).toHaveBeenCalled()
  })

  it('clears the interval when reset', () => {
    render(<FocusTimerHarness />)

    act(() => clickPrimaryButton())
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval')
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Reiniciar' })))

    expect(clearIntervalSpy).toHaveBeenCalled()
  })

  it('clears the interval when the session completes', () => {
    render(<FocusTimerHarness />)

    act(() => clickPrimaryButton())
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval')
    act(() => {
      vi.advanceTimersByTime(25 * 60 * 1000)
    })

    expect(clearIntervalSpy).toHaveBeenCalled()
  })

  it('creates only one interval for an uninterrupted running period, even across many ticks', () => {
    const setIntervalSpy = vi.spyOn(window, 'setInterval')
    render(<FocusTimerHarness />)

    act(() => clickPrimaryButton())
    expect(setIntervalSpy).toHaveBeenCalledTimes(1)

    act(() => {
      vi.advanceTimersByTime(10_000)
    })
    act(() => {
      vi.advanceTimersByTime(10_000)
    })
    act(() => {
      vi.advanceTimersByTime(10_000)
    })

    expect(setIntervalSpy).toHaveBeenCalledTimes(1)
  })

  it('restarts a fresh focus session immediately after completion', () => {
    render(<FocusTimerHarness />)

    act(() => clickPrimaryButton())
    act(() => {
      vi.advanceTimersByTime(25 * 60 * 1000)
    })

    expect(screen.getByRole('button', { name: 'Iniciar novamente' })).toBeInTheDocument()

    act(() => clickPrimaryButton())

    expect(screen.getByLabelText('Tempo restante 25:00')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    expect(screen.getByLabelText('Tempo restante 24:00')).toBeInTheDocument()
  })
})

describe('FocusTimer focus task region', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 1, 9, 0, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows guidance and no title when there is no selected task', () => {
    render(<FocusTimerHarness selectedTask={null} />)

    expect(screen.getByText('Tarefa em foco')).toBeInTheDocument()
    expect(screen.getByText('Escolha um item da agenda para iniciar.')).toBeInTheDocument()
  })

  it('disables Iniciar when there is no selected task', () => {
    render(<FocusTimerHarness selectedTask={null} />)

    expect(screen.getByRole('button', { name: 'Iniciar' })).toBeDisabled()
  })

  it('shows the selected task title', () => {
    render(<FocusTimerHarness selectedTask={{ id: 'task-1', title: 'Write the report', status: 'pending' }} />)

    expect(screen.getByText('Write the report')).toBeInTheDocument()
    expect(screen.queryByText('Escolha um item da agenda para iniciar.')).not.toBeInTheDocument()
  })

  it('enables Iniciar when a task is selected', () => {
    render(<FocusTimerHarness selectedTask={{ id: 'task-1', title: 'Write the report', status: 'pending' }} />)

    expect(screen.getByRole('button', { name: 'Iniciar' })).not.toBeDisabled()
  })

  it('calls clearSelection when unlink is clicked', () => {
    const clearSelection = vi.fn()
    render(
      <FocusTimerHarness
        selectedTask={{ id: 'task-1', title: 'Write the report', status: 'pending' }}
        clearSelection={clearSelection}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Desvincular tarefa do foco' }))

    expect(clearSelection).toHaveBeenCalledTimes(1)
  })

  it('disables the unlink button when the selection is locked', () => {
    render(
      <FocusTimerHarness
        selectedTask={{ id: 'task-1', title: 'Write the report', status: 'pending' }}
        canChangeSelection={false}
      />,
    )

    expect(screen.getByRole('button', { name: 'Desvincular tarefa do foco' })).toBeDisabled()
  })

  it('keeps Pausar enabled even if the selection is invalidated while running', () => {
    const { rerender } = render(
      <FocusTimerHarness selectedTask={{ id: 'task-1', title: 'Write the report', status: 'pending' }} />,
    )

    act(() => clickPrimaryButton())
    expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument()

    rerender(<FocusTimerHarness selectedTask={null} canChangeSelection={false} />)

    expect(screen.getByRole('button', { name: 'Pausar' })).not.toBeDisabled()
  })

  it('keeps Continuar enabled even if the selection is invalidated while paused', () => {
    const { rerender } = render(
      <FocusTimerHarness selectedTask={{ id: 'task-1', title: 'Write the report', status: 'pending' }} />,
    )

    act(() => clickPrimaryButton())
    act(() => clickPrimaryButton())
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeInTheDocument()

    rerender(<FocusTimerHarness selectedTask={null} canChangeSelection={false} />)

    expect(screen.getByRole('button', { name: 'Continuar' })).not.toBeDisabled()
  })

  it('does not call clearSelection when Reiniciar is clicked', () => {
    const clearSelection = vi.fn()
    render(
      <FocusTimerHarness
        selectedTask={{ id: 'task-1', title: 'Write the report', status: 'pending' }}
        clearSelection={clearSelection}
      />,
    )

    act(() => clickPrimaryButton())
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Reiniciar' })))

    expect(clearSelection).not.toHaveBeenCalled()
  })

  it('disables Iniciar novamente in the completed state when there is no selected task', () => {
    const { rerender } = render(
      <FocusTimerHarness selectedTask={{ id: 'task-1', title: 'Write the report', status: 'pending' }} />,
    )

    act(() => clickPrimaryButton())
    act(() => {
      vi.advanceTimersByTime(25 * 60 * 1000)
    })
    expect(screen.getByRole('button', { name: 'Iniciar novamente' })).toBeInTheDocument()

    rerender(<FocusTimerHarness selectedTask={null} />)

    expect(screen.getByRole('button', { name: 'Iniciar novamente' })).toBeDisabled()
  })
})
