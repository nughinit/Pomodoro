import './App.css'
import { TodayEssentialTasks } from './features/tasks/components/TodayEssentialTasks'
import { useEssentialTasks } from './features/tasks/hooks/useEssentialTasks'
import { FocusTimer } from './features/timer/components/FocusTimer'
import { useFocusTimer } from './features/timer/hooks/useFocusTimer'
import { useFocusTaskSelection } from './features/focus/hooks/useFocusTaskSelection'

function App() {
  const tasks = useEssentialTasks()
  const timer = useFocusTimer()
  useFocusTaskSelection(tasks.tasks, timer.state.status)

  return (
    <main className="app-shell">
      <div className="app-shell__card">
        <h1 className="app-shell__title">VIA</h1>
        <p className="app-shell__tagline">Do plano ao feito, no seu ritmo.</p>
      </div>
      <TodayEssentialTasks
        tasks={tasks.tasks}
        addTask={tasks.addTask}
        completeTask={tasks.completeTask}
        reopenTask={tasks.reopenTask}
        removeTask={tasks.removeTask}
        completedCount={tasks.completedCount}
        isLimitReached={tasks.isLimitReached}
      />
      <FocusTimer
        state={timer.state}
        remainingMs={timer.remainingMs}
        handleStart={timer.handleStart}
        handlePause={timer.handlePause}
        handleResume={timer.handleResume}
        handleReset={timer.handleReset}
      />
    </main>
  )
}

export default App
