const PARTS = [
  { label: 'protocol', value: 'https://', color: '#7c3aed', desc: 'Secure HTTP — all data is encrypted in transit' },
  { label: 'hostname', value: 'xarticle.pages.dev', color: '#2563eb', desc: 'The server\'s address — Cloudflare routes this to our Worker' },
  { label: 'path', value: '/api/extract', color: '#059669', desc: 'The specific resource or endpoint — our router matches this' },
  { label: 'query', value: '?debug=true', color: '#d97706', desc: 'Optional key=value pairs — the image proxy uses ?url= here' },
]

export default function UrlAnatomy() {
  return (
    <div className="visual-wrap">
      <p className="visual-label">Anatomy of a URL</p>
      <div className="url-bar">
        {PARTS.map(p => (
          <span key={p.label} className="url-part" style={{ color: p.color, borderBottomColor: p.color }}>
            {p.value}
          </span>
        ))}
      </div>
      <div className="url-legend">
        {PARTS.map(p => (
          <div key={p.label} className="url-legend-row">
            <span className="url-legend-dot" style={{ background: p.color }} />
            <span className="url-legend-name" style={{ color: p.color }}>{p.label}</span>
            <span className="url-legend-desc">{p.desc}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
