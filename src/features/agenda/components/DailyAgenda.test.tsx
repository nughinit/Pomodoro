import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DailyAgenda } from './DailyAgenda'
import { parseOptionalDurationField, parseOptionalTimeField } from './agendaFieldParsing'
import { useAgendaItems } from '../hooks/useAgendaItems'
import { useFocusTaskSelection } from '../../focus/hooks/useFocusTaskSelection'
import type { AgendaItem } from '../domain/types'
import { AGENDA_STORAGE_KEY } from '../storage/agendaStorage'
import { ESSENTIAL_TASKS_STORAGE_KEY } from '../../tasks/storage/essentialTasksStorage'

function Harness() {
  const agenda = useAgendaItems()
  const selection = useFocusTaskSelection(agenda.selectedDateItems, 'idle')

  return (
    <DailyAgenda
      selectedDate={agenda.selectedDate}
      selectedDateItems={agenda.selectedDateItems}
      selectDate={agenda.selectDate}
      addItem={agenda.addItem}
      completeItem={agenda.completeItem}
      reopenItem={agenda.reopenItem}
      removeItem={agenda.removeItem}
      selectedItemId={selection.selectedTaskId}
      selectItem={selection.selectTask}
      canChangeSelection={selection.canChangeSelection}
    />
  )
}

function addItemByButton(title: string) {
  fireEvent.change(screen.getByLabelText('Novo item'), { target: { value: title } })
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }))
}

function getFocusSelectButton(title: string) {
  return screen.getByRole('button', { name: `Selecionar item "${title}" para foco` })
}

function getFocusSelectedButton(title: string) {
  return screen.getByRole('button', { name: `Item "${title}" selecionado para foco` })
}

function getRemoveButton(title: string) {
  return screen.getByRole('button', { name: `Remover item "${title}"` })
}

function getCompleteCheckbox(title: string) {
  return screen.getByRole('checkbox', { name: `Concluir item "${title}"` })
}

function getReopenCheckbox(title: string) {
  return screen.getByRole('checkbox', { name: `Reabrir item "${title}"` })
}

function goToPreviousDay() {
  fireEvent.click(screen.getByRole('button', { name: 'Dia anterior' }))
}

function goToNextDay() {
  fireEvent.click(screen.getByRole('button', { name: 'Próximo dia' }))
}

function goToToday() {
  fireEvent.click(screen.getByRole('button', { name: 'Hoje' }))
}

function getTimeInput() {
  return screen.getByLabelText('Horário')
}

function getDurationInput() {
  return screen.getByLabelText('Duração (minutos)')
}

function submitItem(fields: { title?: string; time?: string; duration?: string } = {}) {
  if (fields.title !== undefined) {
    fireEvent.change(screen.getByLabelText('Novo item'), { target: { value: fields.title } })
  }
  if (fields.time !== undefined) {
    fireEvent.change(getTimeInput(), { target: { value: fields.time } })
  }
  if (fields.duration !== undefined) {
    fireEvent.change(getDurationInput(), { target: { value: fields.duration } })
  }
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }))
}

interface FakeStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

function createFakeStorage(): FakeStorage {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
  }
}

function StorageHarness({ storage, now }: { storage: FakeStorage; now: () => Date }) {
  const agenda = useAgendaItems({ storage, now })
  const selection = useFocusTaskSelection(agenda.selectedDateItems, 'idle')

  return (
    <DailyAgenda
      selectedDate={agenda.selectedDate}
      selectedDateItems={agenda.selectedDateItems}
      selectDate={agenda.selectDate}
      addItem={agenda.addItem}
      completeItem={agenda.completeItem}
      reopenItem={agenda.reopenItem}
      removeItem={agenda.removeItem}
      selectedItemId={selection.selectedTaskId}
      selectItem={selection.selectTask}
      canChangeSelection={selection.canChangeSelection}
    />
  )
}

function readPersistedItems(storage: FakeStorage): AgendaItem[] {
  const raw = storage.getItem(AGENDA_STORAGE_KEY)
  if (raw === null) return []
  return (JSON.parse(raw) as { items: AgendaItem[] }).items
}

describe('DailyAgenda', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 24, 9, 0, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows "Hoje" as the heading and a readable current date', () => {
    render(<Harness />)

    expect(screen.getByRole('heading', { level: 2, name: 'Hoje' })).toBeInTheDocument()
    expect(screen.getByText('24 de agosto de 2026')).toBeInTheDocument()
  })

  it('navigates to the previous day and shows a non-"Hoje" heading with a readable date', () => {
    render(<Harness />)

    goToPreviousDay()

    expect(screen.queryByRole('heading', { level: 2, name: 'Hoje' })).not.toBeInTheDocument()
    expect(screen.getByText('23 de agosto de 2026', { selector: '.daily-agenda__date' })).toBeInTheDocument()
  })

  it('navigates forward and back to today repeatedly', () => {
    render(<Harness />)

    goToNextDay()
    goToNextDay()
    expect(screen.getByText('26 de agosto de 2026', { selector: '.daily-agenda__date' })).toBeInTheDocument()

    goToPreviousDay()
    expect(screen.getByText('25 de agosto de 2026', { selector: '.daily-agenda__date' })).toBeInTheDocument()

    goToToday()
    expect(screen.getByRole('heading', { level: 2, name: 'Hoje' })).toBeInTheDocument()
  })

  it('navigates across a month boundary', () => {
    vi.setSystemTime(new Date(2026, 7, 31, 9, 0, 0))
    render(<Harness />)

    goToNextDay()

    expect(screen.getByText('1 de setembro de 2026', { selector: '.daily-agenda__date' })).toBeInTheDocument()
  })

  it('navigates across a year boundary', () => {
    vi.setSystemTime(new Date(2026, 11, 31, 9, 0, 0))
    render(<Harness />)

    goToNextDay()

    expect(screen.getByText('1 de janeiro de 2027', { selector: '.daily-agenda__date' })).toBeInTheDocument()
  })

  it('creates an item on the currently selected date, not necessarily today', () => {
    render(<Harness />)

    goToNextDay()
    addItemByButton('Plan tomorrow')

    expect(screen.getByText('Plan tomorrow')).toBeInTheDocument()

    goToPreviousDay()
    expect(screen.queryByText('Plan tomorrow')).not.toBeInTheDocument()

    goToNextDay()
    expect(screen.getByText('Plan tomorrow')).toBeInTheDocument()
  })

  it('keeps items from multiple days after switching between them', () => {
    render(<Harness />)

    addItemByButton('Today item')
    goToNextDay()
    addItemByButton('Tomorrow item')

    expect(screen.getByText('Tomorrow item')).toBeInTheDocument()
    expect(screen.queryByText('Today item')).not.toBeInTheDocument()

    goToPreviousDay()
    expect(screen.getByText('Today item')).toBeInTheDocument()
    expect(screen.queryByText('Tomorrow item')).not.toBeInTheDocument()
  })

  it('renders items in the order already provided (time-first) by selectedDateItems, without re-sorting', () => {
    const orderedItems: AgendaItem[] = [
      { id: 'a2', title: 'Timed item', status: 'pending', localDate: '2026-08-24', startTime: '09:00', durationMinutes: null },
      { id: 'a1', title: 'No time item', status: 'pending', localDate: '2026-08-24', startTime: null, durationMinutes: null },
    ]

    render(
      <DailyAgenda
        selectedDate="2026-08-24"
        selectedDateItems={orderedItems}
        selectDate={() => {}}
        addItem={() => 'added'}
        completeItem={() => {}}
        reopenItem={() => {}}
        removeItem={() => {}}
        selectedItemId={null}
        selectItem={() => {}}
        canChangeSelection
      />,
    )

    const listItems = screen.getAllByRole('listitem')
    expect(within(listItems[0]).getByText('Timed item')).toBeInTheDocument()
    expect(within(listItems[1]).getByText('No time item')).toBeInTheDocument()
  })

  it('shows "Sem horário" for an item without a start time', () => {
    render(<Harness />)

    addItemByButton('No time item')

    expect(screen.getByText('Sem horário')).toBeInTheDocument()
  })

  it('completes and reopens an item', () => {
    render(<Harness />)

    addItemByButton('Write the report')
    fireEvent.click(getCompleteCheckbox('Write the report'))

    expect(getReopenCheckbox('Write the report')).toBeChecked()

    fireEvent.click(getReopenCheckbox('Write the report'))

    expect(getCompleteCheckbox('Write the report')).not.toBeChecked()
  })

  it('requires confirmation before removing an item', () => {
    render(<Harness />)

    addItemByButton('Write the report')
    fireEvent.click(getRemoveButton('Write the report'))

    expect(screen.getByRole('button', { name: 'Confirmar remoção' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar remoção' }))

    expect(screen.queryByText('Write the report')).not.toBeInTheDocument()
  })

  it('closes an open remove confirmation when the selected date changes', () => {
    render(<Harness />)

    addItemByButton('Write the report')
    fireEvent.click(getRemoveButton('Write the report'))
    expect(screen.getByRole('button', { name: 'Confirmar remoção' })).toBeInTheDocument()

    goToNextDay()
    expect(screen.queryByRole('button', { name: 'Confirmar remoção' })).not.toBeInTheDocument()

    goToPreviousDay()
    expect(screen.getByText('Write the report')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Confirmar remoção' })).not.toBeInTheDocument()
  })

  it('regression: closes the confirmation even when the new day contains an item with the same id', () => {
    const dayOneItems: AgendaItem[] = [
      { id: 'agenda-item-1', title: 'Today item', status: 'pending', localDate: '2026-08-24', startTime: null, durationMinutes: null },
    ]
    const dayTwoItems: AgendaItem[] = [
      { id: 'agenda-item-1', title: 'Tomorrow item', status: 'pending', localDate: '2026-08-25', startTime: null, durationMinutes: null },
    ]
    const noop = () => 'added' as const

    const { rerender } = render(
      <DailyAgenda
        selectedDate="2026-08-24"
        selectedDateItems={dayOneItems}
        selectDate={() => {}}
        addItem={noop}
        completeItem={() => {}}
        reopenItem={() => {}}
        removeItem={() => {}}
        selectedItemId={null}
        selectItem={() => {}}
        canChangeSelection
      />,
    )

    fireEvent.click(getRemoveButton('Today item'))
    expect(screen.getByRole('button', { name: 'Confirmar remoção' })).toBeInTheDocument()

    rerender(
      <DailyAgenda
        selectedDate="2026-08-25"
        selectedDateItems={dayTwoItems}
        selectDate={() => {}}
        addItem={noop}
        completeItem={() => {}}
        reopenItem={() => {}}
        removeItem={() => {}}
        selectedItemId={null}
        selectItem={() => {}}
        canChangeSelection
      />,
    )

    expect(screen.queryByRole('button', { name: 'Confirmar remoção' })).not.toBeInTheDocument()
    expect(screen.getByText('Tomorrow item')).toBeInTheDocument()
  })

  it('only offers focus selection for pending items', () => {
    render(<Harness />)

    addItemByButton('Write the report')
    fireEvent.click(getCompleteCheckbox('Write the report'))

    expect(screen.queryByRole('button', { name: 'Selecionar item "Write the report" para foco' })).not.toBeInTheDocument()
  })

  it('clears the selection when the selected item is completed', () => {
    render(<Harness />)

    addItemByButton('Write the report')
    fireEvent.click(getFocusSelectButton('Write the report'))
    expect(getFocusSelectedButton('Write the report')).toBeInTheDocument()

    fireEvent.click(getCompleteCheckbox('Write the report'))

    expect(screen.queryByRole('button', { name: 'Item "Write the report" selecionado para foco' })).not.toBeInTheDocument()
  })

  it('clears the selection when the selected item is removed', () => {
    render(<Harness />)

    addItemByButton('Write the report')
    fireEvent.click(getFocusSelectButton('Write the report'))
    expect(getFocusSelectedButton('Write the report')).toBeInTheDocument()

    fireEvent.click(getRemoveButton('Write the report'))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar remoção' }))

    expect(screen.queryByText('Write the report')).not.toBeInTheDocument()
  })

  it('permanently clears the selection after changing date and back', () => {
    render(<Harness />)

    addItemByButton('Write the report')
    fireEvent.click(getFocusSelectButton('Write the report'))
    expect(getFocusSelectedButton('Write the report')).toBeInTheDocument()

    goToNextDay()
    goToPreviousDay()

    expect(screen.getByText('Write the report')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Item "Write the report" selecionado para foco' })).not.toBeInTheDocument()
    expect(getFocusSelectButton('Write the report')).toHaveAttribute('aria-pressed', 'false')
  })

  it('shows an accessible feedback message when submitting an empty title', () => {
    render(<Harness />)

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }))

    expect(screen.getByRole('status')).toHaveTextContent('Digite um título para adicionar o item.')
  })

  it('reports an empty day', () => {
    render(<Harness />)

    expect(screen.getByText('Nenhum item para este dia.')).toBeInTheDocument()
  })

  it('renders a long title without breaking the layout structure', () => {
    render(<Harness />)

    const longTitle = 'A'.repeat(200)
    addItemByButton(longTitle)

    const titleElement = screen.getByText(longTitle)
    expect(titleElement).toHaveClass('daily-agenda__item-title')
  })

  it('shows the legacy migration without erasing the essential-tasks record', () => {
    const storage = new Map<string, string>()
    const fakeStorage = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value)
      },
    }
    fakeStorage.setItem(
      ESSENTIAL_TASKS_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        localDate: '2026-08-24',
        tasks: [{ id: 'essential-task-1', title: 'Legacy task', status: 'pending' }],
      }),
    )

    function MigrationHarness() {
      const agenda = useAgendaItems({ storage: fakeStorage, now: () => new Date(2026, 7, 24) })
      return (
        <DailyAgenda
          selectedDate={agenda.selectedDate}
          selectedDateItems={agenda.selectedDateItems}
          selectDate={agenda.selectDate}
          addItem={agenda.addItem}
          completeItem={agenda.completeItem}
          reopenItem={agenda.reopenItem}
          removeItem={agenda.removeItem}
          selectedItemId={null}
          selectItem={() => {}}
          canChangeSelection
        />
      )
    }

    render(<MigrationHarness />)

    expect(screen.getByText('Legacy task')).toBeInTheDocument()
    expect(fakeStorage.getItem(ESSENTIAL_TASKS_STORAGE_KEY)).not.toBeNull()
    expect(fakeStorage.getItem(AGENDA_STORAGE_KEY)).not.toBeNull()
  })

  it('keeps working in memory when localStorage access throws', () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage')

    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('localStorage disabled')
      },
    })

    try {
      render(<Harness />)

      submitItem({ title: 'Write the report', time: '09:00', duration: '30' })
      expect(screen.getByText('Write the report')).toBeInTheDocument()
      expect(screen.getByText('09:00–09:30 · 30 min')).toBeInTheDocument()

      fireEvent.click(getFocusSelectButton('Write the report'))
      expect(getFocusSelectedButton('Write the report')).toBeInTheDocument()

      fireEvent.click(getCompleteCheckbox('Write the report'))
      expect(getReopenCheckbox('Write the report')).toBeChecked()

      fireEvent.click(getRemoveButton('Write the report'))
      fireEvent.click(screen.getByRole('button', { name: 'Confirmar remoção' }))
      expect(screen.queryByText('Write the report')).not.toBeInTheDocument()
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(window, 'localStorage', originalDescriptor)
      }
    }
  })
})

describe('DailyAgenda time and duration fields', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 24, 9, 0, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('creates an item with only the required title, sending null for time and duration', () => {
    const storage = createFakeStorage()
    render(<StorageHarness storage={storage} now={() => new Date(2026, 7, 24)} />)

    submitItem({ title: 'Write the report' })

    expect(screen.getByText('Write the report')).toBeInTheDocument()
    expect(screen.getByText('Sem horário')).toBeInTheDocument()

    const persisted = readPersistedItems(storage)
    expect(persisted).toHaveLength(1)
    expect(persisted[0].startTime).toBeNull()
    expect(persisted[0].durationMinutes).toBeNull()
  })

  it('creates an item with a start time and no duration', () => {
    render(<Harness />)

    submitItem({ title: 'Standup', time: '09:00' })

    expect(screen.getByText('Standup')).toBeInTheDocument()
    expect(screen.getByText('09:00')).toBeInTheDocument()
  })

  it('creates an item with a duration and no start time', () => {
    render(<Harness />)

    submitItem({ title: 'Deep work', duration: '45' })

    expect(screen.getByText('Deep work')).toBeInTheDocument()
    expect(screen.getByText('Sem horário · 45 min')).toBeInTheDocument()
  })

  it('creates an item with both a start time and a duration', () => {
    const storage = createFakeStorage()
    render(<StorageHarness storage={storage} now={() => new Date(2026, 7, 24)} />)

    submitItem({ title: 'Write the report', time: '09:00', duration: '30' })

    expect(screen.getByText('09:00–09:30 · 30 min')).toBeInTheDocument()

    const persisted = readPersistedItems(storage)
    expect(persisted[0]).toEqual({
      id: 'agenda-item-1',
      title: 'Write the report',
      status: 'pending',
      localDate: '2026-08-24',
      startTime: '09:00',
      durationMinutes: 30,
    })
    expect(Object.keys(persisted[0])).not.toContain('endTime')
  })

  it('does not create an item and shows an accessible error when addItem reports an invalid time', () => {
    const addItem = vi.fn(() => 'invalid-time' as const)

    render(
      <DailyAgenda
        selectedDate="2026-08-24"
        selectedDateItems={[]}
        selectDate={() => {}}
        addItem={addItem}
        completeItem={() => {}}
        reopenItem={() => {}}
        removeItem={() => {}}
        selectedItemId={null}
        selectItem={() => {}}
        canChangeSelection
      />,
    )

    submitItem({ title: 'Write the report', time: '09:00' })

    expect(addItem).toHaveBeenCalledWith({
      title: 'Write the report',
      startTime: '09:00',
      durationMinutes: null,
    })
    expect(screen.queryByText('Write the report')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Informe um horário válido no formato HH:mm.')
  })

  it('rejects a duration of zero', () => {
    render(<Harness />)

    submitItem({ title: 'Write the report', duration: '0' })

    expect(screen.queryByText('Write the report')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Informe uma duração válida entre 1 e 1440 minutos.',
    )
  })

  it('rejects a negative duration', () => {
    render(<Harness />)

    submitItem({ title: 'Write the report', duration: '-5' })

    expect(screen.queryByText('Write the report')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Informe uma duração válida entre 1 e 1440 minutos.',
    )
  })

  it('rejects a decimal duration without rounding it', () => {
    const storage = createFakeStorage()
    render(<StorageHarness storage={storage} now={() => new Date(2026, 7, 24)} />)

    submitItem({ title: 'Write the report', duration: '30.5' })

    expect(screen.queryByText('Write the report')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Informe uma duração válida entre 1 e 1440 minutos.',
    )
    expect(readPersistedItems(storage)).toHaveLength(0)
  })

  it('rejects a duration above the maximum without falling back to no duration', () => {
    render(<Harness />)

    submitItem({ title: 'Write the report', duration: '1441' })

    expect(screen.queryByText('Write the report')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Informe uma duração válida entre 1 e 1440 minutos.',
    )
  })

  it('does not create an item and shows an accessible error when addItem reports an invalid duration', () => {
    const addItem = vi.fn(() => 'invalid-duration' as const)

    render(
      <DailyAgenda
        selectedDate="2026-08-24"
        selectedDateItems={[]}
        selectDate={() => {}}
        addItem={addItem}
        completeItem={() => {}}
        reopenItem={() => {}}
        removeItem={() => {}}
        selectedItemId={null}
        selectItem={() => {}}
        canChangeSelection
      />,
    )

    submitItem({ title: 'Write the report', duration: '30' })

    expect(addItem).toHaveBeenCalledWith({
      title: 'Write the report',
      startTime: null,
      durationMinutes: 30,
    })
    expect(screen.queryByText('Write the report')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Informe uma duração válida entre 1 e 1440 minutos.',
    )
  })

  it('preserves the title, time, and duration values after a validation error', () => {
    render(<Harness />)

    submitItem({ title: 'Write the report', time: '09:00', duration: '0' })

    expect(screen.getByLabelText('Novo item')).toHaveValue('Write the report')
    expect(getTimeInput()).toHaveValue('09:00')
    expect(getDurationInput()).toHaveValue(0)
  })

  it('clears title, time, and duration after a successful submission', () => {
    render(<Harness />)

    submitItem({ title: 'Write the report', time: '09:00', duration: '30' })

    expect(screen.getByLabelText('Novo item')).toHaveValue('')
    expect(getTimeInput()).toHaveValue('')
    expect(getDurationInput()).toHaveValue(null)
  })

  it('creates the item on the currently selected date, not necessarily today', () => {
    render(<Harness />)

    goToNextDay()
    submitItem({ title: 'Plan tomorrow', time: '10:00', duration: '15' })

    expect(screen.getByText('10:00–10:15 · 15 min')).toBeInTheDocument()

    goToPreviousDay()
    expect(screen.queryByText('Plan tomorrow')).not.toBeInTheDocument()
  })

  it('shows a normal interval such as 09:00-09:30', () => {
    render(<Harness />)

    submitItem({ title: 'Write the report', time: '09:00', duration: '30' })

    expect(screen.getByText('09:00–09:30 · 30 min')).toBeInTheDocument()
  })

  it('shows an interval crossing midnight with a "+1 dia" indicator', () => {
    render(<Harness />)

    submitItem({ title: 'Night shift', time: '23:30', duration: '60' })

    expect(screen.getByText('23:30–00:30 (+1 dia) · 60 min')).toBeInTheDocument()
  })

  it('represents a 1440-minute duration correctly, wrapping to the same time next day', () => {
    render(<Harness />)

    submitItem({ title: 'All day block', time: '00:00', duration: '1440' })

    expect(screen.getByText('00:00–00:00 (+1 dia) · 1440 min')).toBeInTheDocument()
  })
})

describe('parseOptionalTimeField and parseOptionalDurationField', () => {
  it('maps an empty or blank string to null for both fields', () => {
    expect(parseOptionalTimeField('')).toBeNull()
    expect(parseOptionalTimeField('   ')).toBeNull()
    expect(parseOptionalDurationField('')).toBeNull()
    expect(parseOptionalDurationField('   ')).toBeNull()
  })

  it('passes a filled time value through untouched', () => {
    expect(parseOptionalTimeField('09:00')).toBe('09:00')
  })

  it('parses a filled duration value as a number', () => {
    expect(parseOptionalDurationField('30')).toBe(30)
  })

  it('maps a non-numeric duration string to NaN, matching what real typed input would never bypass the domain with', () => {
    expect(parseOptionalDurationField('abc')).toBeNaN()
  })

  it('does not round a decimal duration', () => {
    expect(parseOptionalDurationField('30.5')).toBe(30.5)
  })
})
