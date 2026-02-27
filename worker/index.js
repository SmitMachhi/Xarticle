const FX_TIMEOUT_MS = 15000
const ARTICLE_TIMEOUT_MS = 20000
const FX_THREAD_LIMIT = 40

const STATUS_PATH_PATTERNS = [/\/[^/]+\/status\/(\d+)/i, /\/i\/status\/(\d+)/i]
const ARTICLE_PATH_PATTERNS = [/\/i\/articles\/([A-Za-z0-9_-]+)/i, /\/[^/]+\/articles\/([A-Za-z0-9_-]+)/i, /\/[^/]+\/article\/([A-Za-z0-9_-]+)/i]

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST,OPTIONS',
  'access-control-allow-headers': 'content-type',
}

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  ...CORS_HEADERS,
}

const toStatusId = (value) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(Math.trunc(value)) : null
  }
  if (typeof value === 'string') {
    const normalized = value.trim()
    return normalized || null
  }
  return null
}

const isXDomain = (url) => {
  const host = url.hostname.toLowerCase()
  return host === 'x.com' || host === 'www.x.com' || host === 'twitter.com' || host === 'www.twitter.com'
}

const extractStatusId = (url) => {
  for (const pattern of STATUS_PATH_PATTERNS) {
    const match = url.pathname.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }
  return null
}

const extractArticleId = (url) => {
  for (const pattern of ARTICLE_PATH_PATTERNS) {
    const match = url.pathname.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }
  return null
}

const getThreadMeta = (payload) => {
  const tweet = payload && typeof payload === 'object' ? payload.tweet : undefined
  const screenName = tweet && tweet.author && typeof tweet.author.screen_name === 'string' ? tweet.author.screen_name.trim().toLowerCase() : ''
  return {
    statusId: toStatusId(tweet ? tweet.id : null),
    authorHandle: screenName,
    replyingToStatusId: toStatusId(tweet ? tweet.replying_to_status : null),
  }
}

const jsonResponse = (payload, status = 200) => {
  return new Response(JSON.stringify(payload), {
    status,
    headers: JSON_HEADERS,
  })
}

const fetchWithTimeout = async (url, init, timeoutMs) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

const normalizeBaseUrl = baseUrl => {
  const normalized = baseUrl.trim()
  return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized
}

const fetchThreadloomStatus = async (statusId, env) => {
  const configuredBase = typeof env?.THREADLOOM_API_BASE_URL === 'string' ? env.THREADLOOM_API_BASE_URL : ''
  if (!configuredBase.trim()) {
    throw new Error('THREADLOOM_API_BASE_URL is not configured.')
  }

  const endpoint = `${normalizeBaseUrl(configuredBase)}/i/status/${statusId}`
  const response = await fetchWithTimeout(endpoint, {}, FX_TIMEOUT_MS)
  if (!response.ok) {
    throw new Error(`status parser HTTP ${response.status}`)
  }
  return await response.json()
}

const fetchStatusWithThreadChain = async (statusId, env) => {
  const warnings = []
  const seedPayload = await fetchThreadloomStatus(statusId, env)
  const payloads = [seedPayload]
  const seedMeta = getThreadMeta(seedPayload)

  if (!seedMeta.statusId || !seedMeta.authorHandle) {
    return {
      payloads,
      warnings: ['Thread auto-detection skipped due to missing status metadata.'],
      threadLimitReached: false,
    }
  }

  let currentParentId = seedMeta.replyingToStatusId
  let threadLimitReached = false

  while (currentParentId) {
    if (payloads.length >= FX_THREAD_LIMIT) {
      threadLimitReached = true
      break
    }

    try {
      const parentPayload = await fetchThreadloomStatus(currentParentId, env)
      const parentMeta = getThreadMeta(parentPayload)
      if (!parentMeta.statusId) {
        warnings.push(`Thread chain stopped early because a parent payload was incomplete (${currentParentId}).`)
        break
      }
      if (!parentMeta.authorHandle || parentMeta.authorHandle !== seedMeta.authorHandle) {
        break
      }
      payloads.push(parentPayload)
      currentParentId = parentMeta.replyingToStatusId
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown status parser error'
      warnings.push(`Thread chain stopped early while fetching ${currentParentId}: ${message}`)
      break
    }
  }

  return {
    payloads: payloads.reverse(),
    warnings,
    threadLimitReached,
  }
}

const parseInputUrl = (value) => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('Missing URL.')
  }
  const withProtocol = /^https?:\/\//i.test(value.trim()) ? value.trim() : `https://${value.trim()}`
  return new URL(withProtocol)
}

const handleExtract = async (request, env) => {
  const body = await request.json().catch(() => null)
  const parsedUrl = parseInputUrl(body ? body.url : '')

  if (!isXDomain(parsedUrl)) {
    throw new Error('Only x.com and twitter.com links are supported.')
  }

  const statusId = extractStatusId(parsedUrl)
  if (statusId) {
    const result = await fetchStatusWithThreadChain(statusId, env)
    return jsonResponse({
      kind: 'status',
      payloads: result.payloads,
      warnings: result.warnings,
      threadLimitReached: result.threadLimitReached,
    })
  }

  const articleId = extractArticleId(parsedUrl)
  if (!articleId) {
    throw new Error('This URL does not point to a supported status or article.')
  }

  const articleResponse = await fetchWithTimeout(
    parsedUrl.toString(),
    {
      method: 'GET',
      redirect: 'follow',
      headers: {
        accept: 'text/html,application/xhtml+xml',
      },
    },
    ARTICLE_TIMEOUT_MS,
  )

  if (!articleResponse.ok) {
    throw new Error(`article fetch HTTP ${articleResponse.status}`)
  }

  const html = await articleResponse.text()
  if (!html.trim()) {
    throw new Error('Article page did not return HTML content.')
  }

  return jsonResponse({
    kind: 'article-html',
    html,
    finalUrl: articleResponse.url || parsedUrl.toString(),
    warnings: [],
  })
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS })
    }

    const url = new URL(request.url)
    if (request.method === 'POST' && url.pathname === '/api/extract') {
      try {
        return await handleExtract(request, env)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Extraction failed.'
        return jsonResponse({ error: message }, 400)
      }
    }

    if (request.method === 'GET' && url.pathname === '/health') {
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'Not found.' }, 404)
  },
}
