import { DEFAULT_BEARER_TOKEN, DEFAULT_TWEET_RESULT_QUERY_ID } from './constants'

export interface WorkerState {
  bearerToken: string | null
  guestToken: string | null
  guestTokenExpiresAt: number
  queryResolvedAt: number
  tweetResultQueryId: string | null
}

export const state: WorkerState = {
  bearerToken: DEFAULT_BEARER_TOKEN,
  guestToken: null,
  guestTokenExpiresAt: 0,
  queryResolvedAt: 0,
  tweetResultQueryId: DEFAULT_TWEET_RESULT_QUERY_ID,
}

export const clearGuestToken = (): void => {
  state.guestToken = null
  state.guestTokenExpiresAt = 0
}
