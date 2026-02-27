export const ARTICLE_TIMEOUT_MS = 20_000
export const STATUS_TIMEOUT_MS = 15_000
export const QUERY_CACHE_TTL_MS = 21_600_000
export const GUEST_TOKEN_TTL_MS = 7_200_000
export const EXTRACT_CACHE_TTL_MS = 300_000
export const GRAPHQL_HEDGE_DELAY_MS = 350
export const MILLISECONDS_IN_SECOND = 1_000

export const TWITTER_ROOT = 'https://x.com'
export const X_API_ROOT = 'https://api.x.com'
export const TWITTER_API_ROOT = 'https://api.twitter.com'
export const MAIN_SCRIPT_URL = 'https://x.com'
export const WORKER_CACHE_ROOT = 'https://worker-cache.internal'
export const EXTRACT_CACHE_KEY_PREFIX = 'extract-response'
export const QUERY_STATE_CACHE_KEY = 'x-query-state'
export const GUEST_TOKEN_CACHE_KEY = 'x-guest-token'

export const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36'
export const SEC_CH_UA = '"Not?A_Brand";v="8", "Chromium";v="145", "Google Chrome";v="145"'

export const DEFAULT_BEARER_TOKEN =
  'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA'
export const DEFAULT_TWEET_RESULT_QUERY_ID = 'MWesEIcCNojpQu2VI6KOhA'

export const QUERY_VARIABLES = {
  includePromotedContent: false,
  withCommunity: false,
  withVoice: false,
}

export const QUERY_FEATURES = {
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
  view_counts_everywhere_api_enabled: true,
}

export const QUERY_FIELD_TOGGLES = {
  withArticlePlainText: true,
  withArticleRichContentState: true,
  withDisallowedReplyControls: false,
  withGrokAnalyze: false,
}

export const ARTICLE_PATH_PATTERNS = [/\/i\/articles\/([A-Za-z0-9_-]+)/i, /\/[^/]+\/articles\/([A-Za-z0-9_-]+)/i, /\/[^/]+\/article\/([A-Za-z0-9_-]+)/i]
export const STATUS_PATH_PATTERNS = [/\/[^/]+\/status\/(\d+)/i, /\/i\/status\/(\d+)/i]

export const HTTP_BAD_REQUEST = 400
export const HTTP_NOT_FOUND = 404
export const HTTP_TOO_MANY_REQUESTS = 429
export const HTTP_BAD_GATEWAY = 502
export const HTTP_UNAUTHORIZED = 401

export const CORS_HEADERS = {
  'access-control-allow-headers': 'content-type',
  'access-control-allow-methods': 'POST,OPTIONS',
  'access-control-allow-origin': '*',
}

export const JSON_HEADERS = {
  ...CORS_HEADERS,
  'cache-control': 'no-store',
  'content-type': 'application/json; charset=utf-8',
}
