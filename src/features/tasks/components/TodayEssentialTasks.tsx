import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useEssentialTasks } from '../hooks/useEssentialTasks'
import { MAX_ESSENTIAL_TASKS } from '../domain/types'
import type { EssentialTask } from '../domain/types'
import './TodayEssentialTasks.css'

const LIMIT_MESSAGE = 'Você atingiu o limite de quatro tarefas essenciais para hoje.'
const EMPTY_TITLE_MESSAGE = 'Digite um título para adicionar a tarefa.'

export function TodayEssentialTasks() {
  const { tasks, addTask, completeTask, reopenTask, removeTask, completedCount, isLimitReached } =
    useEssentialTasks()
  const [title, setTitle] = useState('')
  const [feedback, setFeedback] = useState('')
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const feedbackRef = useRef<HTMLParagraphElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const removeButtonRefs = useRef(new Map<string, HTMLButtonElement | null>())

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

  const handleToggleStatus = (task: EssentialTask) => {
    if (task.status === 'completed') {
      reopenTask(task.id)
    } else {
      completeTask(task.id)
    }
  }

  useEffect(() => {
    if (confirmingId !== null) {
      cancelButtonRef.current?.focus()
    }
  }, [confirmingId])

  const handleRequestRemove = (id: string) => {
    setConfirmingId(id)
  }

  const handleCancelRemove = (id: string) => {
    setConfirmingId(null)
    removeButtonRefs.current.get(id)?.focus()
  }

  const handleConfirmRemove = (id: string) => {
    removeTask(id)
    setConfirmingId(null)

    const remainingCount = tasks.length - 1
    if (remainingCount < MAX_ESSENTIAL_TASKS) {
      inputRef.current?.focus()
    } else {
      headingRef.current?.focus()
    }
  }

  const feedbackMessage = isLimitReached ? LIMIT_MESSAGE : feedback

  return (
    <section className="today-tasks" aria-labelledby="today-tasks-heading">
      <h2 id="today-tasks-heading" ref={headingRef} tabIndex={-1} className="today-tasks__title">
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
            {tasks.map((task) => {
              const isCompleted = task.status === 'completed'
              const isConfirming = confirmingId === task.id
              const questionId = `today-task-confirm-question-${task.id}`

              return (
                <li
                  key={task.id}
                  className={
                    isCompleted
                      ? 'today-tasks__item today-tasks__item--completed'
                      : 'today-tasks__item'
                  }
                >
                  <div className="today-tasks__item-row">
                    <label className="today-tasks__check">
                      <input
                        type="checkbox"
                        className="today-tasks__checkbox"
                        checked={isCompleted}
                        onChange={() => handleToggleStatus(task)}
                        aria-label={
                          isCompleted
                            ? `Reabrir tarefa "${task.title}"`
                            : `Concluir tarefa "${task.title}"`
                        }
                      />
                      <span className="today-tasks__item-title">{task.title}</span>
                    </label>
                    {isCompleted && (
                      <span className="today-tasks__status-badge">Concluída</span>
                    )}
                    <button
                      type="button"
                      className="today-tasks__remove"
                      ref={(element) => {
                        removeButtonRefs.current.set(task.id, element)
                      }}
                      onClick={() => handleRequestRemove(task.id)}
                      aria-label={`Remover tarefa "${task.title}"`}
                    >
                      Remover
                    </button>
                  </div>

                  {isConfirming && (
                    <div
                      className="today-tasks__confirm"
                      role="group"
                      aria-label={`Confirmar remoção da tarefa "${task.title}"`}
                    >
                      <p id={questionId} className="today-tasks__confirm-question">
                        Remover "{task.title}"? Essa ação não pode ser desfeita.
                      </p>
                      <div className="today-tasks__confirm-actions">
                        <button
                          type="button"
                          ref={cancelButtonRef}
                          className="today-tasks__cancel"
                          onClick={() => handleCancelRemove(task.id)}
                          aria-describedby={questionId}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          className="today-tasks__confirm-remove"
                          onClick={() => handleConfirmRemove(task.id)}
                          aria-describedby={questionId}
                        >
                          Confirmar remoção
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
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
