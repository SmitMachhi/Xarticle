import {
  DEFAULT_BEARER_TOKEN,
  DEFAULT_TWEET_RESULT_QUERY_ID,
  GRAPHQL_HEDGE_DELAY_MS,
  GUEST_TOKEN_TTL_MS,
  HTTP_BAD_REQUEST,
  HTTP_FORBIDDEN,
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
import { clearDurableGuestToken, readDurableGuestToken, writeDurableGuestToken } from './durableState'
import { withTimeout } from './http'
import type { XSession } from './session'
import { computeTransactionId, graphqlHeaders, guestActivateHeaders } from './xHeaders'
import { readBearerToken, readMainScriptUrl, readQueryId, readTransactionKey } from './xParsing'

const STALE_QUERY_STATUSES = new Set([HTTP_BAD_REQUEST, HTTP_FORBIDDEN, HTTP_NOT_FOUND, HTTP_UNAUTHORIZED])
const GRAPHQL_ROOTS = [TWITTER_API_ROOT, X_API_ROOT] as const
const FALLBACK_QUERY: Pick<XSession, 'bearerToken' | 'queryId'> = { bearerToken: DEFAULT_BEARER_TOKEN, queryId: DEFAULT_TWEET_RESULT_QUERY_ID }

interface GraphqlRequest {
  guestToken: string
  session: XSession
  statusId: string
}

interface GraphqlAttempt {
  error?: string
  response?: Response
  root: string
}

const wait = async (durationMs: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, durationMs))
}
const toErrorMessage = (error: unknown): string => (error instanceof Error ? error.message : 'unknown upstream failure')

const fetchText = async (url: string, accept: string): Promise<string> => {
  const response = await withTimeout(url, { headers: { accept } }, STATUS_TIMEOUT_MS)
  if (!response.ok) throw new Error(`Failed to fetch ${url} (HTTP ${response.status}).`)
  return await response.text()
}

const resolveFromMainScript = async (): Promise<Pick<XSession, 'bearerToken' | 'queryId' | 'transactionKey'> | null> => {
  const mainScriptUrl = readMainScriptUrl(await fetchText(MAIN_SCRIPT_URL, 'text/html,application/xhtml+xml'))
  if (!mainScriptUrl) return null
  const scriptText = await fetchText(mainScriptUrl, '*/*')
  const queryId = readQueryId(scriptText)
  if (!queryId) return null
  return { bearerToken: readBearerToken(scriptText), queryId, transactionKey: readTransactionKey(scriptText) }
}

// The x-web bundle has no compatible operation, so fall back to the known-good id instead of failing.
export const refreshQuery = async (session: XSession): Promise<void> => {
  const resolved = await resolveFromMainScript().catch(() => null)
  Object.assign(session, resolved ?? FALLBACK_QUERY)
}

const keepGuestToken = (session: XSession, guestToken: string, expiresAt: number): string => {
  session.guestToken = guestToken
  session.guestTokenExpiresAt = expiresAt
  return guestToken
}

const activateGuestToken = async (session: XSession): Promise<string> => {
  const now = Date.now()
  if (session.guestToken && now < session.guestTokenExpiresAt) return session.guestToken
  const durable = await readDurableGuestToken()
  if (durable) return keepGuestToken(session, durable.guestToken, durable.expiresAt)
  const response = await withTimeout(`${TWITTER_API_ROOT}/1.1/guest/activate.json`, { method: 'POST', headers: guestActivateHeaders(session.bearerToken), body: '' }, STATUS_TIMEOUT_MS)
  if (!response.ok) throw new Error(`Guest token activation failed (HTTP ${response.status}).`)
  const payload = (await response.json()) as { guest_token?: unknown }
  if (typeof payload.guest_token !== 'string') throw new Error('Guest token activation returned an invalid payload.')
  const expiresAt = now + GUEST_TOKEN_TTL_MS
  await writeDurableGuestToken(payload.guest_token, expiresAt)
  return keepGuestToken(session, payload.guest_token, expiresAt)
}

export const resetGuestToken = async (session: XSession): Promise<void> => {
  session.guestToken = null
  session.guestTokenExpiresAt = 0
  await clearDurableGuestToken()
}

const graphqlUrl = (root: string, statusId: string, queryId: string): string => {
  const query = `${root}/graphql/${queryId}/TweetResultByRestId`
  const variables = encodeURIComponent(JSON.stringify({ ...QUERY_VARIABLES, tweetId: statusId }))
  const features = encodeURIComponent(JSON.stringify(QUERY_FEATURES))
  const toggles = encodeURIComponent(JSON.stringify(QUERY_FIELD_TOGGLES))
  return `${query}?variables=${variables}&features=${features}&fieldToggles=${toggles}`
}

const fetchGraphql = async (root: string, { guestToken, session, statusId }: GraphqlRequest): Promise<Response> => {
  const txId = await computeTransactionId(session.transactionKey, 'GET', `/graphql/${session.queryId}/TweetResultByRestId`)
  return await withTimeout(graphqlUrl(root, statusId, session.queryId), { headers: graphqlHeaders(session.bearerToken, guestToken, txId) }, STATUS_TIMEOUT_MS)
}

const fetchGraphqlAttempt = async (root: string, request: GraphqlRequest): Promise<GraphqlAttempt> => {
  try {
    return { root, response: await fetchGraphql(root, request) }
  } catch (error) {
    return { root, error: toErrorMessage(error) }
  }
}

const fetchDelayedGraphqlAttempt = async (root: string, request: GraphqlRequest): Promise<GraphqlAttempt> => {
  await wait(GRAPHQL_HEDGE_DELAY_MS)
  return await fetchGraphqlAttempt(root, request)
}

const attemptPayload = async (session: XSession, attempts: GraphqlAttempt[]): Promise<unknown> => {
  const errors: string[] = []
  const statuses: number[] = []
  for (const attempt of attempts) {
    if (!attempt.response) {
      errors.push(`${attempt.root} request failed (${attempt.error || 'unknown error'})`)
      continue
    }
    statuses.push(attempt.response.status)
    if (attempt.response.status === HTTP_TOO_MANY_REQUESTS) {
      await resetGuestToken(session)
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

// Races both API roots, the second after a short delay, and returns the first good payload.
export const graphqlFetchTweetById = async (session: XSession, statusId: string): Promise<unknown> => {
  const request: GraphqlRequest = { guestToken: await activateGuestToken(session), session, statusId }
  const [primaryRoot, secondaryRoot] = GRAPHQL_ROOTS
  const primaryAttempt = fetchGraphqlAttempt(primaryRoot, request)
  const secondaryAttempt = fetchDelayedGraphqlAttempt(secondaryRoot, request)
  const firstAttempt = await Promise.race([primaryAttempt, secondaryAttempt])
  if (firstAttempt.response?.ok) return await firstAttempt.response.json()
  const secondAttempt = firstAttempt.root === primaryRoot ? await secondaryAttempt : await primaryAttempt
  return await attemptPayload(session, [firstAttempt, secondAttempt])
}
