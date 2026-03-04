const CLIENT = {
  can: [
    '🖼️ Render UI (React components)',
    '🖱️ Handle user input',
    '📄 Generate PDFs (pdfmake)',
    '🗜️ Build ZIPs (jszip)',
    '💾 Read/write localStorage',
  ],
  cannot: [
    '❌ Call X\'s API (CORS blocked)',
    '❌ Hide secrets safely',
    '❌ Cache globally across users',
  ],
}

const SERVER = {
  can: [
    '🔑 Hold API secrets (bearer token)',
    '🌐 Call X\'s API (no CORS)',
    '💾 Cache globally (Durable Objects)',
    '🖼️ Proxy images (CORS bypass)',
    '🔒 Validate & sanitise input',
  ],
  cannot: [
    '❌ Render a UI',
    '❌ Know the user\'s screen size',
    '❌ Access browser storage',
  ],
}

export default function ClientServerSplit() {
  return (
    <div className="visual-wrap">
      <p className="visual-label">Client vs Server — who does what</p>
      <div className="split-grid">
        <div className="split-col split-col--client">
          <div className="split-header">🌐 Browser (Client)</div>
          <ul className="split-list split-list--can">
            {CLIENT.can.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
          <ul className="split-list split-list--cannot">
            {CLIENT.cannot.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
        <div className="split-divider">⟷</div>
        <div className="split-col split-col--server">
          <div className="split-header">⚡ Cloudflare Worker (Server)</div>
          <ul className="split-list split-list--can">
            {SERVER.can.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
          <ul className="split-list split-list--cannot">
            {SERVER.cannot.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      </div>
    </div>
  )
}
