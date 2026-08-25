import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { ESSENTIAL_TASKS_STORAGE_KEY, toLocalDateString } from './features/tasks/storage/essentialTasksStorage'

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

  it('renders the tasks section and focus timer inside a single workspace wrapper', () => {
    const { container } = render(<App />)

    const workspace = container.querySelector('.app-shell__workspace')
    expect(workspace).toBeInTheDocument()
    expect(workspace?.children).toHaveLength(2)

    const todaySection = screen.getByRole('heading', { name: 'Hoje' }).closest('section')
    const timerSection = screen.getByLabelText('Cronômetro de foco')

    expect(workspace).toContainElement(todaySection)
    expect(workspace).toContainElement(timerSection)
    expect(workspace?.children[0]).toBe(todaySection)
    expect(workspace?.children[1]).toBe(timerSection)
  })

  it('keeps the h1 -> h2 -> h3 heading hierarchy', () => {
    render(<App />)

    const h1 = screen.getByRole('heading', { level: 1, name: 'VIA' })
    const h2 = screen.getByRole('heading', { level: 2, name: 'Hoje' })
    const h3 = screen.getByRole('heading', { level: 3, name: 'Tarefas essenciais' })

    expect(h1).toBeInTheDocument()
    expect(h2).toBeInTheDocument()
    expect(h3).toBeInTheDocument()
  })
})

function addTaskByButton(title: string) {
  fireEvent.change(screen.getByLabelText('Nova tarefa essencial'), { target: { value: title } })
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }))
}

function getCompleteCheckbox(title: string) {
  return screen.getByRole('checkbox', { name: `Concluir tarefa "${title}"` })
}

function getReopenCheckbox(title: string) {
  return screen.getByRole('checkbox', { name: `Reabrir tarefa "${title}"` })
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

function getFocusSelectButton(title: string) {
  return screen.getByRole('button', { name: `Selecionar tarefa "${title}" para foco` })
}

function getFocusSelectedButton(title: string) {
  return screen.getByRole('button', { name: `Tarefa "${title}" selecionada para foco` })
}

function selectFocusTask(title: string) {
  fireEvent.click(getFocusSelectButton(title))
}

function getFocusTimerSection() {
  return screen.getByLabelText('Cronômetro de foco')
}

function getTaskListItem(title: string) {
  return within(screen.getByRole('list')).getByText(title)
}

function getUnlinkButton() {
  return screen.getByRole('button', { name: 'Desvincular tarefa do foco' })
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
    selectFocusTask('Write the report')
    act(() => clickTimerPrimaryButton())

    expect(getTaskListItem('Write the report')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument()
  })

  it('advances the timer deterministically while the task list stays intact', () => {
    render(<App />)

    addTaskByButton('Write the report')
    selectFocusTask('Write the report')
    act(() => clickTimerPrimaryButton())
    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    expect(screen.getByLabelText('Tempo restante 24:00')).toBeInTheDocument()
    expect(getTaskListItem('Write the report')).toBeInTheDocument()
    expect(screen.getByText('0 de 4 tarefas concluídas')).toBeInTheDocument()
  })

  it('completing the selected task while the timer runs updates progress, clears focus, and leaves the timer running', () => {
    render(<App />)

    addTaskByButton('Write the report')
    selectFocusTask('Write the report')
    act(() => clickTimerPrimaryButton())
    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    fireEvent.click(getCompleteCheckbox('Write the report'))

    expect(screen.getByText('1 de 4 tarefas concluídas')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument()
    expect(screen.getByLabelText('Tempo restante 24:00')).toBeInTheDocument()
    expect(
      within(getFocusTimerSection()).getByText('Escolha uma tarefa essencial para iniciar.'),
    ).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    expect(screen.getByLabelText('Tempo restante 23:00')).toBeInTheDocument()
  })

  it('pausing or resetting the timer does not change task state or progress', () => {
    render(<App />)

    addTaskByButton('Write the report')
    fireEvent.click(getCompleteCheckbox('Write the report'))
    addTaskByButton('Plan the day')
    selectFocusTask('Plan the day')
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

  it('removing an unselected task does not alter the running timer status or time', () => {
    render(<App />)

    addTaskByButton('Write the report')
    addTaskByButton('Plan the day')
    selectFocusTask('Plan the day')
    act(() => clickTimerPrimaryButton())
    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    fireEvent.click(getRemoveButton('Write the report'))
    fireEvent.click(getConfirmRemoveButton())

    expect(screen.queryByText('Write the report')).not.toBeInTheDocument()
    expect(getTaskListItem('Plan the day')).toBeInTheDocument()
    expect(screen.getByLabelText('Tempo restante 24:00')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument()
  })
})

function seedTodayRecord(tasks: { id: string; title: string; status: 'pending' | 'completed' }[]) {
  window.localStorage.setItem(
    ESSENTIAL_TASKS_STORAGE_KEY,
    JSON.stringify({ version: 1, localDate: toLocalDateString(new Date()), tasks }),
  )
}

describe('App integration: essential tasks persistence', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 1, 9, 0, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('hydrates a valid today record on first render while the timer stays idle at 25:00', () => {
    seedTodayRecord([{ id: 'essential-task-1', title: 'Write report', status: 'completed' }])

    render(<App />)

    expect(screen.getByText('Write report')).toBeInTheDocument()
    expect(getReopenCheckbox('Write report')).toBeChecked()
    expect(screen.getByLabelText('Tempo restante 25:00')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Iniciar' })).toBeInTheDocument()
  })

  it('recovers title and completion state after unmounting and remounting, simulating a reload', () => {
    const { unmount } = render(<App />)

    addTaskByButton('Write the report')
    fireEvent.click(getCompleteCheckbox('Write the report'))
    unmount()

    render(<App />)

    expect(screen.getByText('Write the report')).toBeInTheDocument()
    expect(getReopenCheckbox('Write the report')).toBeChecked()
  })

  it('does not show a stored task from another day and does not overwrite that record just by mounting', () => {
    window.localStorage.setItem(
      ESSENTIAL_TASKS_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        localDate: '2025-12-31',
        tasks: [{ id: 'essential-task-1', title: 'Old task', status: 'pending' }],
      }),
    )

    render(<App />)

    expect(screen.queryByText('Old task')).not.toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem(ESSENTIAL_TASKS_STORAGE_KEY)!)).toEqual({
      version: 1,
      localDate: '2025-12-31',
      tasks: [{ id: 'essential-task-1', title: 'Old task', status: 'pending' }],
    })
  })

  it('renders normally, allows adding a task, and keeps the timer usable when stored JSON is invalid', () => {
    window.localStorage.setItem(ESSENTIAL_TASKS_STORAGE_KEY, '{not valid json')

    render(<App />)

    addTaskByButton('Write the report')
    expect(screen.getByText('Write the report')).toBeInTheDocument()

    selectFocusTask('Write the report')
    act(() => clickTimerPrimaryButton())
    expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument()
  })

  it('clears yesterday tasks at local midnight while a running timer keeps advancing untouched', () => {
    seedTodayRecord([{ id: 'essential-task-1', title: 'Write report', status: 'pending' }])
    vi.setSystemTime(new Date(2026, 0, 1, 23, 59, 0))

    render(<App />)
    expect(screen.getByText('Write report')).toBeInTheDocument()

    selectFocusTask('Write report')
    act(() => clickTimerPrimaryButton())
    expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(2 * 60 * 1000)
    })

    expect(screen.queryByText('Write report')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument()
    expect(screen.getByLabelText('Tempo restante 23:00')).toBeInTheDocument()
    expect(
      within(getFocusTimerSection()).getByText('Escolha uma tarefa essencial para iniciar.'),
    ).toBeInTheDocument()
  })

  it('keeps the timer usable when localStorage access itself fails', () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage')

    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('localStorage disabled')
      },
    })

    try {
      render(<App />)

      addTaskByButton('Write the report')
      expect(screen.getByText('Write the report')).toBeInTheDocument()

      selectFocusTask('Write the report')
      act(() => clickTimerPrimaryButton())
      expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument()
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(window, 'localStorage', originalDescriptor)
      }
    }
  })
})

describe('App integration: focus task selection', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 1, 9, 0, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('selecting a pending task shows its title next to the timer and enables Iniciar', () => {
    render(<App />)

    addTaskByButton('Write the report')
    expect(screen.getByRole('button', { name: 'Iniciar' })).toBeDisabled()

    selectFocusTask('Write the report')

    expect(within(getFocusTimerSection()).getByText('Write the report')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Iniciar' })).not.toBeDisabled()
  })

  it('selecting a task does not start the timer automatically', () => {
    render(<App />)

    addTaskByButton('Write the report')
    selectFocusTask('Write the report')

    expect(screen.getByLabelText('Tempo restante 25:00')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Iniciar' })).toBeInTheDocument()
  })

  it('selecting task A then task B while idle switches the focus to B', () => {
    render(<App />)

    addTaskByButton('Write the report')
    addTaskByButton('Plan the day')

    selectFocusTask('Write the report')
    selectFocusTask('Plan the day')

    expect(within(getFocusTimerSection()).getByText('Plan the day')).toBeInTheDocument()
    expect(getFocusSelectButton('Write the report')).toHaveAttribute('aria-pressed', 'false')
    expect(getFocusSelectedButton('Plan the day')).toHaveAttribute('aria-pressed', 'true')
  })

  it('starting the session blocks every focus selection button', () => {
    render(<App />)

    addTaskByButton('Write the report')
    addTaskByButton('Plan the day')
    selectFocusTask('Write the report')

    act(() => clickTimerPrimaryButton())

    expect(getFocusSelectedButton('Write the report')).toBeDisabled()
    expect(getFocusSelectButton('Plan the day')).toBeDisabled()
  })

  it('pausing keeps the focus selection locked', () => {
    render(<App />)

    addTaskByButton('Write the report')
    addTaskByButton('Plan the day')
    selectFocusTask('Write the report')

    act(() => clickTimerPrimaryButton())
    act(() => clickTimerPrimaryButton())

    expect(screen.getByRole('button', { name: 'Continuar' })).toBeInTheDocument()
    expect(getFocusSelectButton('Plan the day')).toBeDisabled()
  })

  it('resetting the timer preserves the selection and unlocks switching again', () => {
    render(<App />)

    addTaskByButton('Write the report')
    addTaskByButton('Plan the day')
    selectFocusTask('Write the report')

    act(() => clickTimerPrimaryButton())
    act(() => clickTimerReset())

    expect(within(getFocusTimerSection()).getByText('Write the report')).toBeInTheDocument()
    expect(getFocusSelectButton('Plan the day')).not.toBeDisabled()

    selectFocusTask('Plan the day')
    expect(within(getFocusTimerSection()).getByText('Plan the day')).toBeInTheDocument()
  })

  it('completing the selected task while idle clears the focus and disables Iniciar', () => {
    render(<App />)

    addTaskByButton('Write the report')
    selectFocusTask('Write the report')

    fireEvent.click(getCompleteCheckbox('Write the report'))

    expect(
      within(getFocusTimerSection()).getByText('Escolha uma tarefa essencial para iniciar.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Iniciar' })).toBeDisabled()
  })

  it('removing the selected task clears the focus while the timer stays safe', () => {
    render(<App />)

    addTaskByButton('Write the report')
    selectFocusTask('Write the report')

    fireEvent.click(getRemoveButton('Write the report'))
    fireEvent.click(getConfirmRemoveButton())

    expect(
      within(getFocusTimerSection()).getByText('Escolha uma tarefa essencial para iniciar.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Iniciar' })).toBeDisabled()
    expect(screen.getByLabelText('Tempo restante 25:00')).toBeInTheDocument()
  })

  it('reopening a completed task does not select it automatically', () => {
    render(<App />)

    addTaskByButton('Write the report')
    fireEvent.click(getCompleteCheckbox('Write the report'))

    fireEvent.click(getReopenCheckbox('Write the report'))

    expect(
      within(getFocusTimerSection()).getByText('Escolha uma tarefa essencial para iniciar.'),
    ).toBeInTheDocument()
    expect(getFocusSelectButton('Write the report')).toHaveAttribute('aria-pressed', 'false')
  })

  it('a local day change removes the old focus even though the task list keeps updating', () => {
    seedTodayRecord([{ id: 'essential-task-1', title: 'Write report', status: 'pending' }])
    vi.setSystemTime(new Date(2026, 0, 1, 23, 59, 0))

    render(<App />)
    selectFocusTask('Write report')
    expect(within(getFocusTimerSection()).getByText('Write report')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(2 * 60 * 1000)
    })

    expect(
      within(getFocusTimerSection()).getByText('Escolha uma tarefa essencial para iniciar.'),
    ).toBeInTheDocument()
  })

  it('persists tasks without persisting the selection, so a remount recovers tasks but starts unselected', () => {
    const { unmount } = render(<App />)

    addTaskByButton('Write the report')
    selectFocusTask('Write the report')
    expect(within(getFocusTimerSection()).getByText('Write the report')).toBeInTheDocument()

    unmount()
    render(<App />)

    expect(screen.getByText('Write the report')).toBeInTheDocument()
    expect(
      within(getFocusTimerSection()).getByText('Escolha uma tarefa essencial para iniciar.'),
    ).toBeInTheDocument()
    expect(getFocusSelectButton('Write the report')).toHaveAttribute('aria-pressed', 'false')
  })

  it('exposes the selection and unlink controls as native, keyboard-focusable buttons', () => {
    render(<App />)

    addTaskByButton('Write the report')
    const selectButton = getFocusSelectButton('Write the report')
    expect(selectButton.tagName).toBe('BUTTON')

    selectButton.focus()
    expect(selectButton).toHaveFocus()
    fireEvent.click(selectButton)

    const unlinkButton = getUnlinkButton()
    expect(unlinkButton.tagName).toBe('BUTTON')
    unlinkButton.focus()
    expect(unlinkButton).toHaveFocus()
  })

  it('gives selection and unlink controls accessible names that include the task title', () => {
    render(<App />)

    addTaskByButton('Write the report')
    selectFocusTask('Write the report')

    expect(getFocusSelectedButton('Write the report')).toBeInTheDocument()
    expect(getUnlinkButton()).toBeInTheDocument()
  })

  it('unlinking the selection while idle clears the focus without disturbing the timer', () => {
    render(<App />)

    addTaskByButton('Write the report')
    selectFocusTask('Write the report')

    fireEvent.click(getUnlinkButton())

    expect(
      within(getFocusTimerSection()).getByText('Escolha uma tarefa essencial para iniciar.'),
    ).toBeInTheDocument()
    expect(getFocusSelectButton('Write the report')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByLabelText('Tempo restante 25:00')).toBeInTheDocument()
  })
})
