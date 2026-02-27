import type { MetricKey } from '../../types/article'
import { DEFAULT_METRICS, METRIC_PATTERNS } from './constants'
import { parseCount } from './text'

const collectByPattern = (sourceText: string, pattern: RegExp): number[] => {
  const values: number[] = []
  pattern.lastIndex = 0
  let match = pattern.exec(sourceText)
  while (match) {
    const parsed = parseCount(match[1] || '')
    if (parsed !== null) {
      values.push(parsed)
    }
    match = pattern.exec(sourceText)
  }
  return values
}

export const parseMetricsFromText = (sourceText: string): Record<MetricKey, number | null> => {
  const metrics: Record<MetricKey, number | null> = { ...DEFAULT_METRICS }
  ;(Object.keys(METRIC_PATTERNS) as MetricKey[]).forEach((metricKey) => {
    const candidates = METRIC_PATTERNS[metricKey].flatMap((pattern) => collectByPattern(sourceText, pattern))
    metrics[metricKey] = candidates.length > 0 ? Math.max(...candidates) : null
  })
  return metrics
}
