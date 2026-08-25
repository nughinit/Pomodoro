import './App.css'
import { DailyAgenda } from './features/agenda/components/DailyAgenda'
import { useAgendaItems } from './features/agenda/hooks/useAgendaItems'
import { FocusTimer } from './features/timer/components/FocusTimer'
import { useFocusTimer } from './features/timer/hooks/useFocusTimer'
import { useFocusTaskSelection } from './features/focus/hooks/useFocusTaskSelection'

function App() {
  const agenda = useAgendaItems()
  const timer = useFocusTimer()
  const selection = useFocusTaskSelection(agenda.selectedDateItems, timer.state.status)

  return (
    <main className="app-shell">
      <div className="app-shell__card">
        <h1 className="app-shell__title">VIA</h1>
        <p className="app-shell__tagline">Do plano ao feito, no seu ritmo.</p>
      </div>
      <div className="app-shell__workspace">
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
        <FocusTimer
          state={timer.state}
          remainingMs={timer.remainingMs}
          handleStart={timer.handleStart}
          handlePause={timer.handlePause}
          handleResume={timer.handleResume}
          handleReset={timer.handleReset}
          selectedTask={selection.selectedTask}
          clearSelection={selection.clearSelection}
          canChangeSelection={selection.canChangeSelection}
        />
      </div>
    </main>
  )
}

export default App
