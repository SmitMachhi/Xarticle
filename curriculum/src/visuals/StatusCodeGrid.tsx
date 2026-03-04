import { useState } from 'react'

const CODES = [
  { code: 200, label: 'OK', cat: '2xx', desc: 'Request succeeded. The response body has the data you asked for.' },
  { code: 201, label: 'Created', cat: '2xx', desc: 'A new resource was created (e.g. after a POST that creates a record).' },
  { code: 400, label: 'Bad Request', cat: '4xx', desc: 'You sent malformed data. Check the request body and params.' },
  { code: 401, label: 'Unauthorized', cat: '4xx', desc: 'You need to authenticate first. Missing or invalid credentials.' },
  { code: 403, label: 'Forbidden', cat: '4xx', desc: 'You\'re authenticated but not allowed to access this resource.' },
  { code: 404, label: 'Not Found', cat: '4xx', desc: 'The resource doesn\'t exist at this URL.' },
  { code: 429, label: 'Too Many Requests', cat: '4xx', desc: 'Rate limited. You\'re sending too many requests too fast.' },
  { code: 500, label: 'Server Error', cat: '5xx', desc: 'The server crashed or threw an unhandled exception.' },
  { code: 503, label: 'Unavailable', cat: '5xx', desc: 'Server is overloaded or down for maintenance.' },
]

const CAT_COLOR: Record<string, string> = {
  '2xx': '#16a34a',
  '4xx': '#d97706',
  '5xx': '#dc2626',
}

export default function StatusCodeGrid() {
  const [selected, setSelected] = useState<number | null>(null)
  const sel = CODES.find(c => c.code === selected)

  return (
    <div className="visual-wrap">
      <p className="visual-label">HTTP Status Codes — click any code</p>
      <div className="status-grid">
        {CODES.map(c => (
          <button
            key={c.code}
            className={`status-chip ${selected === c.code ? 'status-chip--selected' : ''}`}
            style={{ borderColor: CAT_COLOR[c.cat], color: selected === c.code ? '#fff' : CAT_COLOR[c.cat], backgroundColor: selected === c.code ? CAT_COLOR[c.cat] : 'transparent' }}
            onClick={() => setSelected(selected === c.code ? null : c.code)}
          >
            <span className="status-chip-code">{c.code}</span>
            <span className="status-chip-label">{c.label}</span>
          </button>
        ))}
      </div>
      {sel && (
        <div className="status-detail animate-fade-up" style={{ borderColor: CAT_COLOR[sel.cat] }}>
          <strong style={{ color: CAT_COLOR[sel.cat] }}>{sel.code} {sel.label}</strong>
          <p>{sel.desc}</p>
          <p className="status-detail-hint">
            {sel.cat === '2xx' && 'In this app: 200 means the article was extracted successfully.'}
            {sel.cat === '4xx' && 'In this app: 400 is returned when the URL is missing or invalid.'}
            {sel.cat === '5xx' && 'In this app: 500 happens when the X API is unreachable.'}
          </p>
        </div>
      )}
    </div>
  )
}
