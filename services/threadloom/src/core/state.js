export const state = {
  bearerToken: null,
  queryId: null,
  queryResolvedAt: 0,
  guestToken: null,
  guestTokenExpiresAt: 0,
}

export const clearGuestToken = () => {
  state.guestToken = null
  state.guestTokenExpiresAt = 0
}
