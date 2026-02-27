export interface WorkerState {
  bearerToken: string | null
  guestToken: string | null
  guestTokenExpiresAt: number
  queryResolvedAt: number
  tweetResultQueryId: string | null
}

export const state: WorkerState = {
  bearerToken: null,
  guestToken: null,
  guestTokenExpiresAt: 0,
  queryResolvedAt: 0,
  tweetResultQueryId: null,
}

export const clearGuestToken = (): void => {
  state.guestToken = null
  state.guestTokenExpiresAt = 0
}
