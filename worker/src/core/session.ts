import { DEFAULT_BEARER_TOKEN, DEFAULT_TWEET_RESULT_QUERY_ID } from './constants'

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
