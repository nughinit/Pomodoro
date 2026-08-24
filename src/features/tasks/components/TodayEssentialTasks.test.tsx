import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TodayEssentialTasks } from './TodayEssentialTasks'

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
})
