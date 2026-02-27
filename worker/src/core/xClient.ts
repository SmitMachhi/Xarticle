import {
  GRAPHQL_HEDGE_DELAY_MS,
  GUEST_TOKEN_TTL_MS,
  HTTP_BAD_REQUEST,
  HTTP_NOT_FOUND,
  HTTP_TOO_MANY_REQUESTS,
  HTTP_UNAUTHORIZED,
  MAIN_SCRIPT_URL,
  QUERY_FEATURES,
  QUERY_FIELD_TOGGLES,
  QUERY_VARIABLES,
  STATUS_TIMEOUT_MS,
  TWITTER_API_ROOT,
  X_API_ROOT,
} from './constants'
import {
  clearDurableGuestToken,
  readDurableGuestToken,
  readDurableQueryState,
  writeDurableGuestToken,
  writeDurableQueryState,
} from './durableState'
import { withTimeout } from './http'
import { clearGuestToken, state } from './state'
import { graphqlHeaders,guestActivateHeaders } from './xHeaders'
import { readBearerToken, readMainScriptUrl, readQueryId } from './xParsing'

const STALE_QUERY_STATUSES = new Set([HTTP_BAD_REQUEST, HTTP_NOT_FOUND, HTTP_UNAUTHORIZED])
const GRAPHQL_ROOTS = [TWITTER_API_ROOT, X_API_ROOT] as const

interface GraphqlAttempt {
  error?: string
  response?: Response
  root: string
}

const hasGuestToken = (now: number): boolean => Boolean(state.guestToken && now < state.guestTokenExpiresAt)
const wait = async (durationMs: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, durationMs))
}
const toErrorMessage = (error: unknown): string => (error instanceof Error ? error.message : 'unknown upstream failure')
const setQueryState = (queryId: string, bearerToken: string, resolvedAt: number): void => {
  state.tweetResultQueryId = queryId
  state.bearerToken = bearerToken
  state.queryResolvedAt = resolvedAt
}

const fetchHomepageHtml = async (): Promise<string> => {
  const response = await withTimeout(MAIN_SCRIPT_URL, { headers: { accept: 'text/html,application/xhtml+xml' } }, STATUS_TIMEOUT_MS)
  if (!response.ok) throw new Error(`Failed to fetch X homepage (HTTP ${response.status}).`)
  return await response.text()
}

const refreshQueryAndBearer = async (): Promise<{ bearerToken: string; queryId: string }> => {
  const now = Date.now()
  const mainScriptUrl = readMainScriptUrl(await fetchHomepageHtml())
  if (!mainScriptUrl) throw new Error('Could not resolve X main script URL.')
  const scriptResponse = await withTimeout(mainScriptUrl, { headers: { accept: '*/*' } }, STATUS_TIMEOUT_MS)
  if (!scriptResponse.ok) throw new Error(`Failed to fetch X main script (HTTP ${scriptResponse.status}).`)
  const scriptText = await scriptResponse.text()
  const queryId = readQueryId(scriptText)
  if (!queryId) throw new Error('Could not resolve TweetResultByRestId query id.')
  const bearerToken = readBearerToken(scriptText)
  setQueryState(queryId, bearerToken, now)
  await writeDurableQueryState(bearerToken, queryId, now)
  return { bearerToken, queryId }
}

export const resolveQueryAndBearer = async (
  forceRefresh = false,
): Promise<{ bearerToken: string; queryId: string }> => {
  if (!forceRefresh && state.tweetResultQueryId && state.bearerToken) {
    return { queryId: state.tweetResultQueryId!, bearerToken: state.bearerToken! }
  }
  if (!forceRefresh) {
    const durableState = await readDurableQueryState()
    if (durableState) {
      setQueryState(durableState.queryId, durableState.bearerToken, durableState.resolvedAt)
      return { bearerToken: durableState.bearerToken, queryId: durableState.queryId }
    }
  }
  return await refreshQueryAndBearer()
}

export const activateGuestToken = async (bearerToken: string): Promise<string> => {
  const now = Date.now()
  if (hasGuestToken(now)) return state.guestToken!
  const durableGuestToken = await readDurableGuestToken()
  if (durableGuestToken) {
    state.guestToken = durableGuestToken.guestToken
    state.guestTokenExpiresAt = durableGuestToken.expiresAt
    return state.guestToken
  }
  const response = await withTimeout(`${TWITTER_API_ROOT}/1.1/guest/activate.json`, { method: 'POST', headers: guestActivateHeaders(bearerToken), body: '' }, STATUS_TIMEOUT_MS)
  if (!response.ok) throw new Error(`Guest token activation failed (HTTP ${response.status}).`)
  const payload = (await response.json()) as { guest_token?: unknown }
  if (typeof payload.guest_token !== 'string') throw new Error('Guest token activation returned an invalid payload.')
  state.guestToken = payload.guest_token
  state.guestTokenExpiresAt = now + GUEST_TOKEN_TTL_MS
  await writeDurableGuestToken(state.guestToken, state.guestTokenExpiresAt)
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

const fetchGraphqlAttempt = async (
  root: string,
  statusId: string,
  queryId: string,
  bearerToken: string,
  guestToken: string,
): Promise<GraphqlAttempt> => {
  try {
    return {
      root,
      response: await fetchGraphql(root, statusId, queryId, bearerToken, guestToken),
    }
  } catch (error) {
    return {
      root,
      error: toErrorMessage(error),
    }
  }
}

const fetchDelayedGraphqlAttempt = async (
  root: string,
  statusId: string,
  queryId: string,
  bearerToken: string,
  guestToken: string,
): Promise<GraphqlAttempt> => {
  await wait(GRAPHQL_HEDGE_DELAY_MS)
  return await fetchGraphqlAttempt(root, statusId, queryId, bearerToken, guestToken)
}

const attemptPayload = async (attempts: GraphqlAttempt[]): Promise<unknown> => {
  const errors: string[] = []
  const statuses: number[] = []
  for (const attempt of attempts) {
    if (!attempt.response) {
      errors.push(`${attempt.root} request failed (${attempt.error || 'unknown error'})`)
      continue
    }
    statuses.push(attempt.response.status)
    if (attempt.response.status === HTTP_TOO_MANY_REQUESTS) {
      clearGuestToken()
      await clearDurableGuestToken()
      errors.push(`rate limited at ${attempt.root}`)
      continue
    }
    if (!attempt.response.ok) {
      errors.push(`${attempt.root} HTTP ${attempt.response.status}`)
      continue
    }
    return await attempt.response.json()
  }
  if (statuses.length > 0 && statuses.every((status) => STALE_QUERY_STATUSES.has(status))) {
    throw new Error(`stale-query-id ${errors.join(' | ')}`)
  }
  throw new Error(`Tweet query failed. ${errors.join(' | ')}`)
}

export const graphqlFetchTweetById = async (
  statusId: string,
  queryId: string,
  bearerToken: string,
  guestToken: string,
): Promise<unknown> => {
  const [primaryRoot, secondaryRoot] = GRAPHQL_ROOTS
  const primaryAttempt = fetchGraphqlAttempt(primaryRoot, statusId, queryId, bearerToken, guestToken)
  const secondaryAttempt = fetchDelayedGraphqlAttempt(
    secondaryRoot,
    statusId,
    queryId,
    bearerToken,
    guestToken,
  )
  const firstAttempt = await Promise.race([primaryAttempt, secondaryAttempt])
  if (firstAttempt.response?.ok) {
    return await firstAttempt.response.json()
  }
  const secondAttempt = firstAttempt.root === primaryRoot ? await secondaryAttempt : await primaryAttempt
  return await attemptPayload([firstAttempt, secondAttempt])
}

export const resetGuestToken = async (): Promise<void> => {
  clearGuestToken()
  await clearDurableGuestToken()
}
