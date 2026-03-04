const TOKENS = [
  {
    name: 'Bearer Token',
    icon: '🔐',
    color: '#7c3aed',
    ttl: 'Permanent (until revoked)',
    bar: 1.0,
    desc: 'App-level credential. Identifies your application to X. Stored as a Cloudflare secret — never in code.',
    source: 'Set via: wrangler secret put BEARER_TOKEN',
  },
  {
    name: 'Guest Token',
    icon: '🎫',
    color: '#2563eb',
    ttl: '~2 hours',
    bar: 0.15,
    desc: 'User-session credential. X issues one per anonymous session. Worker fetches and caches it, refreshes when expired.',
    source: 'Fetched from: POST https://api.x.com/1.1/guest/activate',
  },
  {
    name: 'Query ID',
    icon: '🔑',
    color: '#059669',
    ttl: '~6 hours',
    bar: 0.4,
    desc: 'X\'s GraphQL endpoint ID for the TweetDetail query. Changes when X deploys updates. Cached and auto-refreshed on 403.',
    source: 'Scraped from X\'s JS bundle on first use',
  },
]

export default function TokenTimeline() {
  return (
    <div className="visual-wrap">
      <p className="visual-label">Authentication Tokens — lifetimes & purpose</p>
      <div className="token-list">
        {TOKENS.map(t => (
          <div key={t.name} className="token-card" style={{ borderColor: t.color }}>
            <div className="token-card-header">
              <span className="token-icon">{t.icon}</span>
              <span className="token-name" style={{ color: t.color }}>{t.name}</span>
              <span className="token-ttl">{t.ttl}</span>
            </div>
            <div className="token-bar-track">
              <div className="token-bar-fill" style={{ width: `${t.bar * 100}%`, background: t.color }} />
            </div>
            <p className="token-desc">{t.desc}</p>
            <code className="token-source">{t.source}</code>
          </div>
        ))}
      </div>
    </div>
  )
}
