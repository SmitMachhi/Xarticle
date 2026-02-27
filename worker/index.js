const STATUS_TIMEOUT_MS = 15000
const ARTICLE_TIMEOUT_MS = 20000
const FX_THREAD_LIMIT = 40
const MAX_TIMELINE_FETCH = 40
const MAX_TIMELINE_PAGES = 8

const TWITTER_ROOT = 'https://x.com'
const X_API_ROOT = 'https://api.x.com'
const TWITTER_API_ROOT = 'https://api.twitter.com'
const MAIN_SCRIPT_URL = 'https://x.com'
const QUERY_CACHE_TTL_MS = 6 * 60 * 60 * 1000
const GUEST_TOKEN_TTL_MS = 2 * 60 * 60 * 1000
const TRANSACTION_CACHE_TTL_MS = 6 * 60 * 60 * 1000

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36'
const SEC_CH_UA = '"Not?A_Brand";v="8", "Chromium";v="145", "Google Chrome";v="145"'

const DEFAULT_BEARER_TOKEN =
  'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA'

const QUERY_VARIABLES = {
  withCommunity: false,
  includePromotedContent: false,
  withVoice: false,
}

const QUERY_FEATURES = {
  creator_subscriptions_tweet_preview_api_enabled: true,
  premium_content_api_read_enabled: false,
  communities_web_enable_tweet_community_results_fetch: true,
  c9s_tweet_anatomy_moderator_badge_enabled: true,
  responsive_web_grok_analyze_button_fetch_trends_enabled: false,
  responsive_web_grok_analyze_post_followups_enabled: false,
  responsive_web_jetfuel_frame: true,
  responsive_web_grok_share_attachment_enabled: true,
  articles_preview_enabled: true,
  responsive_web_edit_tweet_api_enabled: true,
  graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
  view_counts_everywhere_api_enabled: true,
  longform_notetweets_consumption_enabled: true,
  responsive_web_twitter_article_tweet_consumption_enabled: true,
  tweet_awards_web_tipping_enabled: false,
  responsive_web_grok_show_grok_translated_post: false,
  responsive_web_grok_analysis_button_from_backend: true,
  creator_subscriptions_quote_tweet_preview_enabled: false,
  freedom_of_speech_not_reach_fetch_enabled: true,
  standardized_nudges_misinfo: true,
  tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
  longform_notetweets_rich_text_read_enabled: true,
  longform_notetweets_inline_media_enabled: true,
  payments_enabled: false,
  profile_label_improvements_pcf_label_in_post_enabled: true,
  rweb_tipjar_consumption_enabled: true,
  verified_phone_label_enabled: false,
  responsive_web_grok_image_annotation_enabled: true,
  responsive_web_grok_community_note_auto_translation_is_enabled: false,
  responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
  responsive_web_graphql_timeline_navigation_enabled: true,
  responsive_web_enhance_cards_enabled: false,
}

const USER_TIMELINE_FEATURES = {
  rweb_video_screen_enabled: false,
  profile_label_improvements_pcf_label_in_post_enabled: true,
  responsive_web_profile_redirect_enabled: false,
  rweb_tipjar_consumption_enabled: false,
  verified_phone_label_enabled: false,
  creator_subscriptions_tweet_preview_api_enabled: true,
  responsive_web_graphql_timeline_navigation_enabled: true,
  responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
  premium_content_api_read_enabled: false,
  communities_web_enable_tweet_community_results_fetch: true,
  c9s_tweet_anatomy_moderator_badge_enabled: true,
  responsive_web_grok_analyze_button_fetch_trends_enabled: false,
  responsive_web_grok_analyze_post_followups_enabled: false,
  responsive_web_jetfuel_frame: true,
  responsive_web_grok_share_attachment_enabled: true,
  responsive_web_grok_annotations_enabled: true,
  articles_preview_enabled: true,
  responsive_web_edit_tweet_api_enabled: true,
  graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
  view_counts_everywhere_api_enabled: true,
  longform_notetweets_consumption_enabled: true,
  responsive_web_twitter_article_tweet_consumption_enabled: true,
  tweet_awards_web_tipping_enabled: false,
  responsive_web_grok_show_grok_translated_post: false,
  responsive_web_grok_analysis_button_from_backend: true,
  post_ctas_fetch_enabled: true,
  freedom_of_speech_not_reach_fetch_enabled: true,
  standardized_nudges_misinfo: true,
  tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
  longform_notetweets_rich_text_read_enabled: true,
  longform_notetweets_inline_media_enabled: true,
  responsive_web_grok_image_annotation_enabled: true,
  responsive_web_grok_imagine_annotation_enabled: true,
  responsive_web_grok_community_note_auto_translation_is_enabled: false,
  responsive_web_enhance_cards_enabled: false,
}

const QUERY_FIELD_TOGGLES = {
  withArticleRichContentState: true,
  withArticlePlainText: true,
  withGrokAnalyze: false,
  withDisallowedReplyControls: false,
}

const USER_TIMELINE_FIELD_TOGGLES = {
  withArticlePlainText: true,
}

const STATUS_PATH_PATTERNS = [/\/[^/]+\/status\/(\d+)/i, /\/i\/status\/(\d+)/i]
const ARTICLE_PATH_PATTERNS = [/\/i\/articles\/([A-Za-z0-9_-]+)/i, /\/[^/]+\/articles\/([A-Za-z0-9_-]+)/i, /\/[^/]+\/article\/([A-Za-z0-9_-]+)/i]

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST,OPTIONS',
  'access-control-allow-headers': 'content-type',
}

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  ...CORS_HEADERS,
}

const state = {
  bearerToken: null,
  tweetResultQueryId: null,
  userTweetsAndRepliesQueryId: null,
  userTweetsQueryId: null,
  tweetDetailQueryId: null,
  queryResolvedAt: 0,
  guestToken: null,
  guestTokenExpiresAt: 0,
  transactionContext: null,
  transactionResolvedAt: 0,
}

const jsonResponse = (payload, status = 200) => {
  return new Response(JSON.stringify(payload), {
    status,
    headers: JSON_HEADERS,
  })
}

const fetchWithTimeout = async (url, init, timeoutMs) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

const normalizeStatusId = value => {
  if (typeof value !== 'string') {
    return null
  }
  const cleaned = value.trim()
  if (!/^\d+$/.test(cleaned)) {
    return null
  }
  return cleaned
}

const toStatusId = value => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(Math.trunc(value)) : null
  }
  if (typeof value === 'string') {
    const normalized = value.trim()
    return normalized || null
  }
  return null
}

const isXDomain = url => {
  const host = url.hostname.toLowerCase()
  return host === 'x.com' || host === 'www.x.com' || host === 'twitter.com' || host === 'www.twitter.com'
}

const extractStatusId = url => {
  for (const pattern of STATUS_PATH_PATTERNS) {
    const match = url.pathname.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }
  return null
}

const extractArticleId = url => {
  for (const pattern of ARTICLE_PATH_PATTERNS) {
    const match = url.pathname.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }
  return null
}

const normalizeImageUrl = input => {
  if (!input || typeof input !== 'string') {
    return null
  }
  const trimmed = input.trim()
  if (!trimmed.startsWith('http')) {
    return null
  }
  if (/[?&]name=/.test(trimmed)) {
    return trimmed
  }
  return `${trimmed}?name=orig`
}

const toUnixTimestamp = value => {
  if (typeof value !== 'string' || !value.trim()) {
    return null
  }
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) {
    return null
  }
  return Math.floor(parsed / 1000)
}

const firstString = (...values) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }
  return undefined
}

const firstNumber = (...values) => {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }
    if (typeof value === 'string' && value.trim() && /^\d+$/.test(value.trim())) {
      return Number.parseInt(value.trim(), 10)
    }
  }
  return undefined
}

const chunkParagraphs = text => {
  if (typeof text !== 'string') {
    return []
  }
  return text
    .split(/\n{2,}/)
    .map(part => part.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .map(part => ({ type: 'paragraph', text: part }))
}

const stripUrlFromTail = (text, expandedUrls) => {
  if (typeof text !== 'string') {
    return ''
  }
  let normalized = text.trim()
  for (const expandedUrl of expandedUrls) {
    const escaped = expandedUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    normalized = normalized.replace(new RegExp(`\\s*${escaped}\\s*$`, 'i'), '').trim()
  }
  return normalized
}

const extractMetaContent = (html, name) => {
  const regexes = [
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, 'i'),
  ]
  for (const regex of regexes) {
    const match = html.match(regex)
    if (match && match[1]) {
      return match[1]
    }
  }
  return null
}

const interpolate = (from, to, factor) => {
  return from.map((value, index) => value * (1 - factor) + to[index] * factor)
}

const convertRotationToMatrix = degrees => {
  const radians = degrees * Math.PI / 180
  return [Math.cos(radians), -Math.sin(radians), Math.sin(radians), Math.cos(radians)]
}

const isOdd = value => (value % 2 ? -1 : 0)

const floatToHex = valueInput => {
  const result = []
  let value = valueInput
  let quotient = Math.floor(value)
  const fraction = value - quotient

  while (quotient > 0) {
    const q = Math.floor(value / 16)
    const remainder = Math.floor(value - q * 16)
    if (remainder > 9) {
      result.unshift(String.fromCharCode(remainder + 55))
    } else {
      result.unshift(String(remainder))
    }
    value = q
    quotient = Math.floor(value)
  }

  if (fraction === 0) {
    return result.join('')
  }

  result.push('.')
  let frac = fraction
  let guard = 0
  while (frac > 0 && guard < 32) {
    frac *= 16
    const integer = Math.floor(frac)
    frac -= integer
    if (integer > 9) {
      result.push(String.fromCharCode(integer + 55))
    } else {
      result.push(String(integer))
    }
    guard += 1
  }

  return result.join('')
}

class Cubic {
  constructor(curves) {
    this.curves = curves
  }

  static calculate(a, b, m) {
    return 3 * a * (1 - m) * (1 - m) * m + 3 * b * (1 - m) * m * m + m * m * m
  }

  getValue(time) {
    let start = 0
    let end = 1
    let mid = 0

    if (time <= 0) {
      const startGrad = this.curves[0] > 0
        ? this.curves[1] / this.curves[0]
        : this.curves[1] === 0 && this.curves[2] > 0
          ? this.curves[3] / this.curves[2]
          : 0
      return startGrad * time
    }

    if (time >= 1) {
      const endGrad = this.curves[2] < 1
        ? (this.curves[3] - 1) / (this.curves[2] - 1)
        : this.curves[2] === 1 && this.curves[0] < 1
          ? (this.curves[1] - 1) / (this.curves[0] - 1)
          : 0
      return 1 + endGrad * (time - 1)
    }

    for (let i = 0; i < 64; i += 1) {
      mid = (start + end) / 2
      const estimate = Cubic.calculate(this.curves[0], this.curves[2], mid)
      if (Math.abs(time - estimate) < 0.00001) {
        return Cubic.calculate(this.curves[1], this.curves[3], mid)
      }
      if (estimate < time) {
        start = mid
      } else {
        end = mid
      }
    }

    return Cubic.calculate(this.curves[1], this.curves[3], mid)
  }
}

const parseTransactionContext = async homeHtml => {
  const key = extractMetaContent(homeHtml, 'twitter-site-verification')
  const ondemandMatch = homeHtml.match(/["']ondemand\.s["']:\s*["']([\w]+)["']/i)
  if (!key || !ondemandMatch?.[1]) {
    return null
  }

  const onDemandResponse = await fetchWithTimeout(
    `https://abs.twimg.com/responsive-web/client-web/ondemand.s.${ondemandMatch[1]}a.js`,
    {
      headers: {
        'user-agent': USER_AGENT,
        accept: '*/*',
      },
    },
    STATUS_TIMEOUT_MS,
  )

  if (!onDemandResponse.ok) {
    return null
  }

  const onDemandText = await onDemandResponse.text()
  const indices = []
  let indexMatch
  const indicesRegex = /\(\w\[(\d{1,2})\],\s*16\)/g
  while ((indexMatch = indicesRegex.exec(onDemandText)) !== null) {
    indices.push(Number.parseInt(indexMatch[1], 10))
  }

  if (indices.length < 2) {
    return null
  }

  const keyBytes = Array.from(Uint8Array.from(atob(key), char => char.charCodeAt(0)))

  const frameMatches = Array.from(homeHtml.matchAll(/<svg[^>]*id=["']loading-x-anim-(\d+)["'][^>]*>([\s\S]*?)<\/svg>/g))
  if (frameMatches.length < 4) {
    return null
  }

  const frameById = new Map(frameMatches.map(match => [Number.parseInt(match[1], 10), match[2]]))
  const selectedFrameIndex = keyBytes[5] % 4
  const selectedFrame = frameById.get(selectedFrameIndex) || frameMatches[selectedFrameIndex]?.[2]
  if (!selectedFrame) {
    return null
  }

  const paths = Array.from(selectedFrame.matchAll(/<path[^>]*d=["']([^"']+)["']/g)).map(match => match[1])
  if (paths.length < 2) {
    return null
  }

  const grid = paths[1]
    .slice(9)
    .split('C')
    .map(item => item.replace(/[^\d]+/g, ' ').trim())
    .filter(Boolean)
    .map(item => item.split(/\s+/).map(part => Number.parseInt(part, 10)))

  const rowIndex = indices[0]
  const keyByteIndices = indices.slice(1)
  const row = grid[keyBytes[rowIndex] % 16]

  if (!row || row.length < 8) {
    return null
  }

  const total = 4096
  const frameTime = keyByteIndices.map(index => keyBytes[index] % 16).reduce((acc, value) => acc * value, 1)
  const frameFactor = frameTime / total

  const solve = (value, minValue, maxValue, round) => {
    const result = value * (maxValue - minValue) / 255 + minValue
    return round ? Math.floor(result) : Number(result.toFixed(2))
  }

  const fromColor = [...row.slice(0, 3), 1]
  const toColor = [...row.slice(3, 6), 1]
  const toRotation = [solve(row[6], 60, 360, true)]
  const curves = row.slice(7).map((value, index) => solve(value, isOdd(index), 1, false))
  const cubic = new Cubic(curves)
  const interpolation = cubic.getValue(frameFactor)
  const color = interpolate(fromColor, toColor, interpolation).map(value => (value > 0 ? value : 0))
  const rotation = interpolate([0], toRotation, interpolation)
  const matrix = convertRotationToMatrix(rotation[0])

  const hex = []
  color.slice(0, -1).forEach(value => hex.push(Math.round(value).toString(16)))
  matrix.forEach(value => {
    let normalized = Number(value.toFixed(2))
    if (normalized < 0) {
      normalized = -normalized
    }
    const hexValue = floatToHex(normalized)
    if (!hexValue) {
      hex.push('0')
    } else if (hexValue.startsWith('.')) {
      hex.push(`0${hexValue}`.toLowerCase())
    } else {
      hex.push(hexValue.toLowerCase())
    }
  })
  hex.push('0', '0')

  const animationKey = hex.join('').replace(/[.-]/g, '')

  return {
    keyBytes,
    animationKey,
    keyword: 'obfiowerehiring',
    additionalRandom: 3,
  }
}

const resolveTransactionContext = async () => {
  const now = Date.now()
  if (state.transactionContext && now - state.transactionResolvedAt < TRANSACTION_CACHE_TTL_MS) {
    return state.transactionContext
  }

  const homeResponse = await fetchWithTimeout(
    MAIN_SCRIPT_URL,
    {
      headers: {
        'user-agent': USER_AGENT,
        accept: 'text/html,application/xhtml+xml',
      },
    },
    STATUS_TIMEOUT_MS,
  )

  if (!homeResponse.ok) {
    return null
  }

  const homeHtml = await homeResponse.text()
  const context = await parseTransactionContext(homeHtml)
  if (!context) {
    return null
  }

  state.transactionContext = context
  state.transactionResolvedAt = now
  return context
}

const generateTransactionId = async (method, path) => {
  const context = await resolveTransactionContext()
  if (!context) {
    return null
  }

  const now = Math.floor(Date.now() / 1000 - 1682924400)
  const timeBytes = [0, 1, 2, 3].map(index => (now >> (index * 8)) & 0xff)
  const hashInput = `${method}!${path}!${now}${context.keyword}${context.animationKey}`

  const hashData = new TextEncoder().encode(hashInput)
  const hashBytes = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', hashData)).slice(0, 16))
  const randomByte = Math.floor(Math.random() * 256)
  const combined = [...context.keyBytes, ...timeBytes, ...hashBytes, context.additionalRandom]
  const xored = combined.map(value => value ^ randomByte)
  const output = Uint8Array.from([randomByte, ...xored])

  return btoa(String.fromCharCode(...output)).replace(/=+$/g, '')
}

const resolveQueryAndBearer = async () => {
  const now = Date.now()
  if (
    state.tweetResultQueryId &&
    (state.userTweetsAndRepliesQueryId || state.userTweetsQueryId) &&
    state.bearerToken &&
    now - state.queryResolvedAt < QUERY_CACHE_TTL_MS
  ) {
    return {
      tweetResultQueryId: state.tweetResultQueryId,
      userTweetsAndRepliesQueryId: state.userTweetsAndRepliesQueryId,
      userTweetsQueryId: state.userTweetsQueryId,
      tweetDetailQueryId: state.tweetDetailQueryId,
      bearerToken: state.bearerToken,
    }
  }

  const pageResponse = await fetchWithTimeout(
    MAIN_SCRIPT_URL,
    {
      headers: {
        'user-agent': USER_AGENT,
        accept: 'text/html,application/xhtml+xml',
      },
    },
    STATUS_TIMEOUT_MS,
  )

  if (!pageResponse.ok) {
    throw new Error(`Failed to fetch X homepage (HTTP ${pageResponse.status}).`)
  }

  const html = await pageResponse.text()
  const mainScriptMatch = html.match(/https:\/\/abs\.twimg\.com\/responsive-web\/client-web\/main\.[^"]+\.js/)
  if (!mainScriptMatch) {
    throw new Error('Could not resolve X main script URL.')
  }

  const scriptResponse = await fetchWithTimeout(
    mainScriptMatch[0],
    {
      headers: {
        'user-agent': USER_AGENT,
        accept: '*/*',
      },
    },
    STATUS_TIMEOUT_MS,
  )

  if (!scriptResponse.ok) {
    throw new Error(`Failed to fetch X main script (HTTP ${scriptResponse.status}).`)
  }

  const scriptText = await scriptResponse.text()
  const bearerMatch = scriptText.match(/AAAAA[0-9A-Za-z%]{30,220}/)
  const tweetResultMatch = scriptText.match(/queryId:"([^"]+)",operationName:"TweetResultByRestId"/)
  const userTweetsAndRepliesMatch = scriptText.match(/queryId:"([^"]+)",operationName:"UserTweetsAndReplies"/)
  const userTweetsMatch = scriptText.match(/queryId:"([^"]+)",operationName:"UserTweets"/)
  const tweetDetailMatch = scriptText.match(/queryId:"([^"]+)",operationName:"TweetDetail"/)

  if (!tweetResultMatch || (!userTweetsAndRepliesMatch && !userTweetsMatch)) {
    throw new Error('Could not resolve required query IDs.')
  }

  state.tweetResultQueryId = tweetResultMatch[1]
  state.userTweetsAndRepliesQueryId = userTweetsAndRepliesMatch?.[1] || null
  state.userTweetsQueryId = userTweetsMatch?.[1] || null
  state.tweetDetailQueryId = tweetDetailMatch?.[1] || null
  state.bearerToken = bearerMatch?.[0] || DEFAULT_BEARER_TOKEN
  state.queryResolvedAt = now

  return {
    tweetResultQueryId: state.tweetResultQueryId,
    userTweetsAndRepliesQueryId: state.userTweetsAndRepliesQueryId,
    userTweetsQueryId: state.userTweetsQueryId,
    tweetDetailQueryId: state.tweetDetailQueryId,
    bearerToken: state.bearerToken,
  }
}

const activateGuestToken = async bearerToken => {
  const now = Date.now()
  if (state.guestToken && now < state.guestTokenExpiresAt) {
    return state.guestToken
  }

  const response = await fetchWithTimeout(
    `${TWITTER_API_ROOT}/1.1/guest/activate.json`,
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${bearerToken}`,
        'content-type': 'application/json',
        'x-twitter-client-language': 'en',
        'x-twitter-active-user': 'yes',
        'user-agent': USER_AGENT,
        'sec-ch-ua': SEC_CH_UA,
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        origin: TWITTER_ROOT,
        referer: `${TWITTER_ROOT}/home`,
        accept: '*/*',
        'cache-control': 'no-cache',
        pragma: 'no-cache',
        'sec-fetch-site': 'same-site',
        'sec-fetch-mode': 'cors',
        'sec-fetch-dest': 'empty',
      },
      body: '',
    },
    STATUS_TIMEOUT_MS,
  )

  if (!response.ok) {
    throw new Error(`Guest token activation failed (HTTP ${response.status}).`)
  }

  const payload = await response.json()
  if (!payload?.guest_token || typeof payload.guest_token !== 'string') {
    throw new Error('Guest token activation returned an invalid payload.')
  }

  state.guestToken = payload.guest_token
  state.guestTokenExpiresAt = now + GUEST_TOKEN_TTL_MS
  return state.guestToken
}

const buildGraphqlHeaders = async ({ bearerToken, guestToken, rootUrl, requestPath, includeTransaction }) => {
  const csrfToken = crypto.randomUUID().replace(/-/g, '')
  const headers = {
    authorization: `Bearer ${bearerToken}`,
    'x-twitter-client-language': 'en',
    'x-twitter-active-user': 'yes',
    'x-guest-token': guestToken,
    'x-csrf-token': csrfToken,
    'x-client-uuid': crypto.randomUUID(),
    cookie: `guest_id=v1%3A${guestToken}; guest_id_ads=v1%3A${guestToken}; guest_id_marketing=v1%3A${guestToken}; gt=${guestToken}; ct0=${csrfToken};`,
    'user-agent': USER_AGENT,
    'sec-ch-ua': SEC_CH_UA,
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    origin: TWITTER_ROOT,
    referer: `${TWITTER_ROOT}/`,
    accept: '*/*',
    'cache-control': 'no-cache',
    pragma: 'no-cache',
    'sec-fetch-site': 'same-site',
    'sec-fetch-mode': 'cors',
    'sec-fetch-dest': 'empty',
    'content-type': 'application/json',
  }

  if (includeTransaction) {
    try {
      const transactionId = await generateTransactionId('GET', requestPath)
      if (transactionId) {
        headers['x-client-transaction-id'] = transactionId
      }
    } catch {
      // Transaction generation is best-effort; fallback still works for api.twitter.com routes.
    }
  }

  return headers
}

const graphqlFetch = async ({
  root,
  queryId,
  queryName,
  variables,
  features,
  fieldToggles,
  bearerToken,
  guestToken,
  includeTransaction,
}) => {
  const requestPath = `/graphql/${queryId}/${queryName}`
  let url = `${root}${requestPath}`
  url += `?variables=${encodeURIComponent(JSON.stringify(variables))}`
  if (features) {
    url += `&features=${encodeURIComponent(JSON.stringify(features))}`
  }
  if (fieldToggles) {
    url += `&fieldToggles=${encodeURIComponent(JSON.stringify(fieldToggles))}`
  }

  const headers = await buildGraphqlHeaders({
    bearerToken,
    guestToken,
    rootUrl: root,
    requestPath,
    includeTransaction,
  })

  return await fetchWithTimeout(url, { headers }, STATUS_TIMEOUT_MS)
}

const parseGraphqlTweetNode = rawNode => {
  let node = rawNode

  if (!node || typeof node !== 'object') {
    return null
  }

  if (node.result) {
    node = node.result
  }
  if (node.tweet) {
    node = node.tweet
  }
  if (node.__typename === 'TweetWithVisibilityResults' && node.tweet) {
    node = node.tweet
  }
  if (node.legacy?.retweeted_status_result?.result) {
    node = node.legacy.retweeted_status_result.result
  }

  return node
}

const unwrapTweetResult = raw => {
  return parseGraphqlTweetNode(raw?.data?.tweetResult?.result || raw?.tweetResult?.result || raw?.data?.tweetResult)
}

const parseTimelineEntries = instructions => {
  const statuses = []
  const cursors = []

  const pushTimelineItem = itemContent => {
    if (!itemContent || typeof itemContent !== 'object') {
      return
    }

    const itemType = itemContent.__typename
    if (itemType === 'TimelineTweet') {
      const parsed = parseGraphqlTweetNode(itemContent.tweet_results?.result)
      if (parsed) {
        statuses.push(parsed)
      }
      return
    }

    if (itemType === 'TimelineTimelineCursor' && typeof itemContent.value === 'string') {
      cursors.push({
        cursorType: itemContent.cursorType || 'Unknown',
        value: itemContent.value,
      })
    }
  }

  const processContent = content => {
    if (!content || typeof content !== 'object') {
      return
    }

    if (content.__typename === 'TimelineTimelineItem') {
      pushTimelineItem(content.itemContent)
      return
    }

    if (content.__typename === 'TimelineTimelineModule' && Array.isArray(content.items)) {
      for (const moduleItem of content.items) {
        pushTimelineItem(moduleItem?.item?.itemContent)
      }
    }
  }

  for (const instruction of instructions || []) {
    if (!instruction || typeof instruction !== 'object') {
      continue
    }

    if (Array.isArray(instruction.entries)) {
      for (const entry of instruction.entries) {
        processContent(entry?.content)
      }
    }

    if (Array.isArray(instruction.moduleItems)) {
      for (const moduleItem of instruction.moduleItems) {
        processContent(moduleItem?.item)
      }
    }
  }

  return { statuses, cursors }
}

const toAuthor = tweetNode => {
  const rawUser = tweetNode?.core?.user_results?.result || tweetNode?.core?.user_result?.result || {}
  const user = rawUser?.result || rawUser
  const legacy = user?.legacy || {}
  const core = user?.core || {}
  const screenName = firstString(core?.screen_name, legacy?.screen_name) || 'unknown'
  const profileImage = firstString(user?.avatar?.image_url, legacy?.profile_image_url_https)

  return {
    id: firstString(user?.rest_id),
    name: firstString(core?.name, legacy?.name) || 'Unknown Author',
    screen_name: screenName,
    avatar_url: profileImage ? profileImage.replace('_normal.', '_400x400.') : undefined,
  }
}

const toMedia = tweetNode => {
  const legacy = tweetNode?.legacy || {}
  const extended = Array.isArray(legacy?.extended_entities?.media) ? legacy.extended_entities.media : []
  const regular = Array.isArray(legacy?.entities?.media) ? legacy.entities.media : []
  const combined = extended.length > 0 ? extended : regular
  const seen = new Set()
  const photos = []

  for (const media of combined) {
    if (media?.type !== 'photo') {
      continue
    }
    const image = normalizeImageUrl(firstString(media?.media_url_https, media?.media_url))
    if (!image || seen.has(image)) {
      continue
    }
    seen.add(image)
    photos.push(image)
  }

  return {
    media_entities: photos.map(url => ({ media_info: { original_img_url: url } })),
    media: {
      photos: photos.map(url => ({ url })),
      all: photos.map(url => ({ url })),
    },
  }
}

const toArticle = tweetNode => {
  const rawArticle = tweetNode?.article?.article_results?.result
  if (!rawArticle) {
    return undefined
  }

  const coverImageUrl = normalizeImageUrl(
    firstString(
      rawArticle?.cover_media?.media_url_https,
      rawArticle?.cover_media?.media_url,
      rawArticle?.cover_media?.original_info?.url,
    ),
  )

  const stateBlocks = Array.isArray(rawArticle?.content_state?.blocks) ? rawArticle.content_state.blocks : []
  const blocksFromState = stateBlocks
    .map(block => {
      const text = firstString(block?.text)
      if (!text) {
        return null
      }
      return {
        type: firstString(block?.type) || 'unstyled',
        text,
      }
    })
    .filter(Boolean)

  const plainText = firstString(rawArticle?.plain_text, rawArticle?.content_state?.plain_text, rawArticle?.preview_text) || ''
  const blocks = blocksFromState.length > 0
    ? blocksFromState
    : chunkParagraphs(plainText).map(block => ({ type: 'unstyled', text: block.text }))

  return {
    title: firstString(rawArticle?.title) || undefined,
    preview_text: firstString(rawArticle?.preview_text) || undefined,
    content: {
      blocks,
    },
    cover_media: coverImageUrl
      ? {
          media_info: {
            original_img_url: coverImageUrl,
          },
        }
      : undefined,
  }
}

const toTweetPayload = (tweetNode, requestedStatusId) => {
  const legacy = tweetNode?.legacy || {}
  const id = firstString(tweetNode?.rest_id, legacy?.id_str, requestedStatusId) || requestedStatusId
  const author = toAuthor(tweetNode)
  const statusUrl = `https://x.com/${author.screen_name}/status/${id}`
  const urls = Array.isArray(legacy?.entities?.urls) ? legacy.entities.urls : []
  const expandedUrls = urls.map(entity => firstString(entity?.expanded_url)).filter(Boolean)

  const rawText = firstString(tweetNode?.note_tweet?.note_tweet_results?.result?.text, legacy?.full_text, legacy?.text, '')
  const normalizedText = stripUrlFromTail(rawText, expandedUrls)

  const media = toMedia(tweetNode)
  const article = toArticle(tweetNode)
  const createdAt = firstString(legacy?.created_at)
  const createdTimestamp = toUnixTimestamp(createdAt)

  return {
    id,
    url: statusUrl,
    text: normalizedText,
    raw_text: {
      text: normalizedText,
    },
    author,
    replies: firstNumber(legacy?.reply_count) ?? null,
    retweets: firstNumber(legacy?.retweet_count) ?? null,
    likes: firstNumber(legacy?.favorite_count) ?? null,
    views: firstNumber(tweetNode?.views?.count, tweetNode?.view_count_info?.count) ?? null,
    bookmarks: firstNumber(legacy?.bookmark_count) ?? null,
    created_at: createdAt,
    created_timestamp: createdTimestamp ?? null,
    replying_to_status: firstString(legacy?.in_reply_to_status_id_str) || null,
    conversation_id: firstString(legacy?.conversation_id_str) || null,
    source_url: statusUrl,
    article,
    media_entities: media.media_entities,
    media: media.media,
  }
}

const toStatusPayload = tweetNode => {
  const statusId = firstString(tweetNode?.rest_id, tweetNode?.legacy?.id_str)
  return {
    code: 200,
    message: 'OK',
    tweet: toTweetPayload(tweetNode, statusId || 'unknown'),
  }
}

const graphqlFetchTweetById = async (statusId, queryId, bearerToken, guestToken) => {
  const variables = {
    ...QUERY_VARIABLES,
    tweetId: statusId,
  }

  const attempts = [
    { root: X_API_ROOT, includeTransaction: true },
    { root: TWITTER_API_ROOT, includeTransaction: false },
  ]

  const errors = []

  for (const attempt of attempts) {
    const response = await graphqlFetch({
      root: attempt.root,
      queryId,
      queryName: 'TweetResultByRestId',
      variables,
      features: QUERY_FEATURES,
      fieldToggles: QUERY_FIELD_TOGGLES,
      bearerToken,
      guestToken,
      includeTransaction: attempt.includeTransaction,
    })

    if (response.status === 429) {
      state.guestToken = null
      state.guestTokenExpiresAt = 0
      errors.push(`rate limited at ${attempt.root}`)
      continue
    }

    if (!response.ok) {
      errors.push(`${attempt.root} HTTP ${response.status}`)
      continue
    }

    return await response.json()
  }

  throw new Error(`Tweet query failed. ${errors.join(' | ')}`)
}

const graphqlFetchUserTweetsAndReplies = async ({ authorId, cursor, queryId, bearerToken, guestToken }) => {
  const variables = {
    userId: authorId,
    count: MAX_TIMELINE_FETCH,
    includePromotedContent: true,
    withCommunity: true,
    withVoice: true,
    ...(cursor ? { cursor } : {}),
  }

  const attempts = [
    { root: X_API_ROOT, includeTransaction: true, queryName: 'UserTweetsAndReplies' },
    { root: TWITTER_API_ROOT, includeTransaction: false, queryName: 'UserTweetsAndReplies' },
    { root: TWITTER_API_ROOT, includeTransaction: false, queryName: 'UserTweets' },
  ]
  const errors = []

  for (const attempt of attempts) {
    const response = await graphqlFetch({
      root: attempt.root,
      queryId,
      queryName: attempt.queryName,
      variables,
      features: USER_TIMELINE_FEATURES,
      fieldToggles: USER_TIMELINE_FIELD_TOGGLES,
      bearerToken,
      guestToken,
      includeTransaction: attempt.includeTransaction,
    })

    if (response.status === 429) {
      state.guestToken = null
      state.guestTokenExpiresAt = 0
      errors.push(`rate limited at ${attempt.root}`)
      continue
    }

    if (!response.ok) {
      errors.push(`${attempt.queryName} on ${attempt.root} HTTP ${response.status}`)
      continue
    }

    return await response.json()
  }

  throw new Error(`User timeline query failed. ${errors.join(' | ')}`)
}

const fetchThreadloomStatus = async statusId => {
  const normalizedStatusId = normalizeStatusId(statusId)
  if (!normalizedStatusId) {
    throw new Error('status parser HTTP 400')
  }

  try {
    const { tweetResultQueryId, bearerToken } = await resolveQueryAndBearer()
    const guestToken = await activateGuestToken(bearerToken)
    const raw = await graphqlFetchTweetById(normalizedStatusId, tweetResultQueryId, bearerToken, guestToken)
    const tweetNode = unwrapTweetResult(raw)

    if (!tweetNode || !tweetNode.legacy) {
      throw new Error('status parser HTTP 404')
    }

    return toStatusPayload(tweetNode)
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (message.startsWith('status parser HTTP ')) {
      throw error
    }
    throw new Error('status parser HTTP 502')
  }
}

const getThreadMeta = payload => {
  const tweet = payload && typeof payload === 'object' ? payload.tweet : undefined
  const screenName = tweet && tweet.author && typeof tweet.author.screen_name === 'string' ? tweet.author.screen_name.trim().toLowerCase() : ''
  return {
    statusId: toStatusId(tweet ? tweet.id : null),
    authorHandle: screenName,
    authorId: typeof tweet?.author?.id === 'string' ? tweet.author.id : null,
    replyingToStatusId: toStatusId(tweet ? tweet.replying_to_status : null),
  }
}

const dedupePayloads = payloads => {
  const byId = new Map()
  for (const payload of payloads) {
    const id = toStatusId(payload?.tweet?.id)
    if (!id || byId.has(id)) {
      continue
    }
    byId.set(id, payload)
  }
  return Array.from(byId.values())
}

const fetchForwardThreadFromAuthorTimeline = async (seedPayload, warnings) => {
  const seedMeta = getThreadMeta(seedPayload)
  if (!seedMeta.authorId || !seedMeta.statusId) {
    return []
  }

  try {
    const { userTweetsAndRepliesQueryId, userTweetsQueryId, bearerToken } = await resolveQueryAndBearer()
    const timelineQueryId = userTweetsAndRepliesQueryId || userTweetsQueryId
    if (!timelineQueryId) {
      return []
    }

    const guestToken = await activateGuestToken(bearerToken)
    const descendants = []
    const seedConversationId = firstString(seedPayload?.tweet?.conversation_id) || seedMeta.statusId
    const seen = new Set([seedMeta.statusId, ...(seedPayload?.tweet?.id ? [seedPayload.tweet.id] : [])])
    const byReplyTo = new Map()
    let current = seedMeta.statusId
    let cursor = null
    let pageCount = 0

    while (descendants.length < FX_THREAD_LIMIT - 1 && pageCount < MAX_TIMELINE_PAGES) {
      const timelineRaw = await graphqlFetchUserTweetsAndReplies({
        authorId: seedMeta.authorId,
        cursor,
        queryId: timelineQueryId,
        bearerToken,
        guestToken,
      })
      const instructions =
        timelineRaw?.data?.user?.result?.timeline_v2?.timeline?.instructions ||
        timelineRaw?.data?.user?.result?.timeline?.timeline?.instructions ||
        []
      const { statuses, cursors } = parseTimelineEntries(instructions)

      for (const node of statuses) {
        const authorId = firstString(node?.core?.user_results?.result?.rest_id)
        if (!authorId || authorId !== seedMeta.authorId) {
          continue
        }

        const id = firstString(node?.rest_id, node?.legacy?.id_str)
        const replyTo = firstString(node?.legacy?.in_reply_to_status_id_str)
        const conversationId = firstString(node?.legacy?.conversation_id_str, id)
        if (!id || !replyTo || conversationId !== seedConversationId || seen.has(id) || byReplyTo.has(replyTo)) {
          continue
        }
        byReplyTo.set(replyTo, node)
      }

      let chainedInThisPage = false
      let nextNode = byReplyTo.get(current)
      if (nextNode) {
        let nextId = firstString(nextNode?.rest_id, nextNode?.legacy?.id_str)
        while (nextNode && nextId && !seen.has(nextId) && descendants.length < FX_THREAD_LIMIT - 1) {
          descendants.push(toStatusPayload(nextNode))
          seen.add(nextId)
          current = nextId
          chainedInThisPage = true
          nextNode = byReplyTo.get(current)
          nextId = firstString(nextNode?.rest_id, nextNode?.legacy?.id_str)
          if (!nextNode || !nextId || seen.has(nextId)) {
            break
          }
        }
      }

      if (descendants.length >= FX_THREAD_LIMIT - 1) {
        break
      }

      const nextCursor = cursors.find(item => item.cursorType === 'Bottom' || item.cursorType === 'ShowMore')
      if (!nextCursor?.value) {
        break
      }

      if (!chainedInThisPage && cursor === nextCursor.value) {
        break
      }

      cursor = nextCursor.value
      pageCount += 1
    }

    return descendants
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown timeline fetch error'
    warnings.push(`Forward thread discovery skipped: ${message}`)
    return []
  }
}

const fetchStatusWithThreadChain = async statusId => {
  const warnings = []
  const seedPayload = await fetchThreadloomStatus(statusId)
  const payloads = [seedPayload]
  const seedMeta = getThreadMeta(seedPayload)

  if (!seedMeta.statusId || !seedMeta.authorHandle) {
    return {
      payloads,
      warnings: ['Thread auto-detection skipped due to missing status metadata.'],
      threadLimitReached: false,
    }
  }

  let currentParentId = seedMeta.replyingToStatusId
  let threadLimitReached = false

  while (currentParentId) {
    if (payloads.length >= FX_THREAD_LIMIT) {
      threadLimitReached = true
      break
    }

    try {
      const parentPayload = await fetchThreadloomStatus(currentParentId)
      const parentMeta = getThreadMeta(parentPayload)
      if (!parentMeta.statusId) {
        warnings.push(`Thread chain stopped early because a parent payload was incomplete (${currentParentId}).`)
        break
      }
      if (!parentMeta.authorHandle || parentMeta.authorHandle !== seedMeta.authorHandle) {
        break
      }
      payloads.push(parentPayload)
      currentParentId = parentMeta.replyingToStatusId
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown status parser error'
      warnings.push(`Thread chain stopped early while fetching ${currentParentId}: ${message}`)
      break
    }
  }

  const forwardPayloads = await fetchForwardThreadFromAuthorTimeline(seedPayload, warnings)
  for (const payload of forwardPayloads) {
    if (payloads.length >= FX_THREAD_LIMIT) {
      threadLimitReached = true
      break
    }
    payloads.push(payload)
  }

  return {
    payloads: dedupePayloads(payloads).sort((a, b) => {
      const aTime = Number(a?.tweet?.created_timestamp || 0)
      const bTime = Number(b?.tweet?.created_timestamp || 0)
      return aTime - bTime
    }),
    warnings,
    threadLimitReached,
  }
}

const parseInputUrl = value => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('Missing URL.')
  }
  const withProtocol = /^https?:\/\//i.test(value.trim()) ? value.trim() : `https://${value.trim()}`
  return new URL(withProtocol)
}

const handleExtract = async request => {
  const body = await request.json().catch(() => null)
  const parsedUrl = parseInputUrl(body ? body.url : '')

  if (!isXDomain(parsedUrl)) {
    throw new Error('Only x.com and twitter.com links are supported.')
  }

  const statusId = extractStatusId(parsedUrl)
  if (statusId) {
    const result = await fetchStatusWithThreadChain(statusId)
    return jsonResponse({
      kind: 'status',
      payloads: result.payloads,
      warnings: result.warnings,
      threadLimitReached: result.threadLimitReached,
    })
  }

  const articleId = extractArticleId(parsedUrl)
  if (!articleId) {
    throw new Error('This URL does not point to a supported status or article.')
  }

  const articleResponse = await fetchWithTimeout(
    parsedUrl.toString(),
    {
      method: 'GET',
      redirect: 'follow',
      headers: {
        accept: 'text/html,application/xhtml+xml',
      },
    },
    ARTICLE_TIMEOUT_MS,
  )

  if (!articleResponse.ok) {
    throw new Error(`article fetch HTTP ${articleResponse.status}`)
  }

  const html = await articleResponse.text()
  if (!html.trim()) {
    throw new Error('Article page did not return HTML content.')
  }

  return jsonResponse({
    kind: 'article-html',
    html,
    finalUrl: articleResponse.url || parsedUrl.toString(),
    warnings: [],
  })
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS })
    }

    const url = new URL(request.url)
    if (request.method === 'POST' && url.pathname === '/api/extract') {
      try {
        return await handleExtract(request)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Extraction failed.'
        return jsonResponse({ error: message }, 400)
      }
    }

    if (request.method === 'GET' && url.pathname === '/health') {
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ error: 'Not found.' }, 404)
  },
}
