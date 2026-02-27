import type { ExtractedArticle } from '../../../types/article'
import { METRIC_ROWS } from '../constants'

interface MetricGridProps {
  article: ExtractedArticle
  id?: string
  label: string
}

export const MetricGrid = ({ article, id, label }: MetricGridProps) => {
  return (
    <section aria-label={label} className="metric-grid" id={id}>
      {METRIC_ROWS.map((metric) => (
        <div className="metric-card" key={`${label}-${metric.key}`}>
          <span>{metric.label}</span>
          <strong>{article.metrics[metric.key] === null ? 'N/A' : article.metrics[metric.key]?.toLocaleString()}</strong>
          {article.metricNotes?.[metric.key] ? <em>{article.metricNotes[metric.key]}</em> : null}
        </div>
      ))}
    </section>
  )
}
