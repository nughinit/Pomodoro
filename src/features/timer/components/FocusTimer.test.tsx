import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FocusTimer } from './FocusTimer'

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
    render(<FocusTimer />)

    expect(screen.getByLabelText('Tempo restante 25:00')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Iniciar' })).toBeInTheDocument()
  })

  it('changes the primary action to Pausar after starting', () => {
    render(<FocusTimer />)

    act(() => clickPrimaryButton())

    expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument()
  })

  it('updates the visible countdown as time elapses', () => {
    render(<FocusTimer />)

    act(() => clickPrimaryButton())
    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    expect(screen.getByLabelText('Tempo restante 24:00')).toBeInTheDocument()
  })

  it('freezes the visible time when paused', () => {
    render(<FocusTimer />)

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
    render(<FocusTimer />)

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
    render(<FocusTimer />)

    act(() => clickPrimaryButton())
    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Reiniciar' })))

    expect(screen.getByLabelText('Tempo restante 25:00')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Iniciar' })).toBeInTheDocument()
  })

  it('displays 00:00 and completion status when the target time is reached', () => {
    render(<FocusTimer />)

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
    const { unmount } = render(<FocusTimer />)

    act(() => clickPrimaryButton())
    unmount()

    expect(clearIntervalSpy).toHaveBeenCalled()
  })

  it('clears the interval when the timer is paused', () => {
    render(<FocusTimer />)

    act(() => clickPrimaryButton())
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval')
    act(() => clickPrimaryButton())

    expect(clearIntervalSpy).toHaveBeenCalled()
  })

  it('clears the interval when reset', () => {
    render(<FocusTimer />)

    act(() => clickPrimaryButton())
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval')
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Reiniciar' })))

    expect(clearIntervalSpy).toHaveBeenCalled()
  })

  it('clears the interval when the session completes', () => {
    render(<FocusTimer />)

    act(() => clickPrimaryButton())
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval')
    act(() => {
      vi.advanceTimersByTime(25 * 60 * 1000)
    })

    expect(clearIntervalSpy).toHaveBeenCalled()
  })

  it('creates only one interval for an uninterrupted running period, even across many ticks', () => {
    const setIntervalSpy = vi.spyOn(window, 'setInterval')
    render(<FocusTimer />)

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
    render(<FocusTimer />)

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
