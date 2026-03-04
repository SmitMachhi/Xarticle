const ROWS = [
  { label: 'Infrastructure', trad: 'You rent a VM, manage OS', sls: 'Provider handles everything' },
  { label: 'Scaling', trad: 'Manual — add more VMs', sls: 'Automatic — scales to zero' },
  { label: 'Billing', trad: 'Pay 24/7, even when idle', sls: 'Pay per request only' },
  { label: 'Cold start', trad: 'Always warm (running)', sls: '< 1ms for CF Workers' },
  { label: 'Location', trad: 'One region', sls: '300+ edge locations globally' },
  { label: 'State', trad: 'Global in-process memory', sls: 'Stateless per request' },
  { label: 'Deploys', trad: 'SSH, Docker, CI pipeline', sls: 'wrangler deploy (one command)' },
]

export default function TraditionalVsServerless() {
  return (
    <div className="visual-wrap">
      <p className="visual-label">Traditional Server vs Cloudflare Workers</p>
      <div className="comparison-table">
        <div className="comparison-header">
          <span>Aspect</span>
          <span>🖥️ Traditional</span>
          <span>⚡ Serverless (CF Workers)</span>
        </div>
        {ROWS.map((r, i) => (
          <div key={i} className="comparison-row">
            <span className="comparison-aspect">{r.label}</span>
            <span className="comparison-trad">{r.trad}</span>
            <span className="comparison-sls">{r.sls}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
