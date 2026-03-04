const STAGES = [
  {
    icon: '⚡',
    label: 'Worker',
    shape: '{ kind, payloads }',
    note: 'Returns raw JSON',
    color: '#7c3aed',
  },
  {
    icon: '🔍',
    label: 'Parser',
    shape: 'parseThreadloom()',
    note: 'Validates & maps',
    color: '#2563eb',
  },
  {
    icon: '📐',
    label: 'Domain Model',
    shape: 'ExtractedArticle',
    note: 'Typed, trusted',
    color: '#059669',
  },
  {
    icon: '🖼️',
    label: 'UI',
    shape: '<ArticlePreview />',
    note: 'Renders blocks',
    color: '#d97706',
  },
]

export default function TypeContractFlow() {
  return (
    <div className="visual-wrap">
      <p className="visual-label">Type Contract — data flows through typed stages</p>
      <div className="tcf-stages">
        {STAGES.map((s, i) => (
          <div key={s.label} className="tcf-stage-wrap">
            <div className="tcf-stage" style={{ borderColor: s.color }}>
              <span className="tcf-icon">{s.icon}</span>
              <span className="tcf-stage-label" style={{ color: s.color }}>{s.label}</span>
              <code className="tcf-shape">{s.shape}</code>
              <span className="tcf-note">{s.note}</span>
            </div>
            {i < STAGES.length - 1 && (
              <div className="tcf-arrow">
                <div className="tcf-arrow-line" />
                <span className="tcf-arrow-head">▶</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="tcf-benefit">
        If any stage returns the wrong shape, TypeScript catches it at <strong>compile time</strong> — before any user sees a bug.
      </div>
    </div>
  )
}
