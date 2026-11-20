import { DEFAULT_BEARER_TOKEN, DEFAULT_TWEET_RESULT_QUERY_ID } from './constants'

// What X hands a guest client. Each entry file creates one session at startup and passes it into
// handleExtract, so requests in the same isolate reuse it. Isolates never share it: only the guest
// token is also kept in the durable cache, and the transaction key is lost when the isolate restarts.
export interface XSession {
  bearerToken: string
  guestToken: string | null
  guestTokenExpiresAt: number
  queryId: string
  transactionKey: Uint8Array | null
}

export const createXSession = (): XSession => ({
  bearerToken: DEFAULT_BEARER_TOKEN,
  guestToken: null,
  guestTokenExpiresAt: 0,
  queryId: DEFAULT_TWEET_RESULT_QUERY_ID,
  transactionKey: null,
})
