import { firstNumber, firstString, normalizeImageUrl, stripUrlFromTail, toUnixTimestamp, chunkParagraphs } from './primitives'

const userFromNode = tweetNode => {
  const rawUser = tweetNode?.core?.user_results?.result || tweetNode?.core?.user_result?.result || {}
  return rawUser?.result || rawUser
}

export const toAuthor = tweetNode => {
  const legacy = userFromNode(tweetNode)?.legacy || {}
  const screenName = firstString(legacy?.screen_name) || 'unknown'
  const avatar = firstString(legacy?.profile_image_url_https)
  return { name: firstString(legacy?.name) || 'Unknown Author', screen_name: screenName, avatar_url: avatar?.replace('_normal.', '_400x400.') }
}

const photoItems = legacy => {
  const extended = Array.isArray(legacy?.extended_entities?.media) ? legacy.extended_entities.media : []
  const regular = Array.isArray(legacy?.entities?.media) ? legacy.entities.media : []
  return extended.length > 0 ? extended : regular
}

const photoUrl = media => {
  return normalizeImageUrl(firstString(media?.media_url_https, media?.media_url))
}

export const toMedia = tweetNode => {
  const seen = new Set()
  const photos = photoItems(tweetNode?.legacy || {}).filter(m => m?.type === 'photo').map(photoUrl).filter(Boolean).filter(url => !seen.has(url) && seen.add(url))
  const wrap = url => ({ url })
  const entity = url => ({ media_info: { original_img_url: url } })
  return { media_entities: photos.map(entity), media: { photos: photos.map(wrap), all: photos.map(wrap) } }
}

export const toArticle = tweetNode => {
  const article = tweetNode?.article?.article_results?.result
  if (!article) return undefined
  const raw = firstString(article?.content_state?.plain_text, article?.preview_text) || ''
  const blocks = chunkParagraphs(raw).map(block => ({ type: 'unstyled', text: block.text }))
  const cover = normalizeImageUrl(firstString(article?.cover_media?.media_url_https, article?.cover_media?.media_url, article?.cover_media?.original_info?.url))
  return { title: firstString(article?.title), preview_text: firstString(article?.preview_text), content: { blocks }, cover_media: cover ? { media_info: { original_img_url: cover } } : undefined }
}

const expandedUrls = legacy => {
  const urls = Array.isArray(legacy?.entities?.urls) ? legacy.entities.urls : []
  return urls.map(item => firstString(item?.expanded_url)).filter(Boolean)
}

const statusText = (tweetNode, legacy) => {
  const raw = firstString(tweetNode?.note_tweet?.note_tweet_results?.result?.text, legacy?.full_text, legacy?.text, '')
  return stripUrlFromTail(raw, expandedUrls(legacy))
}

const metricCounts = (tweetNode, legacy) => {
  return {
    replies: firstNumber(legacy?.reply_count) ?? null,
    retweets: firstNumber(legacy?.retweet_count) ?? null,
    likes: firstNumber(legacy?.favorite_count) ?? null,
    views: firstNumber(tweetNode?.views?.count, tweetNode?.view_count_info?.count) ?? null,
    bookmarks: firstNumber(legacy?.bookmark_count) ?? null,
  }
}

const tweetIdentity = (tweetNode, legacy, requestedStatusId) => {
  const id = firstString(tweetNode?.rest_id, legacy?.id_str, requestedStatusId) || requestedStatusId
  const author = toAuthor(tweetNode)
  return { id, author, url: `https://x.com/${author.screen_name}/status/${id}` }
}

const tweetBody = (tweetNode, legacy) => {
  const text = statusText(tweetNode, legacy)
  return { text, raw_text: { text } }
}

const tweetDates = legacy => {
  const created = firstString(legacy?.created_at)
  return { created_at: created, created_timestamp: toUnixTimestamp(created) ?? null }
}

const tweetReplyTarget = legacy => {
  return { replying_to_status: firstString(legacy?.in_reply_to_status_id_str) || null }
}

const tweetMediaPayload = tweetNode => {
  const media = toMedia(tweetNode)
  return { media_entities: media.media_entities, media: media.media }
}

export const toTweetPayload = (tweetNode, requestedStatusId) => {
  const legacy = tweetNode?.legacy || {}
  const identity = tweetIdentity(tweetNode, legacy, requestedStatusId)
  return { ...identity, ...tweetBody(tweetNode, legacy), ...metricCounts(tweetNode, legacy), ...tweetDates(legacy), ...tweetReplyTarget(legacy), source_url: identity.url, article: toArticle(tweetNode), ...tweetMediaPayload(tweetNode) }
}
