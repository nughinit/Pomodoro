import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the VIA heading and tagline inside a main region', () => {
    render(<App />)

    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'VIA' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Do plano ao feito, no seu ritmo.'),
    ).toBeInTheDocument()
  })

  it('renders the Hoje section before the focus timer in reading order', () => {
    render(<App />)

    const todaySection = screen.getByRole('heading', { name: 'Hoje' })
    const timer = screen.getByLabelText('Cronômetro de foco')

    expect(
      todaySection.compareDocumentPosition(timer) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })
})

function addTaskByButton(title: string) {
  fireEvent.change(screen.getByLabelText('Nova tarefa essencial'), { target: { value: title } })
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }))
}

function getCompleteCheckbox(title: string) {
  return screen.getByRole('checkbox', { name: `Concluir tarefa "${title}"` })
}

function getRemoveButton(title: string) {
  return screen.getByRole('button', { name: `Remover tarefa "${title}"` })
}

function getConfirmRemoveButton() {
  return screen.getByRole('button', { name: 'Confirmar remoção' })
}

function clickTimerPrimaryButton() {
  fireEvent.click(screen.getByRole('button', { name: /^(iniciar|iniciar novamente|pausar|continuar)$/i }))
}

function clickTimerReset() {
  fireEvent.click(screen.getByRole('button', { name: 'Reiniciar' }))
}

describe('App integration: task planning and focus timer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 1, 9, 0, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('keeps an added task visible after starting the timer', () => {
    render(<App />)

    addTaskByButton('Write the report')
    act(() => clickTimerPrimaryButton())

    expect(screen.getByText('Write the report')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument()
  })

  it('advances the timer deterministically while the task list stays intact', () => {
    render(<App />)

    addTaskByButton('Write the report')
    act(() => clickTimerPrimaryButton())
    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    expect(screen.getByLabelText('Tempo restante 24:00')).toBeInTheDocument()
    expect(screen.getByText('Write the report')).toBeInTheDocument()
    expect(screen.getByText('0 de 4 tarefas concluídas')).toBeInTheDocument()
  })

  it('completing a task while the timer runs updates task progress and leaves the timer running', () => {
    render(<App />)

    addTaskByButton('Write the report')
    act(() => clickTimerPrimaryButton())
    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    fireEvent.click(getCompleteCheckbox('Write the report'))

    expect(screen.getByText('1 de 4 tarefas concluídas')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument()
    expect(screen.getByLabelText('Tempo restante 24:00')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    expect(screen.getByLabelText('Tempo restante 23:00')).toBeInTheDocument()
  })

  it('pausing or resetting the timer does not change task state or progress', () => {
    render(<App />)

    addTaskByButton('Write the report')
    fireEvent.click(getCompleteCheckbox('Write the report'))
    act(() => clickTimerPrimaryButton())
    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    act(() => clickTimerPrimaryButton())

    expect(screen.getByRole('button', { name: 'Continuar' })).toBeInTheDocument()
    expect(screen.getByText('1 de 4 tarefas concluídas')).toBeInTheDocument()
    expect(
      screen.queryByRole('checkbox', { name: 'Concluir tarefa "Write the report"' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Reabrir tarefa "Write the report"' })).toBeChecked()

    act(() => clickTimerReset())

    expect(screen.getByLabelText('Tempo restante 25:00')).toBeInTheDocument()
    expect(screen.getByText('1 de 4 tarefas concluídas')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Reabrir tarefa "Write the report"' })).toBeChecked()
  })

  it('removing a task does not alter the running timer status or time', () => {
    render(<App />)

    addTaskByButton('Write the report')
    addTaskByButton('Plan the day')
    act(() => clickTimerPrimaryButton())
    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    fireEvent.click(getRemoveButton('Write the report'))
    fireEvent.click(getConfirmRemoveButton())

    expect(screen.queryByText('Write the report')).not.toBeInTheDocument()
    expect(screen.getByText('Plan the day')).toBeInTheDocument()
    expect(screen.getByLabelText('Tempo restante 24:00')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument()
  })
})
