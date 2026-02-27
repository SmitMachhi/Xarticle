import type { MetricKey } from '../../types/article'

export const METRIC_ROWS: ReadonlyArray<{ key: MetricKey; label: string }> = [
  { key: 'likes', label: 'Likes' },
  { key: 'replies', label: 'Replies' },
  { key: 'reposts', label: 'Reposts' },
  { key: 'views', label: 'Views' },
  { key: 'bookmarks', label: 'Bookmarks' },
]
