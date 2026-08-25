import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { AGENDA_STORAGE_KEY } from './features/agenda/storage/agendaStorage'
import { ESSENTIAL_TASKS_STORAGE_KEY } from './features/tasks/storage/essentialTasksStorage'

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

  it('renders the agenda section and focus timer inside a single workspace wrapper', () => {
    const { container } = render(<App />)

    const workspace = container.querySelector('.app-shell__workspace')
    expect(workspace).toBeInTheDocument()
    expect(workspace?.children).toHaveLength(2)

    const agendaSection = screen.getByRole('heading', { name: 'Hoje' }).closest('section')
    const timerSection = screen.getByLabelText('Cronômetro de foco')

    expect(workspace).toContainElement(agendaSection)
    expect(workspace).toContainElement(timerSection)
    expect(workspace?.children[0]).toBe(agendaSection)
    expect(workspace?.children[1]).toBe(timerSection)
  })

  it('keeps the h1 -> h2 heading hierarchy', () => {
    render(<App />)

    const h1 = screen.getByRole('heading', { level: 1, name: 'VIA' })
    const h2 = screen.getByRole('heading', { level: 2, name: 'Hoje' })

    expect(h1).toBeInTheDocument()
    expect(h2).toBeInTheDocument()
  })
})

function addItemByButton(title: string) {
  fireEvent.change(screen.getByLabelText('Novo item'), { target: { value: title } })
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }))
}

function getCompleteCheckbox(title: string) {
  return screen.getByRole('checkbox', { name: `Concluir item "${title}"` })
}

function getReopenCheckbox(title: string) {
  return screen.getByRole('checkbox', { name: `Reabrir item "${title}"` })
}

function getRemoveButton(title: string) {
  return screen.getByRole('button', { name: `Remover item "${title}"` })
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
  return screen.getByRole('button', { name: `Selecionar item "${title}" para foco` })
}

function getFocusSelectedButton(title: string) {
  return screen.getByRole('button', { name: `Item "${title}" selecionado para foco` })
}

function selectFocusItem(title: string) {
  fireEvent.click(getFocusSelectButton(title))
}

function getFocusTimerSection() {
  return screen.getByLabelText('Cronômetro de foco')
}

function getAgendaListItem(title: string) {
  return within(screen.getByRole('list')).getByText(title)
}

function getUnlinkButton() {
  return screen.getByRole('button', { name: 'Desvincular tarefa do foco' })
}

describe('App integration: agenda planning and focus timer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 1, 9, 0, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('keeps an added item visible after starting the timer', () => {
    render(<App />)

    addItemByButton('Write the report')
    selectFocusItem('Write the report')
    act(() => clickTimerPrimaryButton())

    expect(getAgendaListItem('Write the report')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument()
  })

  it('creates an item with an optional start time and duration, deriving the end time', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Novo item'), { target: { value: 'Write the report' } })
    fireEvent.change(screen.getByLabelText('Horário'), { target: { value: '09:00' } })
    fireEvent.change(screen.getByLabelText('Duração (minutos)'), { target: { value: '30' } })
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }))

    expect(screen.getByText('09:00–09:30 · 30 min')).toBeInTheDocument()
    selectFocusItem('Write the report')
    expect(within(getFocusTimerSection()).getByText('Write the report')).toBeInTheDocument()
  })

  it('advances the timer deterministically while the agenda list stays intact', () => {
    render(<App />)

    addItemByButton('Write the report')
    selectFocusItem('Write the report')
    act(() => clickTimerPrimaryButton())
    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    expect(screen.getByLabelText('Tempo restante 24:00')).toBeInTheDocument()
    expect(getAgendaListItem('Write the report')).toBeInTheDocument()
  })

  it('completing the selected item while the timer runs clears focus and leaves the timer running', () => {
    render(<App />)

    addItemByButton('Write the report')
    selectFocusItem('Write the report')
    act(() => clickTimerPrimaryButton())
    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    fireEvent.click(getCompleteCheckbox('Write the report'))

    expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument()
    expect(screen.getByLabelText('Tempo restante 24:00')).toBeInTheDocument()
    expect(
      within(getFocusTimerSection()).getByText('Escolha um item da agenda para iniciar.'),
    ).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    expect(screen.getByLabelText('Tempo restante 23:00')).toBeInTheDocument()
  })

  it('pausing or resetting the timer does not change item state', () => {
    render(<App />)

    addItemByButton('Write the report')
    fireEvent.click(getCompleteCheckbox('Write the report'))
    addItemByButton('Plan the day')
    selectFocusItem('Plan the day')
    act(() => clickTimerPrimaryButton())
    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    act(() => clickTimerPrimaryButton())

    expect(screen.getByRole('button', { name: 'Continuar' })).toBeInTheDocument()
    expect(
      screen.queryByRole('checkbox', { name: 'Concluir item "Write the report"' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Reabrir item "Write the report"' })).toBeChecked()

    act(() => clickTimerReset())

    expect(screen.getByLabelText('Tempo restante 25:00')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Reabrir item "Write the report"' })).toBeChecked()
  })

  it('removing an unselected item does not alter the running timer status or time', () => {
    render(<App />)

    addItemByButton('Write the report')
    addItemByButton('Plan the day')
    selectFocusItem('Plan the day')
    act(() => clickTimerPrimaryButton())
    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    fireEvent.click(getRemoveButton('Write the report'))
    fireEvent.click(getConfirmRemoveButton())

    expect(screen.queryByText('Write the report')).not.toBeInTheDocument()
    expect(getAgendaListItem('Plan the day')).toBeInTheDocument()
    expect(screen.getByLabelText('Tempo restante 24:00')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument()
  })
})

function seedTodayEssentialTasks(tasks: { id: string; title: string; status: 'pending' | 'completed' }[]) {
  const year = String(new Date().getFullYear()).padStart(4, '0')
  const month = String(new Date().getMonth() + 1).padStart(2, '0')
  const day = String(new Date().getDate()).padStart(2, '0')

  window.localStorage.setItem(
    ESSENTIAL_TASKS_STORAGE_KEY,
    JSON.stringify({ version: 1, localDate: `${year}-${month}-${day}`, tasks }),
  )
}

describe('App integration: agenda persistence', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 1, 9, 0, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('migrates a legacy essential-tasks record into the agenda on first render without erasing it', () => {
    seedTodayEssentialTasks([{ id: 'essential-task-1', title: 'Write report', status: 'completed' }])

    render(<App />)

    expect(screen.getByText('Write report')).toBeInTheDocument()
    expect(getReopenCheckbox('Write report')).toBeChecked()
    expect(screen.getByLabelText('Tempo restante 25:00')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Iniciar' })).toBeInTheDocument()
    expect(window.localStorage.getItem(ESSENTIAL_TASKS_STORAGE_KEY)).not.toBeNull()
    expect(window.localStorage.getItem(AGENDA_STORAGE_KEY)).not.toBeNull()
  })

  it('recovers title and completion state after unmounting and remounting, simulating a reload', () => {
    const { unmount } = render(<App />)

    addItemByButton('Write the report')
    fireEvent.click(getCompleteCheckbox('Write the report'))
    unmount()

    render(<App />)

    expect(screen.getByText('Write the report')).toBeInTheDocument()
    expect(getReopenCheckbox('Write the report')).toBeChecked()
  })

  it('renders normally, allows adding an item, and keeps the timer usable when stored JSON is invalid', () => {
    window.localStorage.setItem(AGENDA_STORAGE_KEY, '{not valid json')

    render(<App />)

    addItemByButton('Write the report')
    expect(screen.getByText('Write the report')).toBeInTheDocument()

    selectFocusItem('Write the report')
    act(() => clickTimerPrimaryButton())
    expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument()
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

      addItemByButton('Write the report')
      expect(screen.getByText('Write the report')).toBeInTheDocument()

      selectFocusItem('Write the report')
      act(() => clickTimerPrimaryButton())
      expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument()
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(window, 'localStorage', originalDescriptor)
      }
    }
  })
})

describe('App integration: focus item selection', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 1, 9, 0, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('selecting a pending item shows its title next to the timer and enables Iniciar', () => {
    render(<App />)

    addItemByButton('Write the report')
    expect(screen.getByRole('button', { name: 'Iniciar' })).toBeDisabled()

    selectFocusItem('Write the report')

    expect(within(getFocusTimerSection()).getByText('Write the report')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Iniciar' })).not.toBeDisabled()
  })

  it('selecting an item does not start the timer automatically', () => {
    render(<App />)

    addItemByButton('Write the report')
    selectFocusItem('Write the report')

    expect(screen.getByLabelText('Tempo restante 25:00')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Iniciar' })).toBeInTheDocument()
  })

  it('selecting item A then item B while idle switches the focus to B', () => {
    render(<App />)

    addItemByButton('Write the report')
    addItemByButton('Plan the day')

    selectFocusItem('Write the report')
    selectFocusItem('Plan the day')

    expect(within(getFocusTimerSection()).getByText('Plan the day')).toBeInTheDocument()
    expect(getFocusSelectButton('Write the report')).toHaveAttribute('aria-pressed', 'false')
    expect(getFocusSelectedButton('Plan the day')).toHaveAttribute('aria-pressed', 'true')
  })

  it('starting the session blocks every focus selection button', () => {
    render(<App />)

    addItemByButton('Write the report')
    addItemByButton('Plan the day')
    selectFocusItem('Write the report')

    act(() => clickTimerPrimaryButton())

    expect(getFocusSelectedButton('Write the report')).toBeDisabled()
    expect(getFocusSelectButton('Plan the day')).toBeDisabled()
  })

  it('pausing keeps the focus selection locked', () => {
    render(<App />)

    addItemByButton('Write the report')
    addItemByButton('Plan the day')
    selectFocusItem('Write the report')

    act(() => clickTimerPrimaryButton())
    act(() => clickTimerPrimaryButton())

    expect(screen.getByRole('button', { name: 'Continuar' })).toBeInTheDocument()
    expect(getFocusSelectButton('Plan the day')).toBeDisabled()
  })

  it('resetting the timer preserves the selection and unlocks switching again', () => {
    render(<App />)

    addItemByButton('Write the report')
    addItemByButton('Plan the day')
    selectFocusItem('Write the report')

    act(() => clickTimerPrimaryButton())
    act(() => clickTimerReset())

    expect(within(getFocusTimerSection()).getByText('Write the report')).toBeInTheDocument()
    expect(getFocusSelectButton('Plan the day')).not.toBeDisabled()

    selectFocusItem('Plan the day')
    expect(within(getFocusTimerSection()).getByText('Plan the day')).toBeInTheDocument()
  })

  it('completing the selected item while idle clears the focus and disables Iniciar', () => {
    render(<App />)

    addItemByButton('Write the report')
    selectFocusItem('Write the report')

    fireEvent.click(getCompleteCheckbox('Write the report'))

    expect(
      within(getFocusTimerSection()).getByText('Escolha um item da agenda para iniciar.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Iniciar' })).toBeDisabled()
  })

  it('removing the selected item clears the focus while the timer stays safe', () => {
    render(<App />)

    addItemByButton('Write the report')
    selectFocusItem('Write the report')

    fireEvent.click(getRemoveButton('Write the report'))
    fireEvent.click(getConfirmRemoveButton())

    expect(
      within(getFocusTimerSection()).getByText('Escolha um item da agenda para iniciar.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Iniciar' })).toBeDisabled()
    expect(screen.getByLabelText('Tempo restante 25:00')).toBeInTheDocument()
  })

  it('reopening a completed item does not select it automatically', () => {
    render(<App />)

    addItemByButton('Write the report')
    fireEvent.click(getCompleteCheckbox('Write the report'))

    fireEvent.click(getReopenCheckbox('Write the report'))

    expect(
      within(getFocusTimerSection()).getByText('Escolha um item da agenda para iniciar.'),
    ).toBeInTheDocument()
    expect(getFocusSelectButton('Write the report')).toHaveAttribute('aria-pressed', 'false')
  })

  it('changing the selected date removes the old focus even though the agenda keeps updating', () => {
    render(<App />)

    addItemByButton('Write the report')
    selectFocusItem('Write the report')
    expect(within(getFocusTimerSection()).getByText('Write the report')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Próximo dia' }))

    expect(
      within(getFocusTimerSection()).getByText('Escolha um item da agenda para iniciar.'),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Dia anterior' }))

    expect(
      within(getFocusTimerSection()).getByText('Escolha um item da agenda para iniciar.'),
    ).toBeInTheDocument()
  })

  it('persists items without persisting the selection, so a remount recovers items but starts unselected', () => {
    const { unmount } = render(<App />)

    addItemByButton('Write the report')
    selectFocusItem('Write the report')
    expect(within(getFocusTimerSection()).getByText('Write the report')).toBeInTheDocument()

    unmount()
    render(<App />)

    expect(screen.getByText('Write the report')).toBeInTheDocument()
    expect(
      within(getFocusTimerSection()).getByText('Escolha um item da agenda para iniciar.'),
    ).toBeInTheDocument()
    expect(getFocusSelectButton('Write the report')).toHaveAttribute('aria-pressed', 'false')
  })

  it('exposes the selection and unlink controls as native, keyboard-focusable buttons', () => {
    render(<App />)

    addItemByButton('Write the report')
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

  it('gives selection and unlink controls accessible names that include the item title', () => {
    render(<App />)

    addItemByButton('Write the report')
    selectFocusItem('Write the report')

    expect(getFocusSelectedButton('Write the report')).toBeInTheDocument()
    expect(getUnlinkButton()).toBeInTheDocument()
  })

  it('unlinking the selection while idle clears the focus without disturbing the timer', () => {
    render(<App />)

    addItemByButton('Write the report')
    selectFocusItem('Write the report')

    fireEvent.click(getUnlinkButton())

    expect(
      within(getFocusTimerSection()).getByText('Escolha um item da agenda para iniciar.'),
    ).toBeInTheDocument()
    expect(getFocusSelectButton('Write the report')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByLabelText('Tempo restante 25:00')).toBeInTheDocument()
  })

  it('adding a new item after removing the selected one does not auto-associate the new item with focus', () => {
    render(<App />)

    addItemByButton('Write the report')
    selectFocusItem('Write the report')
    fireEvent.click(getRemoveButton('Write the report'))
    fireEvent.click(getConfirmRemoveButton())

    addItemByButton('Write the report')

    expect(
      within(getFocusTimerSection()).getByText('Escolha um item da agenda para iniciar.'),
    ).toBeInTheDocument()
    expect(getFocusSelectButton('Write the report')).toHaveAttribute('aria-pressed', 'false')
  })
})

describe('App integration: date changes during an active session', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 1, 9, 0, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('invalidates the selection permanently when the date changes while the timer is running, without pausing it', () => {
    render(<App />)

    addItemByButton('Write the report')
    selectFocusItem('Write the report')
    act(() => clickTimerPrimaryButton())
    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Próximo dia' }))

    expect(
      within(getFocusTimerSection()).getByText('Escolha um item da agenda para iniciar.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    expect(screen.getByLabelText('Tempo restante 23:00')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Dia anterior' }))

    expect(getAgendaListItem('Write the report')).toBeInTheDocument()
    expect(
      within(getFocusTimerSection()).getByText('Escolha um item da agenda para iniciar.'),
    ).toBeInTheDocument()
    expect(getFocusSelectButton('Write the report')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument()
  })

  it('invalidates the selection permanently when the date changes while the timer is paused, without changing its state', () => {
    render(<App />)

    addItemByButton('Write the report')
    selectFocusItem('Write the report')
    act(() => clickTimerPrimaryButton())
    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    act(() => clickTimerPrimaryButton())

    expect(screen.getByRole('button', { name: 'Continuar' })).toBeInTheDocument()
    expect(screen.getByLabelText('Tempo restante 24:00')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Próximo dia' }))

    expect(
      within(getFocusTimerSection()).getByText('Escolha um item da agenda para iniciar.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeInTheDocument()
    expect(screen.getByLabelText('Tempo restante 24:00')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Dia anterior' }))

    expect(getAgendaListItem('Write the report')).toBeInTheDocument()
    expect(
      within(getFocusTimerSection()).getByText('Escolha um item da agenda para iniciar.'),
    ).toBeInTheDocument()
    expect(getFocusSelectButton('Write the report')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeInTheDocument()
  })
})

describe('App integration: completing or removing the selected item during active sessions', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 1, 9, 0, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('completing the selected item while paused clears the focus without completing or restarting the timer', () => {
    render(<App />)

    addItemByButton('Write the report')
    selectFocusItem('Write the report')
    act(() => clickTimerPrimaryButton())
    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    act(() => clickTimerPrimaryButton())

    expect(screen.getByRole('button', { name: 'Continuar' })).toBeInTheDocument()

    fireEvent.click(getCompleteCheckbox('Write the report'))

    expect(
      within(getFocusTimerSection()).getByText('Escolha um item da agenda para iniciar.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeInTheDocument()
    expect(screen.getByLabelText('Tempo restante 24:00')).toBeInTheDocument()

    act(() => clickTimerPrimaryButton())
    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument()
    expect(screen.getByLabelText('Tempo restante 23:00')).toBeInTheDocument()
  })

  it('removing the selected item while running clears the focus and keeps the timer running safely', () => {
    render(<App />)

    addItemByButton('Write the report')
    selectFocusItem('Write the report')
    act(() => clickTimerPrimaryButton())
    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    fireEvent.click(getRemoveButton('Write the report'))
    fireEvent.click(getConfirmRemoveButton())

    expect(screen.queryByText('Write the report')).not.toBeInTheDocument()
    expect(
      within(getFocusTimerSection()).getByText('Escolha um item da agenda para iniciar.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument()
    expect(screen.getByLabelText('Tempo restante 24:00')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    expect(screen.getByLabelText('Tempo restante 23:00')).toBeInTheDocument()
  })

  it('removing the selected item while paused clears the focus and preserves the paused time and safe controls', () => {
    render(<App />)

    addItemByButton('Write the report')
    selectFocusItem('Write the report')
    act(() => clickTimerPrimaryButton())
    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    act(() => clickTimerPrimaryButton())

    fireEvent.click(getRemoveButton('Write the report'))
    fireEvent.click(getConfirmRemoveButton())

    expect(screen.queryByText('Write the report')).not.toBeInTheDocument()
    expect(
      within(getFocusTimerSection()).getByText('Escolha um item da agenda para iniciar.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeInTheDocument()
    expect(screen.getByLabelText('Tempo restante 24:00')).toBeInTheDocument()

    act(() => clickTimerPrimaryButton())
    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    expect(screen.getByLabelText('Tempo restante 23:00')).toBeInTheDocument()
  })
})

describe('App integration: natural completion and reset', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 1, 9, 0, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('reaching natural completion does not complete the agenda item, preserves the selection, and allows switching to a new item and starting a new session', () => {
    render(<App />)

    addItemByButton('Write the report')
    addItemByButton('Plan the day')
    selectFocusItem('Write the report')
    act(() => clickTimerPrimaryButton())
    act(() => {
      vi.advanceTimersByTime(25 * 60 * 1000)
    })

    expect(screen.getByRole('button', { name: 'Iniciar novamente' })).toBeInTheDocument()
    expect(screen.getByText('Sessão concluída')).toBeInTheDocument()
    expect(getCompleteCheckbox('Write the report')).not.toBeChecked()
    expect(within(getFocusTimerSection()).getByText('Write the report')).toBeInTheDocument()

    selectFocusItem('Plan the day')
    expect(within(getFocusTimerSection()).getByText('Plan the day')).toBeInTheDocument()

    act(() => clickTimerPrimaryButton())
    expect(screen.getByLabelText('Tempo restante 25:00')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    expect(screen.getByLabelText('Tempo restante 24:00')).toBeInTheDocument()
  })

  it('resetting while paused returns to idle at 25:00, keeps the selection, and unlocks switching and unlinking', () => {
    render(<App />)

    addItemByButton('Write the report')
    addItemByButton('Plan the day')
    selectFocusItem('Write the report')
    act(() => clickTimerPrimaryButton())
    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    act(() => clickTimerPrimaryButton())

    expect(screen.getByRole('button', { name: 'Continuar' })).toBeInTheDocument()

    act(() => clickTimerReset())

    expect(screen.getByLabelText('Tempo restante 25:00')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Iniciar' })).toBeInTheDocument()
    expect(within(getFocusTimerSection()).getByText('Write the report')).toBeInTheDocument()

    selectFocusItem('Plan the day')
    expect(within(getFocusTimerSection()).getByText('Plan the day')).toBeInTheDocument()

    fireEvent.click(getUnlinkButton())
    expect(
      within(getFocusTimerSection()).getByText('Escolha um item da agenda para iniciar.'),
    ).toBeInTheDocument()
  })
})

describe('App integration: long titles', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 1, 9, 0, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('keeps a long title correctly displayed in the focus timer region and unmodified in persisted storage', () => {
    render(<App />)

    const longTitle = 'B'.repeat(200)
    addItemByButton(longTitle)
    selectFocusItem(longTitle)

    expect(within(getFocusTimerSection()).getByText(longTitle)).toBeInTheDocument()

    const raw = window.localStorage.getItem(AGENDA_STORAGE_KEY)
    expect(raw).not.toBeNull()
    const persisted = JSON.parse(raw as string) as { items: { title: string }[] }
    expect(persisted.items[0].title).toBe(longTitle)
  })
})

describe('App integration: multiday persistence and remount', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 1, 9, 0, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('persists items across multiple days without ever persisting a selection field, and remount starts unselected', () => {
    const { unmount } = render(<App />)

    addItemByButton('Today item')
    fireEvent.click(screen.getByRole('button', { name: 'Próximo dia' }))
    addItemByButton('Tomorrow item')
    selectFocusItem('Tomorrow item')
    expect(within(getFocusTimerSection()).getByText('Tomorrow item')).toBeInTheDocument()

    unmount()

    const raw = window.localStorage.getItem(AGENDA_STORAGE_KEY)
    expect(raw).not.toBeNull()
    const rawText = (raw as string).toLowerCase()
    expect(rawText).not.toContain('select')
    expect(rawText).not.toContain('focus')
    expect(rawText).not.toContain('pomodoro')

    render(<App />)

    expect(screen.getByText('Today item')).toBeInTheDocument()
    expect(
      within(getFocusTimerSection()).getByText('Escolha um item da agenda para iniciar.'),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Próximo dia' }))

    expect(screen.getByText('Tomorrow item')).toBeInTheDocument()
    expect(
      within(getFocusTimerSection()).getByText('Escolha um item da agenda para iniciar.'),
    ).toBeInTheDocument()
    expect(getFocusSelectButton('Tomorrow item')).toHaveAttribute('aria-pressed', 'false')
  })
})
