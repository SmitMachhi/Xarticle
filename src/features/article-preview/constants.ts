import type { MetricKey } from '../../types/article'

export const METRIC_ROWS: ReadonlyArray<{ key: MetricKey; label: string }> = [
  { key: 'likes', label: 'likes' },
  { key: 'replies', label: 'replies' },
  { key: 'reposts', label: 'reposts' },
  { key: 'views', label: 'views' },
  { key: 'bookmarks', label: 'bookmarks' },
]

export const DATE_LOCALE = 'en-US'
export const DATE_FORMAT: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }
