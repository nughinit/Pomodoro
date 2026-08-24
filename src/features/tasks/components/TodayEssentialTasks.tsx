import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useEssentialTasks } from '../hooks/useEssentialTasks'
import { MAX_ESSENTIAL_TASKS } from '../domain/types'
import './TodayEssentialTasks.css'

const LIMIT_MESSAGE = 'Você atingiu o limite de quatro tarefas essenciais para hoje.'
const EMPTY_TITLE_MESSAGE = 'Digite um título para adicionar a tarefa.'

export function TodayEssentialTasks() {
  const { tasks, addTask, completedCount, isLimitReached } = useEssentialTasks()
  const [title, setTitle] = useState('')
  const [feedback, setFeedback] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const feedbackRef = useRef<HTMLParagraphElement>(null)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const outcome = addTask(title)

    if (outcome === 'added') {
      setFeedback('')
      setTitle('')

      if (tasks.length + 1 >= MAX_ESSENTIAL_TASKS) {
        feedbackRef.current?.focus()
      } else {
        inputRef.current?.focus()
      }
      return
    }

    if (outcome === 'empty-title') {
      setFeedback(EMPTY_TITLE_MESSAGE)
    }
  }

  const feedbackMessage = isLimitReached ? LIMIT_MESSAGE : feedback

  return (
    <section className="today-tasks" aria-labelledby="today-tasks-heading">
      <h2 id="today-tasks-heading" className="today-tasks__title">
        Hoje
      </h2>

      <div className="today-tasks__card">
        <h3 className="today-tasks__subtitle">Tarefas essenciais</h3>
        <p className="today-tasks__hint">Escolha até quatro tarefas essenciais para hoje.</p>
        <p className="today-tasks__progress">
          {completedCount} de {MAX_ESSENTIAL_TASKS} tarefas concluídas
        </p>

        {tasks.length === 0 ? (
          <p className="today-tasks__empty">
            Nenhuma tarefa essencial ainda. Adicione a primeira tarefa abaixo para planejar o seu dia.
          </p>
        ) : (
          <ul className="today-tasks__list">
            {tasks.map((task) => (
              <li key={task.id} className="today-tasks__item">
                {task.title}
              </li>
            ))}
          </ul>
        )}

        <form
          className="today-tasks__form"
          aria-label="Adicionar tarefa essencial"
          onSubmit={handleSubmit}
          noValidate
        >
          <label htmlFor="today-task-title" className="today-tasks__label">
            Nova tarefa essencial
          </label>
          <div className="today-tasks__field">
            <input
              id="today-task-title"
              ref={inputRef}
              className="today-tasks__input"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={isLimitReached}
              aria-describedby="today-task-feedback"
            />
            <button type="submit" className="today-tasks__submit" disabled={isLimitReached}>
              Adicionar
            </button>
          </div>
          <p
            id="today-task-feedback"
            ref={feedbackRef}
            role="status"
            tabIndex={-1}
            className="today-tasks__feedback"
          >
            {feedbackMessage}
          </p>
        </form>
      </div>
    </section>
  )
}
