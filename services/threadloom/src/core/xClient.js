import {
  GUEST_TOKEN_TTL_MS,
  HOME_HEADERS,
  MAIN_SCRIPT_URL,
  QUERY_FEATURES,
  QUERY_FIELD_TOGGLES,
  QUERY_VARIABLES,
  QUERY_CACHE_TTL_MS,
  SCRIPT_HEADERS,
  TWITTER_API_ROOT,
} from './constants'
import { withTimeout } from './http'
import { guestActivateHeaders, graphqlHeaders } from './xHeaders'
import { readBearerToken, readMainScriptUrl, readQueryId } from './xParsing'
import { clearGuestToken, state } from './state'

const hasFreshQueryCache = now => {
  const fresh = now - state.queryResolvedAt < QUERY_CACHE_TTL_MS
  return Boolean(state.queryId && state.bearerToken && fresh)
}

const hasFreshGuestToken = now => {
  return Boolean(state.guestToken && now < state.guestTokenExpiresAt)
}

const saveQueryCache = (queryId, bearerToken, now) => {
  state.queryId = queryId
  state.bearerToken = bearerToken
  state.queryResolvedAt = now
}

const saveGuestToken = (guestToken, now) => {
  state.guestToken = guestToken
  state.guestTokenExpiresAt = now + GUEST_TOKEN_TTL_MS
}

const fetchHomepageHtml = async () => {
  const response = await withTimeout(MAIN_SCRIPT_URL, { headers: HOME_HEADERS })
  if (!response.ok) throw new Error(`Failed to fetch X homepage (HTTP ${response.status}).`)
  return await response.text()
}

const fetchMainScriptText = async scriptUrl => {
  const response = await withTimeout(scriptUrl, { headers: SCRIPT_HEADERS })
  if (!response.ok) throw new Error(`Failed to fetch X main script (HTTP ${response.status}).`)
  return await response.text()
}

const resolveQueryParts = scriptText => {
  const queryId = readQueryId(scriptText)
  if (!queryId) throw new Error('Could not resolve TweetResultByRestId query id.')
  return { queryId, bearerToken: readBearerToken(scriptText) }
}

export const resolveQueryAndBearer = async () => {
  const now = Date.now()
  if (hasFreshQueryCache(now)) return { queryId: state.queryId, bearerToken: state.bearerToken }
  const html = await fetchHomepageHtml()
  const mainScript = readMainScriptUrl(html)
  if (!mainScript) throw new Error('Could not resolve X main script URL.')
  const parts = resolveQueryParts(await fetchMainScriptText(mainScript))
  saveQueryCache(parts.queryId, parts.bearerToken, now)
  return parts
}

const parseGuestTokenPayload = payload => {
  const token = payload?.guest_token
  if (typeof token !== 'string') throw new Error('Guest token activation returned an invalid payload.')
  return token
}

export const activateGuestToken = async bearerToken => {
  const now = Date.now()
  if (hasFreshGuestToken(now)) return state.guestToken
  const init = { method: 'POST', headers: guestActivateHeaders(bearerToken), body: '' }
  const response = await withTimeout(`${TWITTER_API_ROOT}/1.1/guest/activate.json`, init)
  if (!response.ok) throw new Error(`Guest token activation failed (HTTP ${response.status}).`)
  const token = parseGuestTokenPayload(await response.json())
  saveGuestToken(token, now)
  return token
}

const graphqlUrl = (statusId, queryId) => {
  const query = `${TWITTER_API_ROOT}/graphql/${queryId}/TweetResultByRestId`
  const variables = encodeURIComponent(JSON.stringify({ ...QUERY_VARIABLES, tweetId: statusId }))
  const features = encodeURIComponent(JSON.stringify(QUERY_FEATURES))
  const toggles = encodeURIComponent(JSON.stringify(QUERY_FIELD_TOGGLES))
  return `${query}?variables=${variables}&features=${features}&fieldToggles=${toggles}`
}

const readErrorText = async response => {
  return (await response.text().catch(() => '')).slice(0, 180)
}

const failForGraphqlStatus = async response => {
  if (response.status === 429) {
    clearGuestToken()
    throw new Error('Rate limited by X (HTTP 429).')
  }
  if (!response.ok) throw new Error(`Tweet query failed (HTTP ${response.status}). ${(await readErrorText(response))}`.trim())
}

export const graphqlFetchTweetById = async (statusId, queryId, bearerToken, guestToken) => {
  const url = graphqlUrl(statusId, queryId)
  const response = await withTimeout(url, { headers: graphqlHeaders(bearerToken, guestToken) })
  await failForGraphqlStatus(response)
  return await response.json()
}
