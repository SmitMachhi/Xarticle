import { useState, useEffect } from 'react'

const STEPS = [
  { id: 0, label: 'Browser sends POST /api/extract', from: 'browser', to: 'worker' },
  { id: 1, label: 'Worker fetches tweet from X API', from: 'worker', to: 'xapi' },
  { id: 2, label: 'X API returns tweet JSON', from: 'xapi', to: 'worker' },
  { id: 3, label: 'Worker returns structured article', from: 'worker', to: 'browser' },
]

export default function RequestResponseFlow() {
  const [active, setActive] = useState(-1)
  const [running, setRunning] = useState(false)

  const run = () => {
    if (running) return
    setRunning(true)
    setActive(-1)
    STEPS.forEach((_s, i) => {
      setTimeout(() => {
        setActive(i)
        if (i === STEPS.length - 1) setTimeout(() => { setRunning(false); setActive(-1) }, 1800)
      }, i * 1200)
    })
  }

  useEffect(() => { run() }, [])

  const nodes = [
    { key: 'browser', label: '🌐 Browser', color: '#3b82f6' },
    { key: 'worker', label: '⚡ Worker', color: '#8b5cf6' },
    { key: 'xapi', label: '𝕏 X API', color: '#1da1f2' },
  ]

  const step = active >= 0 ? STEPS[active] : null

  return (
    <div className="visual-wrap">
      <p className="visual-label">Request-Response Flow</p>
      <div className="flow-nodes">
        {nodes.map(n => (
          <div
            key={n.key}
            className={`flow-node ${step && (step.from === n.key || step.to === n.key) ? 'flow-node--active' : ''}`}
            style={{ borderColor: n.color, color: n.color }}
          >
            {n.label}
          </div>
        ))}
      </div>
      <div className="flow-step-label">
        {step ? step.label : 'Click Replay to animate'}
      </div>
      <div className="flow-arrows">
        {STEPS.map((s, i) => (
          <div key={i} className={`flow-arrow-row ${active === i ? 'flow-arrow-row--active' : ''}`}>
            <span className="flow-arrow-from">{s.from}</span>
            <span className="flow-arrow-line">
              <span className="flow-arrow-head">──────▶</span>
            </span>
            <span className="flow-arrow-to">{s.to}</span>
          </div>
        ))}
      </div>
      <button className="visual-btn" onClick={run} disabled={running}>
        {running ? 'Animating…' : '▶ Replay'}
      </button>
    </div>
  )
}
