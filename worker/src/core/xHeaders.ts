import { SEC_CH_UA, TWITTER_ROOT, USER_AGENT } from './constants'

const guestCookie = (guestToken: string, csrfToken: string): string => {
  return `guest_id=v1%3A${guestToken}; guest_id_ads=v1%3A${guestToken}; guest_id_marketing=v1%3A${guestToken}; gt=${guestToken}; ct0=${csrfToken};`
}

const TX_ID_BYTES = 57
const TX_HMAC_PREFIX = 4
const TX_RANDOM_OFFSET = 9
const BYTE_MASK = 0xff
const U32_OVERFLOW = 0x100000000
const BYTE3_SHIFT = 0x1000000
const BITS_16 = 16
const BITS_8 = 8

const toBase64Url = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

export const computeTransactionId = async (key: Uint8Array | null, method: string, path: string): Promise<string> => {
  const ts = Date.now()
  const result = new Uint8Array(TX_ID_BYTES)
  if (key) {
    const ck = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const sig = new Uint8Array(await crypto.subtle.sign('HMAC', ck, new TextEncoder().encode(`${method}:${path}`)))
    result.set(sig.subarray(0, TX_HMAC_PREFIX), 0)
  } else {
    crypto.getRandomValues(result.subarray(0, TX_HMAC_PREFIX))
  }
  const hi = Math.floor(ts / U32_OVERFLOW)
  let idx = TX_HMAC_PREFIX
  result[idx++] = hi & BYTE_MASK
  result[idx++] = (ts / BYTE3_SHIFT >>> 0) & BYTE_MASK
  result[idx++] = (ts >>> BITS_16) & BYTE_MASK
  result[idx++] = (ts >>> BITS_8) & BYTE_MASK
  result[idx] = ts & BYTE_MASK
  crypto.getRandomValues(result.subarray(TX_RANDOM_OFFSET))
  return toBase64Url(result)
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

export const graphqlHeaders = (bearerToken: string, guestToken: string, transactionId: string): Record<string, string> => {
  const csrfToken = crypto.randomUUID().replace(/-/g, '')
  return {
    ...guestActivateHeaders(bearerToken),
    cookie: guestCookie(guestToken, csrfToken),
    'x-client-transaction-id': transactionId,
    'x-csrf-token': csrfToken,
    'x-guest-token': guestToken,
  }
}
