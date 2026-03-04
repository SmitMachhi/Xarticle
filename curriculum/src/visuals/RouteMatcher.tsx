import { useState } from 'react'

const ROUTES = [
  { method: 'GET', path: '/health', handler: 'health check', color: '#059669' },
  { method: 'POST', path: '/api/extract', handler: 'handleExtract()', color: '#7c3aed' },
  { method: 'GET', path: '/api/image', handler: 'handleImage()', color: '#2563eb' },
  { method: 'GET', path: '/*', handler: 'serve React app (static assets)', color: '#6b7280' },
]

function matchRoute(input: string, method: string) {
  const path = input.startsWith('/') ? input : `/${input}`
  if (path === '/health' && method === 'GET') return 0
  if (path === '/api/extract' && method === 'POST') return 1
  if (path.startsWith('/api/image')) return 2
  return 3
}

export default function RouteMatcher() {
  const [path, setPath] = useState('/api/extract')
  const [method, setMethod] = useState('POST')
  const matched = matchRoute(path, method)

  return (
    <div className="visual-wrap">
      <p className="visual-label">Interactive Route Matcher — try different paths</p>
      <div className="route-inputs">
        <select className="route-method-select" value={method} onChange={e => setMethod(e.target.value)}>
          {['GET', 'POST', 'PUT', 'DELETE'].map(m => <option key={m}>{m}</option>)}
        </select>
        <input
          className="route-path-input"
          value={path}
          onChange={e => setPath(e.target.value)}
          placeholder="/api/extract"
          spellCheck={false}
        />
      </div>
      <div className="route-table">
        {ROUTES.map((r, i) => (
          <div
            key={i}
            className={`route-row ${matched === i ? 'route-row--matched' : ''}`}
            style={matched === i ? { borderColor: r.color, background: `${r.color}12` } : {}}
          >
            <span className="route-method" style={{ color: r.color }}>{r.method}</span>
            <span className="route-path">{r.path}</span>
            <span className="route-arrow">→</span>
            <span className="route-handler" style={{ color: matched === i ? r.color : undefined }}>
              {matched === i ? '✓ ' : ''}{r.handler}
            </span>
          </div>
        ))}
      </div>
      <p className="visual-hint">
        Try: <code>/api/extract</code> (POST), <code>/api/image?url=…</code> (GET), <code>/anything-else</code> (GET)
      </p>
    </div>
  )
}
