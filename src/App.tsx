import './App.css'
import { FocusTimer } from './features/timer/components/FocusTimer'

function App() {
  return (
    <main className="app-shell">
      <div className="app-shell__card">
        <h1 className="app-shell__title">VIA</h1>
        <p className="app-shell__tagline">Do plano ao feito, no seu ritmo.</p>
      </div>
      <FocusTimer />
    </main>
  )
}

export default App
