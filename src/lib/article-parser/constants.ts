import type { MetricKey } from '../../types/article'

export const MIN_PARAGRAPH_LENGTH = 4
export const THOUSAND = 1_000
export const MILLION = 1_000_000
export const BILLION = 1_000_000_000
export const HEADING_LEVEL_ONE = 1
export const HEADING_LEVEL_TWO = 2
export const HEADING_LEVEL_THREE = 3

export const DEFAULT_METRICS: Record<MetricKey, number | null> = {
  likes: null,
  replies: null,
  reposts: null,
  views: null,
  bookmarks: null,
}

export const METRIC_PATTERNS: Record<MetricKey, RegExp[]> = {
  likes: [/"favorite_count"\s*:\s*(\d+)/gi, /"like_count"\s*:\s*(\d+)/gi, /(\d[\d,.]*)\s+likes?/gi],
  replies: [/"reply_count"\s*:\s*(\d+)/gi, /(\d[\d,.]*)\s+repl(?:y|ies)/gi],
  reposts: [/"retweet_count"\s*:\s*(\d+)/gi, /"repost_count"\s*:\s*(\d+)/gi, /(\d[\d,.]*)\s+reposts?/gi],
  views: [/"view_count"\s*:\s*(\d+)/gi, /"views"\s*:\s*"?(\d+)"?/gi, /(\d[\d,.]*)\s+views?/gi],
  bookmarks: [/"bookmark_count"\s*:\s*(\d+)/gi, /(\d[\d,.]*)\s+bookmarks?/gi],
}
