const BLOCKED = [
  { from: '🌐 Browser JS', to: '𝕏 pbs.twimg.com', status: 'blocked', label: 'fetch(image_url)' },
  { from: '𝕏 pbs.twimg.com', to: '🌐 Browser JS', status: 'blocked', label: '200 OK (no CORS header)' },
  { from: '🔴 Browser', to: null, status: 'error', label: 'BLOCKS read — no Access-Control-Allow-Origin' },
]

const PROXIED = [
  { from: '🌐 Browser JS', to: '⚡ Worker /api/image', status: 'ok', label: 'fetch("/api/image?url=…")' },
  { from: '⚡ Worker', to: '𝕏 pbs.twimg.com', status: 'ok', label: 'Server fetch (no CORS rules)' },
  { from: '𝕏 pbs.twimg.com', to: '⚡ Worker', status: 'ok', label: '200 OK + image bytes' },
  { from: '⚡ Worker', to: '🌐 Browser JS', status: 'ok', label: '200 OK + Access-Control-Allow-Origin: *' },
  { from: '✅ Browser', to: null, status: 'ok', label: 'Reads image — CORS header present!' },
]

function Flow({ steps }: { steps: typeof BLOCKED }) {
  return (
    <div className="cors-flow">
      {steps.map((s, i) => (
        <div key={i} className={`cors-step cors-step--${s.status}`}>
          <span className="cors-from">{s.from}</span>
          {s.to && <><span className="cors-arrow">→</span><span className="cors-to">{s.to}</span></>}
          <span className="cors-step-label">{s.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function CorsBlockedVsProxied() {
  return (
    <div className="visual-wrap">
      <p className="visual-label">CORS: Direct Request vs Proxied Request</p>
      <div className="cors-split">
        <div className="cors-col">
          <div className="cors-col-title cors-col-title--bad">✗ Direct (Blocked)</div>
          <Flow steps={BLOCKED} />
        </div>
        <div className="cors-col">
          <div className="cors-col-title cors-col-title--good">✓ Via Proxy (Works)</div>
          <Flow steps={PROXIED} />
        </div>
      </div>
    </div>
  )
}
