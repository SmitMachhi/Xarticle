import {
  ARTICLE_TIMEOUT_MS,
  HTTP_BAD_GATEWAY,
  HTTP_BAD_REQUEST,
  HTTP_NOT_FOUND,
} from '../core/constants'
import { jsonResponse, withTimeout } from '../core/http'
import { toTweetPayload } from '../core/tweetMapper'
import { extractArticleId, extractStatusId, isXDomain, normalizeStatusId, parseInputUrl } from '../core/url'
import { activateGuestToken, graphqlFetchTweetById, resolveQueryAndBearer } from '../core/xClient'
import { unwrapTweetResult } from '../core/xParsing'

const toError = (error: unknown): Error => (error instanceof Error ? error : new Error('Extraction failed.'))

const fetchStatusPayload = async (statusId: string): Promise<Record<string, unknown>> => {
  const normalizedStatusId = normalizeStatusId(statusId)
  if (!normalizedStatusId) {
    throw new Error('Invalid status id.')
  }
  const { bearerToken, queryId } = await resolveQueryAndBearer()
  const guestToken = await activateGuestToken(bearerToken)
  const raw = await graphqlFetchTweetById(normalizedStatusId, queryId, bearerToken, guestToken)
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

const extractByUrl = async (parsedUrl: URL): Promise<Response> => {
  const statusId = extractStatusId(parsedUrl)
  if (statusId) {
    const payload = await fetchStatusPayload(statusId)
    if (!(payload.tweet as { article?: unknown } | undefined)?.article) {
      throw new Error('This status does not include an X Article.')
    }
    return jsonResponse({ kind: 'status', payloads: [payload], warnings: [] })
  }
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

export const handleExtract = async (request: Request): Promise<Response> => {
  try {
    const body = (await request.json().catch(() => null)) as { url?: unknown } | null
    const parsedUrl = parseInputUrl(body?.url)
    if (!isXDomain(parsedUrl)) {
      return jsonResponse({ error: 'Only x.com and twitter.com links are supported.' }, HTTP_BAD_REQUEST)
    }
    return await extractByUrl(parsedUrl)
  } catch (error) {
    const message = toError(error).message
    const status = message.includes('not found') ? HTTP_NOT_FOUND : HTTP_BAD_REQUEST
    return jsonResponse({ error: message }, status)
  }
}
