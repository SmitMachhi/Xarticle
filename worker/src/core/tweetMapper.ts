import {
  chunkParagraphs,
  firstNumber,
  firstString,
  normalizeImageUrl,
  stripUrlFromTail,
  toUnixTimestamp,
} from './primitives'

type UnknownMap = Record<string, unknown>

const asMap = (value: unknown): UnknownMap => (value && typeof value === 'object' ? (value as UnknownMap) : {})
const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])

const pickMediaList = (legacy: UnknownMap): unknown[] => {
  const extended = asArray(asMap(legacy.extended_entities).media)
  if (extended.length > 0) return extended
  return asArray(asMap(legacy.entities).media)
}

const normalizePhotoUrls = (legacy: UnknownMap): string[] => {
  const seen = new Set<string>()
  const urls: string[] = []
  for (const media of pickMediaList(legacy)) {
    const typed = asMap(media)
    if (typed.type !== 'photo') continue
    const image = normalizeImageUrl(firstString(typed.media_url_https, typed.media_url))
    if (!image || seen.has(image)) continue
    seen.add(image)
    urls.push(image)
  }
  return urls
}

const userFromTweetNode = (tweetNode: UnknownMap): UnknownMap => {
  const core = asMap(tweetNode.core)
  const rawUser = asMap(asMap(core.user_results).result || asMap(core.user_result).result)
  return asMap(rawUser.result || rawUser)
}

const resolveAuthorName = (user: UnknownMap, legacy: UnknownMap): string => {
  return firstString(asMap(user.core).name, legacy.name) || 'Unknown Author'
}

const resolveAuthorScreenName = (user: UnknownMap, legacy: UnknownMap): string => {
  return firstString(asMap(user.core).screen_name, legacy.screen_name) || 'unknown'
}

const resolveAuthorAvatar = (user: UnknownMap, legacy: UnknownMap): string | undefined => {
  const avatar = firstString(asMap(user.avatar).image_url, legacy.profile_image_url_https)
  return avatar ? avatar.replace('_normal.', '_400x400.') : undefined
}

const toAuthor = (tweetNode: UnknownMap) => {
  const user = userFromTweetNode(tweetNode)
  const legacy = asMap(user.legacy)
  return {
    avatar_url: resolveAuthorAvatar(user, legacy),
    id: firstString(user.rest_id),
    name: resolveAuthorName(user, legacy),
    screen_name: resolveAuthorScreenName(user, legacy),
  }
}

type ContentBlock = { type: string; text: string; url?: string }

const toCoverImageUrl = (rawArticle: UnknownMap): string | null => {
  const coverMedia = asMap(rawArticle.cover_media)
  return normalizeImageUrl(firstString(coverMedia.media_url_https, coverMedia.media_url, asMap(coverMedia.original_info).url))
}

const buildMediaIdMap = (rawArticle: UnknownMap): Map<string, string> => {
  const idMap = new Map<string, string>()
  for (const entry of asArray(rawArticle.media_entities)) {
    const typed = asMap(entry)
    const mediaId = firstString(typed.media_id)
    const url = normalizeImageUrl(firstString(asMap(typed.media_info).original_img_url))
    if (mediaId && url) idMap.set(mediaId, url)
  }
  return idMap
}

const resolveAtomicImageUrl = (entityMap: UnknownMap, block: UnknownMap, mediaIdMap: Map<string, string>): string | null => {
  const ranges = asArray(block.entityRanges)
  if (ranges.length === 0) return null
  const key = String(asMap(ranges[0]).key ?? '')
  const raw = asMap(entityMap[key])
  const entity = asMap(raw.value || raw)
  if (entity.type !== 'MEDIA' && entity.type !== 'IMAGE') return null
  const data = asMap(entity.data)
  const directUrl = normalizeImageUrl(firstString(data.src, data.url, data.media_url_https))
  if (directUrl) return directUrl
  const mediaId = firstString(asMap(asArray(data.mediaItems)[0]).mediaId)
  return mediaId ? (mediaIdMap.get(mediaId) ?? null) : null
}

const toArticleBlocksFromState = (rawArticle: UnknownMap): ContentBlock[] => {
  const contentState = asMap(rawArticle.content_state)
  const entityMap = asMap(contentState.entityMap)
  const mediaIdMap = buildMediaIdMap(rawArticle)
  return asArray(contentState.blocks)
    .map((block) => {
      const typed = asMap(block)
      const blockType = firstString(typed.type) || 'unstyled'
      if (blockType === 'atomic') {
        const url = resolveAtomicImageUrl(entityMap, typed, mediaIdMap)
        return url ? { type: 'atomic', text: '', url } : null
      }
      const text = firstString(typed.text)
      return text ? { type: blockType, text } : null
    })
    .filter((block): block is ContentBlock => block !== null)
}

const toArticleBlocks = (rawArticle: UnknownMap): ContentBlock[] => {
  const fromState = toArticleBlocksFromState(rawArticle)
  if (fromState.length > 0) return fromState
  const plainText = firstString(rawArticle.plain_text, asMap(rawArticle.content_state).plain_text, rawArticle.preview_text) || ''
  return chunkParagraphs(plainText).map((block) => ({ type: 'unstyled', text: block.text }))
}

const toArticle = (tweetNode: UnknownMap) => {
  const rawArticle = asMap(asMap(asMap(tweetNode.article).article_results).result)
  if (Object.keys(rawArticle).length === 0) return undefined
  const coverImageUrl = toCoverImageUrl(rawArticle)
  return {
    content: { blocks: toArticleBlocks(rawArticle) },
    cover_media: coverImageUrl ? { media_info: { original_img_url: coverImageUrl } } : undefined,
    preview_text: firstString(rawArticle.preview_text) || undefined,
    title: firstString(rawArticle.title) || undefined,
  }
}

const expandedUrls = (legacy: UnknownMap): string[] => {
  return asArray(asMap(legacy.entities).urls)
    .map((entity) => firstString(asMap(entity).expanded_url))
    .filter((value): value is string => Boolean(value))
}

const rawTextFromTweet = (tweetNode: UnknownMap, legacy: UnknownMap): string => {
  return firstString(asMap(asMap(asMap(tweetNode.note_tweet).note_tweet_results).result).text, legacy.full_text, legacy.text, '') || ''
}

const statusUrlFor = (screenName: string, id: string): string => `https://x.com/${screenName}/status/${id}`

const mediaPayload = (photos: string[]) => ({
  media: { all: photos.map((url) => ({ url })), photos: photos.map((url) => ({ url })) },
  media_entities: photos.map((url) => ({ media_info: { original_img_url: url } })),
})

export const toTweetPayload = (tweetNode: UnknownMap, requestedStatusId: string): Record<string, unknown> => {
  const legacy = asMap(tweetNode.legacy)
  const author = toAuthor(tweetNode)
  const id = firstString(tweetNode.rest_id, legacy.id_str, requestedStatusId) || requestedStatusId
  const statusUrl = statusUrlFor(author.screen_name, id)
  const normalizedText = stripUrlFromTail(rawTextFromTweet(tweetNode, legacy), expandedUrls(legacy))
  const photos = normalizePhotoUrls(legacy)
  const createdAt = firstString(legacy.created_at)
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
    views: firstNumber(asMap(tweetNode.views).count, asMap(tweetNode.view_count_info).count) ?? null,
  }
}
