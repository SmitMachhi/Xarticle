import { ARTICLE_PATH_PATTERNS, STATUS_PATH_PATTERNS } from './constants'

export const isXDomain = (url: URL): boolean => {
  const host = url.hostname.toLowerCase()
  return host === 'x.com' || host === 'www.x.com' || host === 'twitter.com' || host === 'www.twitter.com'
}

export const extractByPatterns = (pathname: string, patterns: RegExp[]): string | null => {
  for (const pattern of patterns) {
    const match = pathname.match(pattern)
    if (match?.[1]) return match[1]
  }
  return null
}

export const extractStatusId = (url: URL): string | null => extractByPatterns(url.pathname, STATUS_PATH_PATTERNS)
export const extractArticleId = (url: URL): string | null => extractByPatterns(url.pathname, ARTICLE_PATH_PATTERNS)

export const normalizeStatusId = (value: unknown): string | null => {
  const cleaned = typeof value === 'string' ? value.trim() : ''
  return /^\d+$/.test(cleaned) ? cleaned : null
}

export const parseInputUrl = (value: unknown): URL => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('Missing URL.')
  }
  const withProtocol = /^https?:\/\//i.test(value.trim()) ? value.trim() : `https://${value.trim()}`
  return new URL(withProtocol)
}
