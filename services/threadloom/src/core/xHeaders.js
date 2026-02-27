import { BASE_API_HEADERS } from './constants'

export const guestActivateHeaders = bearerToken => {
  return { ...BASE_API_HEADERS, authorization: `Bearer ${bearerToken}`, 'content-type': 'application/json' }
}

const guestCookie = (guestToken, csrfToken) => {
  return `guest_id=v1%3A${guestToken}; guest_id_ads=v1%3A${guestToken}; guest_id_marketing=v1%3A${guestToken}; gt=${guestToken}; ct0=${csrfToken};`
}

export const graphqlHeaders = (bearerToken, guestToken) => {
  const csrfToken = crypto.randomUUID().replace(/-/g, '')
  return {
    ...BASE_API_HEADERS,
    authorization: `Bearer ${bearerToken}`,
    'x-guest-token': guestToken,
    'x-csrf-token': csrfToken,
    cookie: guestCookie(guestToken, csrfToken),
  }
}
