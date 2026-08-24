import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TodayEssentialTasks } from './TodayEssentialTasks'
import { ESSENTIAL_TASKS_STORAGE_KEY, toLocalDateString } from '../storage/essentialTasksStorage'

function getInput() {
  return screen.getByLabelText('Nova tarefa essencial') as HTMLInputElement
}

function getForm() {
  return screen.getByRole('form', { name: 'Adicionar tarefa essencial' })
}

function addTaskByButton(title: string) {
  fireEvent.change(getInput(), { target: { value: title } })
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }))
}

function addTaskByEnter(title: string) {
  fireEvent.change(getInput(), { target: { value: title } })
  fireEvent.submit(getForm())
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

function getCancelButton() {
  return screen.getByRole('button', { name: 'Cancelar' })
}

function getConfirmRemoveButton() {
  return screen.getByRole('button', { name: 'Confirmar remoção' })
}

describe('TodayEssentialTasks', () => {
  it('shows the empty state and no list initially', () => {
    render(<TodayEssentialTasks />)

    expect(screen.getByRole('heading', { name: 'Hoje' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Tarefas essenciais' })).toBeInTheDocument()
    expect(
      screen.getByText('Nenhuma tarefa essencial ainda. Adicione a primeira tarefa abaixo para planejar o seu dia.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.getByText('0 de 4 tarefas concluídas')).toBeInTheDocument()
  })

  it('adds a normalized task when submitting via the button and clears the input', () => {
    render(<TodayEssentialTasks />)

    addTaskByButton('  Write the report  ')

    expect(screen.getByRole('list')).toBeInTheDocument()
    expect(screen.getByRole('listitem')).toHaveTextContent('Write the report')
    expect(getInput()).toHaveValue('')
  })

  it('adds a task when submitting via Enter, using the same handler as the button', () => {
    render(<TodayEssentialTasks />)

    addTaskByEnter('Plan the day')

    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByRole('listitem')).toHaveTextContent('Plan the day')
  })

  it('returns focus to the input after a successful addition', () => {
    render(<TodayEssentialTasks />)

    addTaskByButton('Read a chapter')

    expect(getInput()).toHaveFocus()
  })

  it('does not create a task for an empty title and shows accessible feedback', () => {
    render(<TodayEssentialTasks />)

    addTaskByButton('   ')

    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Digite um título para adicionar a tarefa.')
  })

  it('blocks a fifth task and disables the creation controls once the limit is reached', () => {
    render(<TodayEssentialTasks />)

    addTaskByButton('Task one')
    addTaskByButton('Task two')
    addTaskByButton('Task three')
    addTaskByButton('Task four')

    expect(screen.getAllByRole('listitem')).toHaveLength(4)
    expect(getInput()).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Adicionar' })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Você atingiu o limite de quatro tarefas essenciais para hoje.',
    )

    addTaskByButton('Task five')

    expect(screen.getAllByRole('listitem')).toHaveLength(4)
  })

  it('keeps the progress text derived from completed tasks at zero while none are completed', () => {
    render(<TodayEssentialTasks />)

    addTaskByButton('Task one')
    addTaskByButton('Task two')

    expect(screen.getByText('0 de 4 tarefas concluídas')).toBeInTheDocument()
  })

  it('completes a pending task and reflects the control, visible text, and progress', () => {
    render(<TodayEssentialTasks />)

    addTaskByButton('Write the report')

    fireEvent.click(getCompleteCheckbox('Write the report'))

    expect(getReopenCheckbox('Write the report')).toBeChecked()
    expect(screen.getByText('Concluída')).toBeInTheDocument()
    expect(screen.getByText('1 de 4 tarefas concluídas')).toBeInTheDocument()
  })

  it('reopens a completed task and reflects the progress', () => {
    render(<TodayEssentialTasks />)

    addTaskByButton('Write the report')
    fireEvent.click(getCompleteCheckbox('Write the report'))

    fireEvent.click(getReopenCheckbox('Write the report'))

    expect(getCompleteCheckbox('Write the report')).not.toBeChecked()
    expect(screen.queryByText('Concluída')).not.toBeInTheDocument()
    expect(screen.getByText('0 de 4 tarefas concluídas')).toBeInTheDocument()
  })

  it('requests removal without removing the task immediately', () => {
    render(<TodayEssentialTasks />)

    addTaskByButton('Write the report')

    fireEvent.click(getRemoveButton('Write the report'))

    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(
      screen.getByText('Remover "Write the report"? Essa ação não pode ser desfeita.'),
    ).toBeInTheDocument()
    expect(getCancelButton()).toHaveFocus()
  })

  it('cancels removal, preserving the task and returning focus to its remove button', () => {
    render(<TodayEssentialTasks />)

    addTaskByButton('Write the report')
    fireEvent.click(getRemoveButton('Write the report'))

    fireEvent.click(getCancelButton())

    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument()
    expect(getRemoveButton('Write the report')).toHaveFocus()
  })

  it('confirms removal, removing exactly the chosen task and moving focus to the title input', () => {
    render(<TodayEssentialTasks />)

    addTaskByButton('Write the report')
    addTaskByButton('Plan the day')
    fireEvent.click(getRemoveButton('Write the report'))

    fireEvent.click(getConfirmRemoveButton())

    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(screen.queryByText('Write the report')).not.toBeInTheDocument()
    expect(screen.getByText('Plan the day')).toBeInTheDocument()
    expect(getInput()).toHaveFocus()
  })

  it('keeps only one removal confirmation open at a time', () => {
    render(<TodayEssentialTasks />)

    addTaskByButton('Write the report')
    addTaskByButton('Plan the day')

    fireEvent.click(getRemoveButton('Write the report'))
    expect(
      screen.getByText('Remover "Write the report"? Essa ação não pode ser desfeita.'),
    ).toBeInTheDocument()

    fireEvent.click(getRemoveButton('Plan the day'))

    expect(
      screen.queryByText('Remover "Write the report"? Essa ação não pode ser desfeita.'),
    ).not.toBeInTheDocument()
    expect(
      screen.getByText('Remover "Plan the day"? Essa ação não pode ser desfeita.'),
    ).toBeInTheDocument()
  })

  it('removing a completed task updates the progress', () => {
    render(<TodayEssentialTasks />)

    addTaskByButton('Write the report')
    fireEvent.click(getCompleteCheckbox('Write the report'))
    expect(screen.getByText('1 de 4 tarefas concluídas')).toBeInTheDocument()

    fireEvent.click(getRemoveButton('Write the report'))
    fireEvent.click(getConfirmRemoveButton())

    expect(screen.getByText('0 de 4 tarefas concluídas')).toBeInTheDocument()
  })

  it('re-enables the creation controls after removing one of four tasks and allows adding a new one', () => {
    render(<TodayEssentialTasks />)

    addTaskByButton('Task one')
    addTaskByButton('Task two')
    addTaskByButton('Task three')
    addTaskByButton('Task four')

    expect(getInput()).toBeDisabled()

    fireEvent.click(getRemoveButton('Task two'))
    fireEvent.click(getConfirmRemoveButton())

    expect(getInput()).not.toBeDisabled()
    expect(screen.getByRole('button', { name: 'Adicionar' })).not.toBeDisabled()
    expect(screen.queryByText('Você atingiu o limite de quatro tarefas essenciais para hoje.')).not.toBeInTheDocument()

    addTaskByButton('Task five')

    expect(screen.getAllByRole('listitem')).toHaveLength(4)
    expect(screen.getByText('Task five')).toBeInTheDocument()
  })

  it('re-enables and focuses the title input after removing one of four tasks (regression)', () => {
    render(<TodayEssentialTasks />)

    addTaskByButton('Task one')
    addTaskByButton('Task two')
    addTaskByButton('Task three')
    addTaskByButton('Task four')

    expect(getInput()).toBeDisabled()

    fireEvent.click(getRemoveButton('Task two'))
    fireEvent.click(getConfirmRemoveButton())

    expect(getInput()).not.toBeDisabled()
    expect(getInput()).toHaveFocus()
  })

  it('shows the empty state again after removing the last task', () => {
    render(<TodayEssentialTasks />)

    addTaskByButton('Only task')
    fireEvent.click(getRemoveButton('Only task'))
    fireEvent.click(getConfirmRemoveButton())

    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(
      screen.getByText('Nenhuma tarefa essencial ainda. Adicione a primeira tarefa abaixo para planejar o seu dia.'),
    ).toBeInTheDocument()
  })

  it('gives every task control an accessible name that includes the task title', () => {
    render(<TodayEssentialTasks />)

    addTaskByButton('Write the report')

    expect(screen.getByRole('checkbox', { name: 'Concluir tarefa "Write the report"' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remover tarefa "Write the report"' })).toBeInTheDocument()
  })
})

describe('TodayEssentialTasks persistence', () => {
  it('hydrates today tasks from localStorage on first render', () => {
    const today = toLocalDateString(new Date())
    window.localStorage.setItem(
      ESSENTIAL_TASKS_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        localDate: today,
        tasks: [{ id: 'essential-task-1', title: 'Recovered task', status: 'completed' }],
      }),
    )

    render(<TodayEssentialTasks />)

    expect(screen.getByText('Recovered task')).toBeInTheDocument()
    expect(getReopenCheckbox('Recovered task')).toBeChecked()
    expect(screen.getByText('1 de 4 tarefas concluídas')).toBeInTheDocument()
  })

  it('recovers titles and statuses on a remount that simulates reopening the app', () => {
    const { unmount } = render(<TodayEssentialTasks />)

    addTaskByButton('Write the report')
    fireEvent.click(getCompleteCheckbox('Write the report'))
    unmount()

    render(<TodayEssentialTasks />)

    expect(screen.getByText('Write the report')).toBeInTheDocument()
    expect(getReopenCheckbox('Write the report')).toBeChecked()
  })

  it('regression: clears a pending removal confirmation when its task disappears on a local day change instead of reattaching to a reused id', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 24, 23, 59, 0))

    try {
      render(<TodayEssentialTasks />)

      addTaskByButton('Write the report')
      fireEvent.click(getRemoveButton('Write the report'))
      expect(
        screen.getByText('Remover "Write the report"? Essa ação não pode ser desfeita.'),
      ).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(2 * 60 * 1000)
      })

      expect(screen.queryByText('Write the report')).not.toBeInTheDocument()

      addTaskByButton('New day task')

      expect(screen.queryByText(/Essa ação não pode ser desfeita/)).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('regression: clears a pending removal confirmation across a local day change even when the new day hydrates a task reusing the same id', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 24, 23, 59, 0))

    try {
      window.localStorage.setItem(
        ESSENTIAL_TASKS_STORAGE_KEY,
        JSON.stringify({
          version: 1,
          localDate: '2026-08-24',
          tasks: [{ id: 'essential-task-1', title: 'Old day task', status: 'pending' }],
        }),
      )

      render(<TodayEssentialTasks />)
      expect(screen.getByText('Old day task')).toBeInTheDocument()

      fireEvent.click(getRemoveButton('Old day task'))
      expect(
        screen.getByText('Remover "Old day task"? Essa ação não pode ser desfeita.'),
      ).toBeInTheDocument()

      window.localStorage.setItem(
        ESSENTIAL_TASKS_STORAGE_KEY,
        JSON.stringify({
          version: 1,
          localDate: '2026-08-25',
          tasks: [{ id: 'essential-task-1', title: 'New day task', status: 'pending' }],
        }),
      )
      const setItemSpy = vi.spyOn(window.localStorage, 'setItem')

      act(() => {
        vi.advanceTimersByTime(2 * 60 * 1000)
      })

      expect(screen.getByText('New day task')).toBeInTheDocument()
      expect(screen.queryByText(/Essa ação não pode ser desfeita/)).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Confirmar remoção' })).not.toBeInTheDocument()
      expect(setItemSpy).not.toHaveBeenCalled()

      expect(JSON.parse(window.localStorage.getItem(ESSENTIAL_TASKS_STORAGE_KEY)!)).toEqual({
        version: 1,
        localDate: '2026-08-25',
        tasks: [{ id: 'essential-task-1', title: 'New day task', status: 'pending' }],
      })

      setItemSpy.mockRestore()
    } finally {
      vi.useRealTimers()
    }
  })
})
