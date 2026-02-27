const STATUS_TIMEOUT_MS = 15000
const ARTICLE_TIMEOUT_MS = 20000
const FX_THREAD_LIMIT = 40

const TWITTER_ROOT = 'https://x.com'
const TWITTER_API_ROOT = 'https://api.twitter.com'
const MAIN_SCRIPT_URL = 'https://x.com'
const QUERY_CACHE_TTL_MS = 6 * 60 * 60 * 1000
const GUEST_TOKEN_TTL_MS = 2 * 60 * 60 * 1000

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
const SEC_CH_UA = '"Not?A_Brand";v="8", "Chromium";v="140", "Google Chrome";v="140"'

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

const QUERY_FIELD_TOGGLES = {
  withArticleRichContentState: true,
  withArticlePlainText: false,
  withGrokAnalyze: false,
  withDisallowedReplyControls: false,
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
  queryId: null,
  queryResolvedAt: 0,
  guestToken: null,
  guestTokenExpiresAt: 0,
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

const resolveQueryAndBearer = async () => {
  const now = Date.now()
  if (state.queryId && state.bearerToken && now - state.queryResolvedAt < QUERY_CACHE_TTL_MS) {
    return {
      queryId: state.queryId,
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
  const queryMatch = scriptText.match(/queryId:"([^"]+)",operationName:"TweetResultByRestId"/)
  if (!queryMatch) {
    throw new Error('Could not resolve TweetResultByRestId query id.')
  }

  state.queryId = queryMatch[1]
  state.bearerToken = bearerMatch?.[0] || DEFAULT_BEARER_TOKEN
  state.queryResolvedAt = now

  return {
    queryId: state.queryId,
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

const graphqlFetchTweetById = async (statusId, queryId, bearerToken, guestToken) => {
  const variables = {
    ...QUERY_VARIABLES,
    tweetId: statusId,
  }

  let url = `${TWITTER_API_ROOT}/graphql/${queryId}/TweetResultByRestId`
  url += `?variables=${encodeURIComponent(JSON.stringify(variables))}`
  url += `&features=${encodeURIComponent(JSON.stringify(QUERY_FEATURES))}`
  url += `&fieldToggles=${encodeURIComponent(JSON.stringify(QUERY_FIELD_TOGGLES))}`

  const csrfToken = crypto.randomUUID().replace(/-/g, '')
  const response = await fetchWithTimeout(
    url,
    {
      headers: {
        authorization: `Bearer ${bearerToken}`,
        'x-twitter-client-language': 'en',
        'x-twitter-active-user': 'yes',
        'x-guest-token': guestToken,
        'x-csrf-token': csrfToken,
        cookie: `guest_id=v1%3A${guestToken}; guest_id_ads=v1%3A${guestToken}; guest_id_marketing=v1%3A${guestToken}; gt=${guestToken}; ct0=${csrfToken};`,
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
    },
    STATUS_TIMEOUT_MS,
  )

  if (response.status === 429) {
    state.guestToken = null
    state.guestTokenExpiresAt = 0
    throw new Error('Rate limited by X (HTTP 429).')
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Tweet query failed (HTTP ${response.status}). ${text.slice(0, 180)}`.trim())
  }

  return await response.json()
}

const unwrapTweetResult = raw => {
  let node = raw?.data?.tweetResult?.result || raw?.tweetResult?.result || raw?.data?.tweetResult || null

  if (!node) {
    return null
  }

  if (node?.result) {
    node = node.result
  }
  if (node?.tweet) {
    node = node.tweet
  }
  if (node?.__typename === 'TweetWithVisibilityResults' && node?.tweet) {
    node = node.tweet
  }

  if (node?.legacy?.retweeted_status_result?.result) {
    node = node.legacy.retweeted_status_result.result
  }

  return node
}

const toAuthor = tweetNode => {
  const rawUser = tweetNode?.core?.user_results?.result || tweetNode?.core?.user_result?.result || {}
  const user = rawUser?.result || rawUser
  const legacy = user?.legacy || {}
  const core = user?.core || {}
  const screenName = firstString(core?.screen_name, legacy?.screen_name) || 'unknown'
  const profileImage = firstString(user?.avatar?.image_url, legacy?.profile_image_url_https)

  return {
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

  const plainText = firstString(rawArticle?.content_state?.plain_text, rawArticle?.preview_text) || ''
  const blocks = chunkParagraphs(plainText).map(block => ({ type: 'unstyled', text: block.text }))

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
    source_url: statusUrl,
    article,
    media_entities: media.media_entities,
    media: media.media,
  }
}

const fetchThreadloomStatus = async statusId => {
  const normalizedStatusId = normalizeStatusId(statusId)
  if (!normalizedStatusId) {
    throw new Error('status parser HTTP 400')
  }

  try {
    const { queryId, bearerToken } = await resolveQueryAndBearer()
    let guestToken = await activateGuestToken(bearerToken)
    let raw

    try {
      raw = await graphqlFetchTweetById(normalizedStatusId, queryId, bearerToken, guestToken)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown query error.'
      if (message.includes('HTTP 429')) {
        guestToken = await activateGuestToken(bearerToken)
        raw = await graphqlFetchTweetById(normalizedStatusId, queryId, bearerToken, guestToken)
      } else {
        throw error
      }
    }

    const tweetNode = unwrapTweetResult(raw)
    if (!tweetNode || !tweetNode.legacy) {
      throw new Error('status parser HTTP 404')
    }

    return {
      code: 200,
      message: 'OK',
      tweet: toTweetPayload(tweetNode, normalizedStatusId),
    }
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
    replyingToStatusId: toStatusId(tweet ? tweet.replying_to_status : null),
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

  return {
    payloads: payloads.reverse(),
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
