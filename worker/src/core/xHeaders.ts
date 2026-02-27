import { SEC_CH_UA, TWITTER_ROOT, USER_AGENT } from './constants'

const guestCookie = (guestToken: string, csrfToken: string): string => {
  return `guest_id=v1%3A${guestToken}; guest_id_ads=v1%3A${guestToken}; guest_id_marketing=v1%3A${guestToken}; gt=${guestToken}; ct0=${csrfToken};`
}

export const guestActivateHeaders = (bearerToken: string): Record<string, string> => {
  return {
    accept: '*/*',
    authorization: `Bearer ${bearerToken}`,
    'cache-control': 'no-cache',
    'content-type': 'application/json',
    origin: TWITTER_ROOT,
    pragma: 'no-cache',
    referer: `${TWITTER_ROOT}/home`,
    'sec-ch-ua': SEC_CH_UA,
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-site',
    'user-agent': USER_AGENT,
    'x-twitter-active-user': 'yes',
    'x-twitter-client-language': 'en',
  }
}

export const graphqlHeaders = (bearerToken: string, guestToken: string): Record<string, string> => {
  const csrfToken = crypto.randomUUID().replace(/-/g, '')
  return {
    ...guestActivateHeaders(bearerToken),
    cookie: guestCookie(guestToken, csrfToken),
    'x-csrf-token': csrfToken,
    'x-guest-token': guestToken,
  }
}
