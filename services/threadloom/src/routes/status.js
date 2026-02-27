import { graphqlFetchTweetById, activateGuestToken, resolveQueryAndBearer } from '../core/xClient'
import { jsonResponse } from '../core/http'
import { normalizeStatusId } from '../core/primitives'
import { toTweetPayload } from '../core/tweetMapper'
import { unwrapTweetResult } from '../core/xParsing'

const isRateLimitError = error => {
  return (error instanceof Error ? error.message : '').includes('HTTP 429')
}

const runFetch = (statusId, queryId, bearerToken, guestToken) => {
  return graphqlFetchTweetById(statusId, queryId, bearerToken, guestToken)
}

const fetchWithRetry = async (statusId, queryId, bearerToken) => {
  const firstToken = await activateGuestToken(bearerToken)
  try {
    return await runFetch(statusId, queryId, bearerToken, firstToken)
  } catch (error) {
    if (!isRateLimitError(error)) throw error
    return await runFetch(statusId, queryId, bearerToken, await activateGuestToken(bearerToken))
  }
}

const notFoundPayload = () => ({ code: 404, message: 'Not found', tweet: null })

export const handleStatus = async statusId => {
  const normalized = normalizeStatusId(statusId)
  if (!normalized) return jsonResponse({ error: 'Invalid status id.' }, 400)
  const { queryId, bearerToken } = await resolveQueryAndBearer()
  const raw = await fetchWithRetry(normalized, queryId, bearerToken)
  const node = unwrapTweetResult(raw)
  if (!node?.legacy) return jsonResponse(notFoundPayload(), 404)
  const tweet = toTweetPayload(node, normalized)
  return jsonResponse({ code: 200, message: 'OK', tweet })
}
