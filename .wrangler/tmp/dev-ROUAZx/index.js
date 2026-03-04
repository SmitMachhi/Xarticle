var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker/src/core/constants.ts
var ARTICLE_TIMEOUT_MS = 2e4;
var STATUS_TIMEOUT_MS = 15e3;
var QUERY_CACHE_TTL_MS = 216e5;
var GUEST_TOKEN_TTL_MS = 72e5;
var EXTRACT_CACHE_TTL_MS = 3e5;
var GRAPHQL_HEDGE_DELAY_MS = 350;
var MILLISECONDS_IN_SECOND = 1e3;
var TWITTER_ROOT = "https://x.com";
var X_API_ROOT = "https://api.x.com";
var TWITTER_API_ROOT = "https://api.twitter.com";
var MAIN_SCRIPT_URL = "https://x.com";
var WORKER_CACHE_ROOT = "https://worker-cache.internal";
var EXTRACT_CACHE_KEY_PREFIX = "extract-response";
var QUERY_STATE_CACHE_KEY = "x-query-state";
var GUEST_TOKEN_CACHE_KEY = "x-guest-token";
var USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36";
var SEC_CH_UA = '"Not?A_Brand";v="8", "Chromium";v="145", "Google Chrome";v="145"';
var DEFAULT_BEARER_TOKEN = "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";
var DEFAULT_TWEET_RESULT_QUERY_ID = "MWesEIcCNojpQu2VI6KOhA";
var QUERY_VARIABLES = {
  includePromotedContent: false,
  withCommunity: false,
  withVoice: false
};
var QUERY_FEATURES = {
  articles_preview_enabled: true,
  c9s_tweet_anatomy_moderator_badge_enabled: true,
  communities_web_enable_tweet_community_results_fetch: true,
  creator_subscriptions_quote_tweet_preview_enabled: false,
  creator_subscriptions_tweet_preview_api_enabled: true,
  freedom_of_speech_not_reach_fetch_enabled: true,
  graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
  longform_notetweets_consumption_enabled: true,
  longform_notetweets_inline_media_enabled: true,
  longform_notetweets_rich_text_read_enabled: true,
  payments_enabled: false,
  premium_content_api_read_enabled: false,
  profile_label_improvements_pcf_label_in_post_enabled: true,
  responsive_web_edit_tweet_api_enabled: true,
  responsive_web_enhance_cards_enabled: false,
  responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
  responsive_web_graphql_timeline_navigation_enabled: true,
  responsive_web_grok_analysis_button_from_backend: true,
  responsive_web_grok_analyze_button_fetch_trends_enabled: false,
  responsive_web_grok_analyze_post_followups_enabled: false,
  responsive_web_grok_community_note_auto_translation_is_enabled: false,
  responsive_web_grok_image_annotation_enabled: true,
  responsive_web_grok_share_attachment_enabled: true,
  responsive_web_grok_show_grok_translated_post: false,
  responsive_web_jetfuel_frame: true,
  responsive_web_twitter_article_tweet_consumption_enabled: true,
  rweb_tipjar_consumption_enabled: true,
  standardized_nudges_misinfo: true,
  tweet_awards_web_tipping_enabled: false,
  tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
  verified_phone_label_enabled: false,
  view_counts_everywhere_api_enabled: true
};
var QUERY_FIELD_TOGGLES = {
  withArticlePlainText: true,
  withArticleRichContentState: true,
  withDisallowedReplyControls: false,
  withGrokAnalyze: false
};
var ARTICLE_PATH_PATTERNS = [/\/i\/articles\/([A-Za-z0-9_-]+)/i, /\/[^/]+\/articles\/([A-Za-z0-9_-]+)/i, /\/[^/]+\/article\/([A-Za-z0-9_-]+)/i];
var STATUS_PATH_PATTERNS = [/\/[^/]+\/status\/(\d+)/i, /\/i\/status\/(\d+)/i];
var HTTP_BAD_REQUEST = 400;
var HTTP_NOT_FOUND = 404;
var HTTP_TOO_MANY_REQUESTS = 429;
var HTTP_BAD_GATEWAY = 502;
var HTTP_UNAUTHORIZED = 401;
var CORS_HEADERS = {
  "access-control-allow-headers": "content-type",
  "access-control-allow-methods": "POST,OPTIONS",
  "access-control-allow-origin": "*"
};
var JSON_HEADERS = {
  ...CORS_HEADERS,
  "cache-control": "no-store",
  "content-type": "application/json; charset=utf-8"
};

// worker/src/core/http.ts
var jsonResponse = /* @__PURE__ */ __name((payload, status = 200) => {
  return new Response(JSON.stringify(payload), { status, headers: JSON_HEADERS });
}, "jsonResponse");
var withTimeout = /* @__PURE__ */ __name(async (url, init, timeoutMs) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}, "withTimeout");

// worker/src/core/cacheStore.ts
var cacheRequest = /* @__PURE__ */ __name((key) => {
  return new Request(`${WORKER_CACHE_ROOT}/${encodeURIComponent(key)}`, { method: "GET" });
}, "cacheRequest");
var cacheResponse = /* @__PURE__ */ __name((payload, ttlSeconds) => {
  return new Response(JSON.stringify(payload), {
    headers: {
      "cache-control": `public, max-age=${ttlSeconds}`,
      "content-type": "application/json; charset=utf-8"
    }
  });
}, "cacheResponse");
var readCachedJson = /* @__PURE__ */ __name(async (key) => {
  try {
    const response = await caches.default.match(cacheRequest(key));
    if (!response) return null;
    return await response.json();
  } catch {
    return null;
  }
}, "readCachedJson");
var writeCachedJson = /* @__PURE__ */ __name(async (key, payload, ttlSeconds) => {
  try {
    await caches.default.put(cacheRequest(key), cacheResponse(payload, ttlSeconds));
  } catch {
    return;
  }
}, "writeCachedJson");
var deleteCachedJson = /* @__PURE__ */ __name(async (key) => {
  try {
    await caches.default.delete(cacheRequest(key));
  } catch {
    return;
  }
}, "deleteCachedJson");

// worker/src/core/extractCache.ts
var toCacheKey = /* @__PURE__ */ __name((sourceUrl) => `${EXTRACT_CACHE_KEY_PREFIX}:${sourceUrl}`, "toCacheKey");
var readExtractCache = /* @__PURE__ */ __name(async (sourceUrl) => {
  const cached = await readCachedJson(toCacheKey(sourceUrl));
  if (!cached || typeof cached.status !== "number") {
    return null;
  }
  return cached;
}, "readExtractCache");
var writeExtractCache = /* @__PURE__ */ __name(async (sourceUrl, status, payload) => {
  await writeCachedJson(
    toCacheKey(sourceUrl),
    { payload, status },
    Math.floor(EXTRACT_CACHE_TTL_MS / MILLISECONDS_IN_SECOND)
  );
}, "writeExtractCache");

// worker/src/core/primitives.ts
var firstString = /* @__PURE__ */ __name((...values) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return void 0;
}, "firstString");
var firstNumber = /* @__PURE__ */ __name((...values) => {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim() && /^\d+$/.test(value.trim())) {
      return Number.parseInt(value.trim(), 10);
    }
  }
  return void 0;
}, "firstNumber");
var normalizeImageUrl = /* @__PURE__ */ __name((input) => {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed.startsWith("http")) return null;
  return /[?&]name=/.test(trimmed) ? trimmed : `${trimmed}?name=orig`;
}, "normalizeImageUrl");
var toUnixTimestamp = /* @__PURE__ */ __name((value) => {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : Math.floor(parsed / MILLISECONDS_IN_SECOND);
}, "toUnixTimestamp");
var escapeRegex = /* @__PURE__ */ __name((value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "escapeRegex");
var stripUrlFromTail = /* @__PURE__ */ __name((text, expandedUrls2) => {
  let normalized = text.trim();
  for (const expandedUrl of expandedUrls2) {
    normalized = normalized.replace(new RegExp(`\\s*${escapeRegex(expandedUrl)}\\s*$`, "i"), "").trim();
  }
  return normalized;
}, "stripUrlFromTail");
var chunkParagraphs = /* @__PURE__ */ __name((text) => {
  return text.split(/\n{2,}/).map((part) => part.replace(/\s+/g, " ").trim()).filter(Boolean).map((part) => ({ type: "paragraph", text: part }));
}, "chunkParagraphs");

// worker/src/core/tweetMapper.ts
var asMap = /* @__PURE__ */ __name((value) => value && typeof value === "object" ? value : {}, "asMap");
var asArray = /* @__PURE__ */ __name((value) => Array.isArray(value) ? value : [], "asArray");
var pickMediaList = /* @__PURE__ */ __name((legacy) => {
  const extended = asArray(asMap(legacy.extended_entities).media);
  if (extended.length > 0) return extended;
  return asArray(asMap(legacy.entities).media);
}, "pickMediaList");
var normalizePhotoUrls = /* @__PURE__ */ __name((legacy) => {
  const seen = /* @__PURE__ */ new Set();
  const urls = [];
  for (const media of pickMediaList(legacy)) {
    const typed = asMap(media);
    if (typed.type !== "photo") continue;
    const image = normalizeImageUrl(firstString(typed.media_url_https, typed.media_url));
    if (!image || seen.has(image)) continue;
    seen.add(image);
    urls.push(image);
  }
  return urls;
}, "normalizePhotoUrls");
var userFromTweetNode = /* @__PURE__ */ __name((tweetNode) => {
  const core = asMap(tweetNode.core);
  const rawUser = asMap(asMap(core.user_results).result || asMap(core.user_result).result);
  return asMap(rawUser.result || rawUser);
}, "userFromTweetNode");
var resolveAuthorName = /* @__PURE__ */ __name((user, legacy) => {
  return firstString(asMap(user.core).name, legacy.name) || "Unknown Author";
}, "resolveAuthorName");
var resolveAuthorScreenName = /* @__PURE__ */ __name((user, legacy) => {
  return firstString(asMap(user.core).screen_name, legacy.screen_name) || "unknown";
}, "resolveAuthorScreenName");
var resolveAuthorAvatar = /* @__PURE__ */ __name((user, legacy) => {
  const avatar = firstString(asMap(user.avatar).image_url, legacy.profile_image_url_https);
  return avatar ? avatar.replace("_normal.", "_400x400.") : void 0;
}, "resolveAuthorAvatar");
var toAuthor = /* @__PURE__ */ __name((tweetNode) => {
  const user = userFromTweetNode(tweetNode);
  const legacy = asMap(user.legacy);
  return {
    avatar_url: resolveAuthorAvatar(user, legacy),
    id: firstString(user.rest_id),
    name: resolveAuthorName(user, legacy),
    screen_name: resolveAuthorScreenName(user, legacy)
  };
}, "toAuthor");
var toCoverImageUrl = /* @__PURE__ */ __name((rawArticle) => {
  const coverMedia = asMap(rawArticle.cover_media);
  return normalizeImageUrl(firstString(coverMedia.media_url_https, coverMedia.media_url, asMap(coverMedia.original_info).url));
}, "toCoverImageUrl");
var toArticleBlocksFromState = /* @__PURE__ */ __name((rawArticle) => {
  return asArray(asMap(rawArticle.content_state).blocks).map((block) => {
    const typed = asMap(block);
    const text = firstString(typed.text);
    return text ? { type: firstString(typed.type) || "unstyled", text } : null;
  }).filter((block) => block !== null);
}, "toArticleBlocksFromState");
var toArticleBlocks = /* @__PURE__ */ __name((rawArticle) => {
  const fromState = toArticleBlocksFromState(rawArticle);
  if (fromState.length > 0) return fromState;
  const plainText = firstString(rawArticle.plain_text, asMap(rawArticle.content_state).plain_text, rawArticle.preview_text) || "";
  return chunkParagraphs(plainText).map((block) => ({ type: "unstyled", text: block.text }));
}, "toArticleBlocks");
var toArticle = /* @__PURE__ */ __name((tweetNode) => {
  const rawArticle = asMap(asMap(asMap(tweetNode.article).article_results).result);
  if (Object.keys(rawArticle).length === 0) return void 0;
  const coverImageUrl = toCoverImageUrl(rawArticle);
  return {
    content: { blocks: toArticleBlocks(rawArticle) },
    cover_media: coverImageUrl ? { media_info: { original_img_url: coverImageUrl } } : void 0,
    preview_text: firstString(rawArticle.preview_text) || void 0,
    title: firstString(rawArticle.title) || void 0
  };
}, "toArticle");
var expandedUrls = /* @__PURE__ */ __name((legacy) => {
  return asArray(asMap(legacy.entities).urls).map((entity) => firstString(asMap(entity).expanded_url)).filter((value) => Boolean(value));
}, "expandedUrls");
var rawTextFromTweet = /* @__PURE__ */ __name((tweetNode, legacy) => {
  return firstString(asMap(asMap(asMap(tweetNode.note_tweet).note_tweet_results).result).text, legacy.full_text, legacy.text, "") || "";
}, "rawTextFromTweet");
var statusUrlFor = /* @__PURE__ */ __name((screenName, id) => `https://x.com/${screenName}/status/${id}`, "statusUrlFor");
var mediaPayload = /* @__PURE__ */ __name((photos) => ({
  media: { all: photos.map((url) => ({ url })), photos: photos.map((url) => ({ url })) },
  media_entities: photos.map((url) => ({ media_info: { original_img_url: url } }))
}), "mediaPayload");
var toTweetPayload = /* @__PURE__ */ __name((tweetNode, requestedStatusId) => {
  const legacy = asMap(tweetNode.legacy);
  const author = toAuthor(tweetNode);
  const id = firstString(tweetNode.rest_id, legacy.id_str, requestedStatusId) || requestedStatusId;
  const statusUrl = statusUrlFor(author.screen_name, id);
  const normalizedText = stripUrlFromTail(rawTextFromTweet(tweetNode, legacy), expandedUrls(legacy));
  const photos = normalizePhotoUrls(legacy);
  const createdAt = firstString(legacy.created_at);
  return {
    article: toArticle(tweetNode),
    author,
    bookmarks: firstNumber(legacy.bookmark_count) ?? null,
    conversation_id: firstString(legacy.conversation_id_str) || null,
    created_at: createdAt,
    created_timestamp: toUnixTimestamp(createdAt) ?? null,
    id,
    likes: firstNumber(legacy.favorite_count) ?? null,
    ...mediaPayload(photos),
    raw_text: { text: normalizedText },
    replies: firstNumber(legacy.reply_count) ?? null,
    replying_to_status: firstString(legacy.in_reply_to_status_id_str) || null,
    retweets: firstNumber(legacy.retweet_count) ?? null,
    source_url: statusUrl,
    text: normalizedText,
    url: statusUrl,
    views: firstNumber(asMap(tweetNode.views).count, asMap(tweetNode.view_count_info).count) ?? null
  };
}, "toTweetPayload");

// worker/src/core/url.ts
var isXDomain = /* @__PURE__ */ __name((url) => {
  const host = url.hostname.toLowerCase();
  return host === "x.com" || host === "www.x.com" || host === "twitter.com" || host === "www.twitter.com";
}, "isXDomain");
var extractByPatterns = /* @__PURE__ */ __name((pathname, patterns) => {
  for (const pattern of patterns) {
    const match = pathname.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}, "extractByPatterns");
var extractStatusId = /* @__PURE__ */ __name((url) => extractByPatterns(url.pathname, STATUS_PATH_PATTERNS), "extractStatusId");
var extractArticleId = /* @__PURE__ */ __name((url) => extractByPatterns(url.pathname, ARTICLE_PATH_PATTERNS), "extractArticleId");
var normalizeStatusId = /* @__PURE__ */ __name((value) => {
  const cleaned = typeof value === "string" ? value.trim() : "";
  return /^\d+$/.test(cleaned) ? cleaned : null;
}, "normalizeStatusId");
var parseInputUrl = /* @__PURE__ */ __name((value) => {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Missing URL.");
  }
  const withProtocol = /^https?:\/\//i.test(value.trim()) ? value.trim() : `https://${value.trim()}`;
  return new URL(withProtocol);
}, "parseInputUrl");

// worker/src/core/durableState.ts
var isString = /* @__PURE__ */ __name((value) => typeof value === "string" && value.length > 0, "isString");
var isNumber = /* @__PURE__ */ __name((value) => typeof value === "number" && Number.isFinite(value), "isNumber");
var toTtlSeconds = /* @__PURE__ */ __name((ttlMs) => Math.max(1, Math.floor(ttlMs / MILLISECONDS_IN_SECOND)), "toTtlSeconds");
var readDurableQueryState = /* @__PURE__ */ __name(async () => {
  const cached = await readCachedJson(QUERY_STATE_CACHE_KEY);
  if (!cached || !isString(cached.bearerToken) || !isString(cached.queryId) || !isNumber(cached.resolvedAt)) {
    return null;
  }
  if (Date.now() - cached.resolvedAt >= QUERY_CACHE_TTL_MS) {
    return null;
  }
  return cached;
}, "readDurableQueryState");
var writeDurableQueryState = /* @__PURE__ */ __name(async (bearerToken, queryId, resolvedAt) => {
  await writeCachedJson(QUERY_STATE_CACHE_KEY, { bearerToken, queryId, resolvedAt }, toTtlSeconds(QUERY_CACHE_TTL_MS));
}, "writeDurableQueryState");
var readDurableGuestToken = /* @__PURE__ */ __name(async () => {
  const cached = await readCachedJson(GUEST_TOKEN_CACHE_KEY);
  if (!cached || !isString(cached.guestToken) || !isNumber(cached.expiresAt)) {
    return null;
  }
  if (Date.now() >= cached.expiresAt) {
    return null;
  }
  return cached;
}, "readDurableGuestToken");
var writeDurableGuestToken = /* @__PURE__ */ __name(async (guestToken, expiresAt) => {
  const ttlMs = expiresAt - Date.now();
  if (ttlMs <= 0) {
    return;
  }
  await writeCachedJson(GUEST_TOKEN_CACHE_KEY, { expiresAt, guestToken }, toTtlSeconds(ttlMs));
}, "writeDurableGuestToken");
var clearDurableGuestToken = /* @__PURE__ */ __name(async () => {
  await deleteCachedJson(GUEST_TOKEN_CACHE_KEY);
}, "clearDurableGuestToken");

// worker/src/core/state.ts
var state = {
  bearerToken: DEFAULT_BEARER_TOKEN,
  guestToken: null,
  guestTokenExpiresAt: 0,
  queryResolvedAt: 0,
  tweetResultQueryId: DEFAULT_TWEET_RESULT_QUERY_ID
};
var clearGuestToken = /* @__PURE__ */ __name(() => {
  state.guestToken = null;
  state.guestTokenExpiresAt = 0;
}, "clearGuestToken");

// worker/src/core/xHeaders.ts
var guestCookie = /* @__PURE__ */ __name((guestToken, csrfToken) => {
  return `guest_id=v1%3A${guestToken}; guest_id_ads=v1%3A${guestToken}; guest_id_marketing=v1%3A${guestToken}; gt=${guestToken}; ct0=${csrfToken};`;
}, "guestCookie");
var guestActivateHeaders = /* @__PURE__ */ __name((bearerToken) => {
  return {
    accept: "*/*",
    authorization: `Bearer ${bearerToken}`,
    "cache-control": "no-cache",
    "content-type": "application/json",
    origin: TWITTER_ROOT,
    pragma: "no-cache",
    referer: `${TWITTER_ROOT}/home`,
    "sec-ch-ua": SEC_CH_UA,
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "user-agent": USER_AGENT,
    "x-twitter-active-user": "yes",
    "x-twitter-client-language": "en"
  };
}, "guestActivateHeaders");
var graphqlHeaders = /* @__PURE__ */ __name((bearerToken, guestToken) => {
  const csrfToken = crypto.randomUUID().replace(/-/g, "");
  return {
    ...guestActivateHeaders(bearerToken),
    cookie: guestCookie(guestToken, csrfToken),
    "x-csrf-token": csrfToken,
    "x-guest-token": guestToken
  };
}, "graphqlHeaders");

// worker/src/core/xParsing.ts
var asMap2 = /* @__PURE__ */ __name((value) => value && typeof value === "object" ? value : {}, "asMap");
var readMainScriptUrl = /* @__PURE__ */ __name((html) => html.match(/https:\/\/abs\.twimg\.com\/responsive-web\/client-web\/main\.[^"]+\.js/)?.[0] || null, "readMainScriptUrl");
var readQueryId = /* @__PURE__ */ __name((scriptText) => scriptText.match(/queryId:"([^"]+)",operationName:"TweetResultByRestId"/)?.[1] || null, "readQueryId");
var readBearerToken = /* @__PURE__ */ __name((scriptText) => scriptText.match(/AAAAA[0-9A-Za-z%]{30,220}/)?.[0] || DEFAULT_BEARER_TOKEN, "readBearerToken");
var takePrimaryCandidate = /* @__PURE__ */ __name((raw) => {
  const source = asMap2(raw);
  const data = asMap2(source.data);
  const dataTweetResult = asMap2(data.tweetResult);
  if (dataTweetResult.result) return dataTweetResult.result;
  const rootTweetResult = asMap2(source.tweetResult);
  if (rootTweetResult.result) return rootTweetResult.result;
  return Object.keys(dataTweetResult).length > 0 ? dataTweetResult : null;
}, "takePrimaryCandidate");
var unwrapLayer = /* @__PURE__ */ __name((node) => {
  const typed = asMap2(node);
  if (Object.keys(typed).length === 0) return null;
  if (typed.result) return typed.result;
  if (typed.tweet) return typed.tweet;
  if (typed.__typename === "TweetWithVisibilityResults" && typed.tweet) return typed.tweet;
  return typed;
}, "unwrapLayer");
var unwrapRetweet = /* @__PURE__ */ __name((node) => {
  const retweet = asMap2(asMap2(asMap2(node.legacy).retweeted_status_result).result);
  return Object.keys(retweet).length > 0 ? retweet : node;
}, "unwrapRetweet");
var unwrapTweetResult = /* @__PURE__ */ __name((raw) => {
  const firstPass = asMap2(unwrapLayer(takePrimaryCandidate(raw)));
  const secondPass = asMap2(unwrapLayer(firstPass));
  if (Object.keys(secondPass).length === 0) return null;
  return unwrapRetweet(secondPass);
}, "unwrapTweetResult");

// worker/src/core/xClient.ts
var STALE_QUERY_STATUSES = /* @__PURE__ */ new Set([HTTP_BAD_REQUEST, HTTP_NOT_FOUND, HTTP_UNAUTHORIZED]);
var GRAPHQL_ROOTS = [TWITTER_API_ROOT, X_API_ROOT];
var hasGuestToken = /* @__PURE__ */ __name((now) => Boolean(state.guestToken && now < state.guestTokenExpiresAt), "hasGuestToken");
var wait = /* @__PURE__ */ __name(async (durationMs) => {
  await new Promise((resolve) => setTimeout(resolve, durationMs));
}, "wait");
var toErrorMessage = /* @__PURE__ */ __name((error) => error instanceof Error ? error.message : "unknown upstream failure", "toErrorMessage");
var setQueryState = /* @__PURE__ */ __name((queryId, bearerToken, resolvedAt) => {
  state.tweetResultQueryId = queryId;
  state.bearerToken = bearerToken;
  state.queryResolvedAt = resolvedAt;
}, "setQueryState");
var fetchHomepageHtml = /* @__PURE__ */ __name(async () => {
  const response = await withTimeout(MAIN_SCRIPT_URL, { headers: { accept: "text/html,application/xhtml+xml" } }, STATUS_TIMEOUT_MS);
  if (!response.ok) throw new Error(`Failed to fetch X homepage (HTTP ${response.status}).`);
  return await response.text();
}, "fetchHomepageHtml");
var refreshQueryAndBearer = /* @__PURE__ */ __name(async () => {
  const now = Date.now();
  const mainScriptUrl = readMainScriptUrl(await fetchHomepageHtml());
  if (!mainScriptUrl) throw new Error("Could not resolve X main script URL.");
  const scriptResponse = await withTimeout(mainScriptUrl, { headers: { accept: "*/*" } }, STATUS_TIMEOUT_MS);
  if (!scriptResponse.ok) throw new Error(`Failed to fetch X main script (HTTP ${scriptResponse.status}).`);
  const scriptText = await scriptResponse.text();
  const queryId = readQueryId(scriptText);
  if (!queryId) throw new Error("Could not resolve TweetResultByRestId query id.");
  const bearerToken = readBearerToken(scriptText);
  setQueryState(queryId, bearerToken, now);
  await writeDurableQueryState(bearerToken, queryId, now);
  return { bearerToken, queryId };
}, "refreshQueryAndBearer");
var resolveQueryAndBearer = /* @__PURE__ */ __name(async (forceRefresh = false) => {
  if (!forceRefresh && state.tweetResultQueryId && state.bearerToken) {
    return { queryId: state.tweetResultQueryId, bearerToken: state.bearerToken };
  }
  if (!forceRefresh) {
    const durableState = await readDurableQueryState();
    if (durableState) {
      setQueryState(durableState.queryId, durableState.bearerToken, durableState.resolvedAt);
      return { bearerToken: durableState.bearerToken, queryId: durableState.queryId };
    }
  }
  return await refreshQueryAndBearer();
}, "resolveQueryAndBearer");
var activateGuestToken = /* @__PURE__ */ __name(async (bearerToken) => {
  const now = Date.now();
  if (hasGuestToken(now)) return state.guestToken;
  const durableGuestToken = await readDurableGuestToken();
  if (durableGuestToken) {
    state.guestToken = durableGuestToken.guestToken;
    state.guestTokenExpiresAt = durableGuestToken.expiresAt;
    return state.guestToken;
  }
  const response = await withTimeout(`${TWITTER_API_ROOT}/1.1/guest/activate.json`, { method: "POST", headers: guestActivateHeaders(bearerToken), body: "" }, STATUS_TIMEOUT_MS);
  if (!response.ok) throw new Error(`Guest token activation failed (HTTP ${response.status}).`);
  const payload = await response.json();
  if (typeof payload.guest_token !== "string") throw new Error("Guest token activation returned an invalid payload.");
  state.guestToken = payload.guest_token;
  state.guestTokenExpiresAt = now + GUEST_TOKEN_TTL_MS;
  await writeDurableGuestToken(state.guestToken, state.guestTokenExpiresAt);
  return state.guestToken;
}, "activateGuestToken");
var graphqlUrl = /* @__PURE__ */ __name((root, statusId, queryId) => {
  const query = `${root}/graphql/${queryId}/TweetResultByRestId`;
  const variables = encodeURIComponent(JSON.stringify({ ...QUERY_VARIABLES, tweetId: statusId }));
  const features = encodeURIComponent(JSON.stringify(QUERY_FEATURES));
  const toggles = encodeURIComponent(JSON.stringify(QUERY_FIELD_TOGGLES));
  return `${query}?variables=${variables}&features=${features}&fieldToggles=${toggles}`;
}, "graphqlUrl");
var fetchGraphql = /* @__PURE__ */ __name(async (root, statusId, queryId, bearerToken, guestToken) => {
  return await withTimeout(graphqlUrl(root, statusId, queryId), { headers: graphqlHeaders(bearerToken, guestToken) }, STATUS_TIMEOUT_MS);
}, "fetchGraphql");
var fetchGraphqlAttempt = /* @__PURE__ */ __name(async (root, statusId, queryId, bearerToken, guestToken) => {
  try {
    return {
      root,
      response: await fetchGraphql(root, statusId, queryId, bearerToken, guestToken)
    };
  } catch (error) {
    return {
      root,
      error: toErrorMessage(error)
    };
  }
}, "fetchGraphqlAttempt");
var fetchDelayedGraphqlAttempt = /* @__PURE__ */ __name(async (root, statusId, queryId, bearerToken, guestToken) => {
  await wait(GRAPHQL_HEDGE_DELAY_MS);
  return await fetchGraphqlAttempt(root, statusId, queryId, bearerToken, guestToken);
}, "fetchDelayedGraphqlAttempt");
var attemptPayload = /* @__PURE__ */ __name(async (attempts) => {
  const errors = [];
  const statuses = [];
  for (const attempt of attempts) {
    if (!attempt.response) {
      errors.push(`${attempt.root} request failed (${attempt.error || "unknown error"})`);
      continue;
    }
    statuses.push(attempt.response.status);
    if (attempt.response.status === HTTP_TOO_MANY_REQUESTS) {
      clearGuestToken();
      await clearDurableGuestToken();
      errors.push(`rate limited at ${attempt.root}`);
      continue;
    }
    if (!attempt.response.ok) {
      errors.push(`${attempt.root} HTTP ${attempt.response.status}`);
      continue;
    }
    return await attempt.response.json();
  }
  if (statuses.length > 0 && statuses.every((status) => STALE_QUERY_STATUSES.has(status))) {
    throw new Error(`stale-query-id ${errors.join(" | ")}`);
  }
  throw new Error(`Tweet query failed. ${errors.join(" | ")}`);
}, "attemptPayload");
var graphqlFetchTweetById = /* @__PURE__ */ __name(async (statusId, queryId, bearerToken, guestToken) => {
  const [primaryRoot, secondaryRoot] = GRAPHQL_ROOTS;
  const primaryAttempt = fetchGraphqlAttempt(primaryRoot, statusId, queryId, bearerToken, guestToken);
  const secondaryAttempt = fetchDelayedGraphqlAttempt(
    secondaryRoot,
    statusId,
    queryId,
    bearerToken,
    guestToken
  );
  const firstAttempt = await Promise.race([primaryAttempt, secondaryAttempt]);
  if (firstAttempt.response?.ok) {
    return await firstAttempt.response.json();
  }
  const secondAttempt = firstAttempt.root === primaryRoot ? await secondaryAttempt : await primaryAttempt;
  return await attemptPayload([firstAttempt, secondAttempt]);
}, "graphqlFetchTweetById");
var resetGuestToken = /* @__PURE__ */ __name(async () => {
  clearGuestToken();
  await clearDurableGuestToken();
}, "resetGuestToken");

// worker/src/routes/extract.ts
var toError = /* @__PURE__ */ __name((error) => error instanceof Error ? error : new Error("Extraction failed."), "toError");
var isStaleQueryFailure = /* @__PURE__ */ __name((error) => (error instanceof Error ? error.message : "").includes("stale-query-id"), "isStaleQueryFailure");
var isCacheablePayload = /* @__PURE__ */ __name((payload) => Boolean(payload && typeof payload === "object" && "kind" in payload), "isCacheablePayload");
var fetchRawTweet = /* @__PURE__ */ __name(async (normalizedStatusId) => {
  const fast = await resolveQueryAndBearer();
  const fastGuestToken = await activateGuestToken(fast.bearerToken);
  try {
    return await graphqlFetchTweetById(
      normalizedStatusId,
      fast.queryId,
      fast.bearerToken,
      fastGuestToken
    );
  } catch (error) {
    if (!isStaleQueryFailure(error)) {
      throw error;
    }
    const refreshed = await resolveQueryAndBearer(true);
    await resetGuestToken();
    const refreshGuestToken = await activateGuestToken(refreshed.bearerToken);
    return await graphqlFetchTweetById(
      normalizedStatusId,
      refreshed.queryId,
      refreshed.bearerToken,
      refreshGuestToken
    );
  }
}, "fetchRawTweet");
var fetchStatusPayload = /* @__PURE__ */ __name(async (statusId) => {
  const normalizedStatusId = normalizeStatusId(statusId);
  if (!normalizedStatusId) {
    throw new Error("Invalid status id.");
  }
  const raw = await fetchRawTweet(normalizedStatusId);
  const tweetNode = unwrapTweetResult(raw);
  if (!tweetNode || !tweetNode.legacy) {
    throw new Error("This status was not found.");
  }
  return {
    code: 200,
    message: "OK",
    tweet: toTweetPayload(tweetNode, normalizedStatusId)
  };
}, "fetchStatusPayload");
var fetchArticleHtml = /* @__PURE__ */ __name(async (parsedUrl) => {
  return await withTimeout(parsedUrl.toString(), { method: "GET", redirect: "follow", headers: { accept: "text/html,application/xhtml+xml" } }, ARTICLE_TIMEOUT_MS);
}, "fetchArticleHtml");
var extractByUrl = /* @__PURE__ */ __name(async (parsedUrl) => {
  const statusId = extractStatusId(parsedUrl);
  if (statusId) {
    const payload = await fetchStatusPayload(statusId);
    if (!payload.tweet?.article) {
      throw new Error("This status does not include an X Article.");
    }
    return jsonResponse({ kind: "status", payloads: [payload], warnings: [] });
  }
  const articleId = extractArticleId(parsedUrl);
  if (!articleId) {
    return jsonResponse({ error: "This URL does not point to a supported status or article." }, HTTP_BAD_REQUEST);
  }
  const articleResponse = await fetchArticleHtml(parsedUrl);
  if (!articleResponse.ok) {
    return jsonResponse({ error: `article fetch HTTP ${articleResponse.status}` }, HTTP_BAD_GATEWAY);
  }
  const html = await articleResponse.text();
  if (!html.trim()) {
    return jsonResponse({ error: "Article page did not return HTML content." }, HTTP_BAD_GATEWAY);
  }
  return jsonResponse({ kind: "article-html", html, finalUrl: articleResponse.url || parsedUrl.toString(), warnings: [] });
}, "extractByUrl");
var readCachedResponse = /* @__PURE__ */ __name(async (sourceUrl) => {
  const cached = await readExtractCache(sourceUrl);
  if (!cached) {
    return null;
  }
  return jsonResponse(cached.payload, cached.status);
}, "readCachedResponse");
var writeCacheableResponse = /* @__PURE__ */ __name(async (sourceUrl, response) => {
  if (!response.ok) {
    return;
  }
  const rawBody = await response.clone().text();
  let payload = null;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return;
  }
  if (!isCacheablePayload(payload)) {
    return;
  }
  await writeExtractCache(sourceUrl, response.status, payload);
}, "writeCacheableResponse");
var handleExtract = /* @__PURE__ */ __name(async (request) => {
  try {
    const body = await request.json().catch(() => null);
    const parsedUrl = parseInputUrl(body?.url);
    if (!isXDomain(parsedUrl)) {
      return jsonResponse({ error: "Only x.com and twitter.com links are supported." }, HTTP_BAD_REQUEST);
    }
    const sourceUrl = parsedUrl.toString();
    const cachedResponse = await readCachedResponse(sourceUrl);
    if (cachedResponse) {
      return cachedResponse;
    }
    const response = await extractByUrl(parsedUrl);
    await writeCacheableResponse(sourceUrl, response);
    return response;
  } catch (error) {
    const message = toError(error).message;
    const status = message.includes("not found") ? HTTP_NOT_FOUND : HTTP_BAD_REQUEST;
    return jsonResponse({ error: message }, status);
  }
}, "handleExtract");

// worker/src/index.ts
var notFound = /* @__PURE__ */ __name(() => jsonResponse({ error: "Not found." }, HTTP_NOT_FOUND), "notFound");
var routeRequest = /* @__PURE__ */ __name(async (request) => {
  const url = new URL(request.url);
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (request.method === "GET" && url.pathname === "/health") {
    return jsonResponse({ ok: true });
  }
  if (request.method === "POST" && url.pathname === "/api/extract") {
    return await handleExtract(request);
  }
  return notFound();
}, "routeRequest");
var src_default = {
  fetch: /* @__PURE__ */ __name(async (request) => await routeRequest(request), "fetch")
};

// ../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-4ftSPM/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-4ftSPM/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
