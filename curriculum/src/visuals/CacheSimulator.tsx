import { useState } from 'react'

type RequestState = 'idle' | 'fetching' | 'done'
interface HistoryEntry { hit: boolean; ms: number }

const MISS_MS = 1400
const HIT_MS = 40

export default function CacheSimulator() {
  const [state, setState] = useState<RequestState>('idle')
  const [cached, setCached] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [elapsed, setElapsed] = useState(0)

  const fetch = () => {
    if (state === 'fetching') return
    setState('fetching')
    const isHit = cached
    const duration = isHit ? HIT_MS : MISS_MS
    const start = Date.now()

    const tick = setInterval(() => {
      setElapsed(Date.now() - start)
    }, 30)

    setTimeout(() => {
      clearInterval(tick)
      setElapsed(duration)
      setState('done')
      setCached(true)
      setHistory(h => [...h, { hit: isHit, ms: duration }])
      setTimeout(() => { setState('idle'); setElapsed(0) }, 900)
    }, duration)
  }

  const reset = () => { setCached(false); setHistory([]); setState('idle'); setElapsed(0) }

  return (
    <div className="visual-wrap">
      <p className="visual-label">Cache Simulator — fetch the same article twice</p>
      <div className="sim-status-row">
        <div className={`sim-cache-badge ${cached ? 'sim-cache-badge--warm' : 'sim-cache-badge--cold'}`}>
          {cached ? '🟢 Cache WARM' : '⚪ Cache COLD'}
        </div>
        {state === 'fetching' && (
          <div className="sim-timing">{elapsed}ms…</div>
        )}
        {state === 'done' && history.length > 0 && (
          <div className={`sim-result ${history[history.length - 1]?.hit ? 'sim-result--hit' : 'sim-result--miss'}`}>
            {history[history.length - 1]?.hit ? `⚡ HIT — ${HIT_MS}ms` : `🔄 MISS — ${MISS_MS}ms (fetched from X)`}
          </div>
        )}
      </div>
      <div className="sim-timeline">
        {history.map((h, i) => (
          <div key={i} className={`sim-bar ${h.hit ? 'sim-bar--hit' : 'sim-bar--miss'}`} style={{ width: `${Math.max(8, (h.ms / MISS_MS) * 100)}%` }}>
            {h.hit ? `⚡ ${h.ms}ms` : `🔄 ${h.ms}ms`}
          </div>
        ))}
        {state === 'fetching' && (
          <div className="sim-bar sim-bar--active" style={{ width: `${Math.max(8, (elapsed / MISS_MS) * 100)}%` }}>
            {elapsed}ms…
          </div>
        )}
      </div>
      <div className="sim-actions">
        <button className="visual-btn" onClick={fetch} disabled={state === 'fetching'}>
          {state === 'fetching' ? 'Fetching…' : '📡 Fetch Article'}
        </button>
        <button className="visual-btn visual-btn--secondary" onClick={reset}>Reset</button>
      </div>
      <p className="visual-hint">First fetch = cache miss (~1.4s via X API). Same URL again = cache hit (~40ms from Durable Objects).</p>
    </div>
  )
}
