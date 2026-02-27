import {
  GUEST_TOKEN_TTL_MS,
  HTTP_TOO_MANY_REQUESTS,
  MAIN_SCRIPT_URL,
  QUERY_CACHE_TTL_MS,
  QUERY_FEATURES,
  QUERY_FIELD_TOGGLES,
  QUERY_VARIABLES,
  STATUS_TIMEOUT_MS,
  TWITTER_API_ROOT,
  X_API_ROOT,
} from './constants'
import { withTimeout } from './http'
import { clearGuestToken, state } from './state'
import { graphqlHeaders,guestActivateHeaders } from './xHeaders'
import { readBearerToken, readMainScriptUrl, readQueryId } from './xParsing'

const hasQueryCache = (now: number): boolean => {
  const fresh = now - state.queryResolvedAt < QUERY_CACHE_TTL_MS
  return Boolean(state.tweetResultQueryId && state.bearerToken && fresh)
}

const hasGuestToken = (now: number): boolean => Boolean(state.guestToken && now < state.guestTokenExpiresAt)

const fetchHomepageHtml = async (): Promise<string> => {
  const response = await withTimeout(MAIN_SCRIPT_URL, { headers: { accept: 'text/html,application/xhtml+xml' } }, STATUS_TIMEOUT_MS)
  if (!response.ok) throw new Error(`Failed to fetch X homepage (HTTP ${response.status}).`)
  return await response.text()
}

export const resolveQueryAndBearer = async (): Promise<{ bearerToken: string; queryId: string }> => {
  const now = Date.now()
  if (hasQueryCache(now)) {
    return { queryId: state.tweetResultQueryId!, bearerToken: state.bearerToken! }
  }
  const mainScriptUrl = readMainScriptUrl(await fetchHomepageHtml())
  if (!mainScriptUrl) throw new Error('Could not resolve X main script URL.')
  const scriptResponse = await withTimeout(mainScriptUrl, { headers: { accept: '*/*' } }, STATUS_TIMEOUT_MS)
  if (!scriptResponse.ok) throw new Error(`Failed to fetch X main script (HTTP ${scriptResponse.status}).`)
  const scriptText = await scriptResponse.text()
  const queryId = readQueryId(scriptText)
  if (!queryId) throw new Error('Could not resolve TweetResultByRestId query id.')
  state.tweetResultQueryId = queryId
  state.bearerToken = readBearerToken(scriptText)
  state.queryResolvedAt = now
  return { queryId, bearerToken: state.bearerToken }
}

export const activateGuestToken = async (bearerToken: string): Promise<string> => {
  const now = Date.now()
  if (hasGuestToken(now)) return state.guestToken!
  const response = await withTimeout(`${TWITTER_API_ROOT}/1.1/guest/activate.json`, { method: 'POST', headers: guestActivateHeaders(bearerToken), body: '' }, STATUS_TIMEOUT_MS)
  if (!response.ok) throw new Error(`Guest token activation failed (HTTP ${response.status}).`)
  const payload = (await response.json()) as { guest_token?: unknown }
  if (typeof payload.guest_token !== 'string') throw new Error('Guest token activation returned an invalid payload.')
  state.guestToken = payload.guest_token
  state.guestTokenExpiresAt = now + GUEST_TOKEN_TTL_MS
  return state.guestToken
}

const graphqlUrl = (root: string, statusId: string, queryId: string): string => {
  const query = `${root}/graphql/${queryId}/TweetResultByRestId`
  const variables = encodeURIComponent(JSON.stringify({ ...QUERY_VARIABLES, tweetId: statusId }))
  const features = encodeURIComponent(JSON.stringify(QUERY_FEATURES))
  const toggles = encodeURIComponent(JSON.stringify(QUERY_FIELD_TOGGLES))
  return `${query}?variables=${variables}&features=${features}&fieldToggles=${toggles}`
}

const fetchGraphql = async (root: string, statusId: string, queryId: string, bearerToken: string, guestToken: string): Promise<Response> => {
  return await withTimeout(graphqlUrl(root, statusId, queryId), { headers: graphqlHeaders(bearerToken, guestToken) }, STATUS_TIMEOUT_MS)
}

export const graphqlFetchTweetById = async (
  statusId: string,
  queryId: string,
  bearerToken: string,
  guestToken: string,
): Promise<unknown> => {
  const attempts = [X_API_ROOT, TWITTER_API_ROOT]
  const errors: string[] = []
  for (const root of attempts) {
    const response = await fetchGraphql(root, statusId, queryId, bearerToken, guestToken)
    if (response.status === HTTP_TOO_MANY_REQUESTS) {
      clearGuestToken()
      errors.push(`rate limited at ${root}`)
      continue
    }
    if (!response.ok) {
      errors.push(`${root} HTTP ${response.status}`)
      continue
    }
    return await response.json()
  }
  throw new Error(`Tweet query failed. ${errors.join(' | ')}`)
}
