import {
  ARTICLE_TIMEOUT_MS,
  HTTP_BAD_GATEWAY,
  HTTP_BAD_REQUEST,
  HTTP_NOT_FOUND,
} from '../core/constants'
import { readExtractCache, writeExtractCache } from '../core/extractCache'
import { jsonResponse, withTimeout } from '../core/http'
import type { XSession } from '../core/session'
import { toTweetPayload } from '../core/tweetMapper'
import { extractArticleId, extractStatusId, isXDomain, normalizeStatusId, parseInputUrl } from '../core/url'
import { graphqlFetchTweetById, refreshQuery, resetGuestToken } from '../core/xClient'
import { unwrapTweetResult } from '../core/xParsing'

const toError = (error: unknown): Error => (error instanceof Error ? error : new Error('Extraction failed.'))
const isStaleQueryFailure = (error: unknown): boolean =>
  (error instanceof Error ? error.message : '').includes('stale-query-id')
const isCacheablePayload = (payload: unknown): boolean =>
  Boolean(payload && typeof payload === 'object' && 'kind' in (payload as Record<string, unknown>))

const fetchRawTweet = async (session: XSession, statusId: string): Promise<unknown> => {
  try {
    return await graphqlFetchTweetById(session, statusId)
  } catch (error) {
    if (!isStaleQueryFailure(error)) throw error
    await resetGuestToken(session)
    await refreshQuery(session)
    return await graphqlFetchTweetById(session, statusId)
  }
}

const fetchStatusPayload = async (session: XSession, statusId: string): Promise<Record<string, unknown>> => {
  const normalizedStatusId = normalizeStatusId(statusId)
  if (!normalizedStatusId) {
    throw new Error('Invalid status id.')
  }
  const raw = await fetchRawTweet(session, normalizedStatusId)
  const tweetNode = unwrapTweetResult(raw)
  if (!tweetNode || !(tweetNode as { legacy?: unknown }).legacy) {
    throw new Error('This status was not found.')
  }
  return {
    code: 200,
    message: 'OK',
    tweet: toTweetPayload(tweetNode, normalizedStatusId),
  }
}

const fetchArticleHtml = async (parsedUrl: URL): Promise<Response> => {
  return await withTimeout(parsedUrl.toString(), { method: 'GET', redirect: 'follow', headers: { accept: 'text/html,application/xhtml+xml' } }, ARTICLE_TIMEOUT_MS)
}

type StatusTweet = { article?: unknown; quoted_status_id?: string | null } | undefined

const extractStatus = async (session: XSession, statusId: string): Promise<Response> => {
  const payload = await fetchStatusPayload(session, statusId)
  const tweet = payload.tweet as StatusTweet
  if (tweet?.article) return jsonResponse({ kind: 'status', payloads: [payload], warnings: [] })
  const quotedId = tweet?.quoted_status_id
  const quoted = quotedId ? await fetchStatusPayload(session, quotedId) : null
  if (!(quoted?.tweet as StatusTweet)?.article) throw new Error('This status does not include an X Article.')
  return jsonResponse({ kind: 'status', payloads: [quoted], warnings: ['Opened the article quoted by this post.'] })
}

const extractByUrl = async (session: XSession, parsedUrl: URL): Promise<Response> => {
  const statusId = extractStatusId(parsedUrl)
  if (statusId) return await extractStatus(session, statusId)
  const articleId = extractArticleId(parsedUrl)
  if (!articleId) {
    return jsonResponse({ error: 'This URL does not point to a supported status or article.' }, HTTP_BAD_REQUEST)
  }
  const articleResponse = await fetchArticleHtml(parsedUrl)
  if (!articleResponse.ok) {
    return jsonResponse({ error: `article fetch HTTP ${articleResponse.status}` }, HTTP_BAD_GATEWAY)
  }
  const html = await articleResponse.text()
  if (!html.trim()) {
    return jsonResponse({ error: 'Article page did not return HTML content.' }, HTTP_BAD_GATEWAY)
  }
  return jsonResponse({ kind: 'article-html', html, finalUrl: articleResponse.url || parsedUrl.toString(), warnings: [] })
}

const readCachedResponse = async (sourceUrl: string): Promise<Response | null> => {
  const cached = await readExtractCache(sourceUrl)
  if (!cached) {
    return null
  }
  return jsonResponse(cached.payload, cached.status)
}

const writeCacheableResponse = async (sourceUrl: string, response: Response): Promise<void> => {
  if (!response.ok) {
    return
  }
  const rawBody = await response.clone().text()
  let payload: unknown = null
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return
  }
  if (!isCacheablePayload(payload)) {
    return
  }
  await writeExtractCache(sourceUrl, response.status, payload)
}

export const handleExtract = async (request: Request, session: XSession): Promise<Response> => {
  try {
    const body = (await request.json().catch(() => null)) as { url?: unknown } | null
    const parsedUrl = parseInputUrl(body?.url)
    if (!isXDomain(parsedUrl)) {
      return jsonResponse({ error: 'Only x.com and twitter.com links are supported.' }, HTTP_BAD_REQUEST)
    }
    const sourceUrl = parsedUrl.toString()
    const cachedResponse = await readCachedResponse(sourceUrl)
    if (cachedResponse) {
      return cachedResponse
    }
    const response = await extractByUrl(session, parsedUrl)
    await writeCacheableResponse(sourceUrl, response)
    return response
  } catch (error) {
    const message = toError(error).message
    const status = message.includes('not found') ? HTTP_NOT_FOUND : HTTP_BAD_REQUEST
    return jsonResponse({ error: message }, status)
  }
}
