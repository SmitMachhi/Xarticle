import { useState, useRef } from 'react'

const TIMEOUT_MS = 5000
const LABEL_S = 25

export default function TimeoutBar() {
  const [running, setRunning] = useState(false)
  const [pct, setPct] = useState(0)
  const [aborted, setAborted] = useState(false)
  const [succeeded, setSucceeded] = useState(false)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number>(0)
  const abortRef = useRef(false)

  const start = () => {
    if (running) return
    setRunning(true)
    setAborted(false)
    setSucceeded(false)
    setPct(0)
    abortRef.current = false
    startRef.current = Date.now()

    const tick = () => {
      const elapsed = Date.now() - startRef.current
      const p = Math.min(elapsed / TIMEOUT_MS, 1)
      setPct(p)
      if (p >= 1) {
        setAborted(true)
        setRunning(false)
        return
      }
      if (!abortRef.current) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  const simulateSuccess = () => {
    if (!running) return
    abortRef.current = true
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    setSucceeded(true)
    setRunning(false)
  }

  const reset = () => { setRunning(false); setPct(0); setAborted(false); setSucceeded(false) }

  const color = aborted ? '#dc2626' : succeeded ? '#16a34a' : pct > 0.75 ? '#d97706' : '#3b82f6'

  return (
    <div className="visual-wrap">
      <p className="visual-label">25-Second Timeout (simulated at 5s speed)</p>
      <div className="timeout-track">
        <div className="timeout-fill" style={{ width: `${pct * 100}%`, background: color, transition: 'background 0.3s' }} />
      </div>
      <div className="timeout-labels">
        <span style={{ color }}>
          {aborted ? '✗ AbortError — request timed out' : succeeded ? '✓ Response received!' : running ? `${Math.round(pct * LABEL_S)}s / ${LABEL_S}s…` : 'Press Start'}
        </span>
        <span className="timeout-max">{LABEL_S}s limit</span>
      </div>
      <div className="sim-actions">
        <button className="visual-btn" onClick={start} disabled={running}>▶ Start Request</button>
        {running && <button className="visual-btn visual-btn--success" onClick={simulateSuccess}>✓ Simulate Success</button>}
        {(aborted || succeeded) && <button className="visual-btn visual-btn--secondary" onClick={reset}>Reset</button>}
      </div>
      {aborted && <p className="visual-hint" style={{ color: '#dc2626' }}>The fetch is cancelled via AbortController. The user sees an error message instead of waiting forever.</p>}
    </div>
  )
}
