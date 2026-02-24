const ARTICLE_PATH_PATTERNS = [
  /\/i\/articles\/([A-Za-z0-9_-]+)/i,
  /\/[^/]+\/articles\/([A-Za-z0-9_-]+)/i,
  /\/[^/]+\/article\/([A-Za-z0-9_-]+)/i,
]

const STATUS_PATH_PATTERNS = [
  /\/[^/]+\/status\/(\d+)/i,
  /\/i\/status\/(\d+)/i,
]

export const isXDomain = (url: URL): boolean => {
  const host = url.hostname.toLowerCase()
  return host === 'x.com' || host === 'www.x.com' || host === 'twitter.com' || host === 'www.twitter.com'
}

export const normalizeInputUrl = (raw: string): URL => {
  const trimmed = raw.trim()
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  return new URL(withProtocol)
}

export const extractArticleId = (url: URL): string | null => {
  for (const pattern of ARTICLE_PATH_PATTERNS) {
    const match = url.pathname.match(pattern)
    if (match?.[1]) {
      return match[1]
    }
  }
  return null
}

export const isLikelyLongFormArticleUrl = (url: URL): boolean => {
  if (!isXDomain(url)) {
    return false
  }
  return extractArticleId(url) !== null
}

export const extractStatusId = (url: URL): string | null => {
  for (const pattern of STATUS_PATH_PATTERNS) {
    const match = url.pathname.match(pattern)
    if (match?.[1]) {
      return match[1]
    }
  }
  return null
}

export const isSupportedXInputUrl = (url: URL): boolean => {
  if (!isXDomain(url)) {
    return false
  }
  return extractArticleId(url) !== null || extractStatusId(url) !== null
}

export const getHandleFromUrl = (url: URL): string => {
  const parts = url.pathname.split('/').filter(Boolean)
  if (parts.length === 0 || parts[0] === 'i') {
    return 'unknown'
  }
  return parts[0].replace(/^@/, '')
}
