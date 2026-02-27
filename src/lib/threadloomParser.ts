import type { ArticleBlock, ExtractedArticle } from '../types/article'

interface ThreadloomTweetAuthor {
  name?: string
  screen_name?: string
  avatar_url?: string
}

interface ThreadloomArticleBlock {
  type?: string
  text?: string
}

interface ThreadloomMediaInfo {
  original_img_url?: string
}

interface ThreadloomMediaEntity {
  media_info?: ThreadloomMediaInfo
}

interface ThreadloomMediaItem {
  url?: string
}

interface ThreadloomTweetArticle {
  title?: string
  preview_text?: string
  content?: {
    blocks?: ThreadloomArticleBlock[]
  }
  cover_media?: {
    media_info?: ThreadloomMediaInfo
  }
}

interface ThreadloomTweet {
  id?: string | number
  url?: string
  text?: string
  raw_text?: {
    text?: string
  }
  author?: ThreadloomTweetAuthor
  replies?: number
  retweets?: number
  likes?: number
  views?: number
  bookmarks?: number
  created_at?: string
  created_timestamp?: number
  replying_to_status?: string | number | null
  article?: ThreadloomTweetArticle
  media_entities?: ThreadloomMediaEntity[]
  media?: {
    all?: ThreadloomMediaItem[]
    photos?: ThreadloomMediaItem[]
  }
}

interface ThreadloomTweetResponse {
  code?: number
  message?: string
  tweet?: ThreadloomTweet
}

const asIsoDate = (value: string | undefined): string | undefined => {
  if (!value) {
    return undefined
  }
  const timestamp = Date.parse(value)
  if (Number.isNaN(timestamp)) {
    return undefined
  }
  return new Date(timestamp).toISOString()
}

const toStatusId = (value: string | number | null | undefined): string | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(Math.trunc(value)) : null
  }
  if (typeof value === 'string') {
    const normalized = value.trim()
    return normalized || null
  }
  return null
}

const parseStatusPayload = (payload: unknown): ThreadloomTweet => {
  const data = payload as ThreadloomTweetResponse
  if (!data?.tweet) {
    throw new Error('Status extractor did not return tweet payload.')
  }
  return data.tweet
}

const normalizeText = (value: string): string => value.replace(/\s+/g, ' ').trim()

const parseFencedCode = (value: string): { code: string; language?: string } | null => {
  const match = value.match(/^```([A-Za-z0-9_+-]+)?\n([\s\S]+)\n```$/)
  if (!match) {
    return null
  }

  return {
    code: match[2].trim(),
    language: match[1] || undefined,
  }
}

const convertBlockType = (blockType: string | undefined, rawText: string, normalizedText: string): ArticleBlock => {
  const fencedCode = parseFencedCode(rawText)
  if (fencedCode) {
    return {
      type: 'code',
      code: fencedCode.code,
      language: fencedCode.language,
    }
  }

  if (blockType === 'header-two') {
    return { type: 'heading', level: 2, text: normalizedText }
  }

  if (blockType === 'header-three') {
    return { type: 'heading', level: 3, text: normalizedText }
  }

  if (blockType === 'ordered-list-item') {
    return { type: 'list', items: [normalizedText] }
  }

  if (blockType === 'unordered-list-item') {
    return { type: 'list', items: [normalizedText] }
  }

  if (blockType === 'blockquote') {
    return { type: 'quote', text: normalizedText }
  }

  return { type: 'paragraph', text: normalizedText }
}

const mergeAdjacentLists = (blocks: ArticleBlock[]): ArticleBlock[] => {
  const merged: ArticleBlock[] = []

  for (const block of blocks) {
    const prev = merged[merged.length - 1]
    if (block.type === 'list' && prev?.type === 'list') {
      prev.items.push(...block.items)
      continue
    }
    merged.push(block)
  }

  return merged
}

const mediaBlocksFromTweet = (tweet: ThreadloomTweet): ArticleBlock[] => {
  const imageUrls = new Set<string>()
  const blocks: ArticleBlock[] = []

  const coverImageUrl = tweet.article?.cover_media?.media_info?.original_img_url
  if (coverImageUrl) {
    imageUrls.add(coverImageUrl)
    blocks.push({
      type: 'media',
      mediaType: 'image',
      url: coverImageUrl,
      caption: 'Cover image',
    })
  }

  for (const media of tweet.media_entities || []) {
    const imageUrl = media.media_info?.original_img_url
    if (imageUrl && !imageUrls.has(imageUrl)) {
      imageUrls.add(imageUrl)
      blocks.push({
        type: 'media',
        mediaType: 'image',
        url: imageUrl,
      })
    }
  }

  const mediaItems = [...(tweet.media?.photos || []), ...(tweet.media?.all || [])]
  for (const media of mediaItems) {
    const imageUrl = media.url
    if (imageUrl && !imageUrls.has(imageUrl)) {
      imageUrls.add(imageUrl)
      blocks.push({
        type: 'media',
        mediaType: 'image',
        url: imageUrl,
      })
    }
  }

  return blocks
}

const articleBlocksFromTweet = (tweet: ThreadloomTweet): ArticleBlock[] => {
  const parsed = (tweet.article?.content?.blocks || [])
    .map((block) => {
      const rawText = (block.text || '').trim()
      if (!rawText) {
        return null
      }
      const normalizedText = normalizeText(rawText)
      return convertBlockType(block.type, rawText, normalizedText)
    })
    .filter((block): block is ArticleBlock => block !== null)

  const merged = mergeAdjacentLists(parsed)

  if (merged.length > 0) {
    return merged
  }

  const fallbackText = normalizeText(tweet.raw_text?.text || tweet.text || '')
  if (fallbackText) {
    return [{ type: 'paragraph', text: fallbackText }]
  }

  return []
}

const dedupeAdjacentParagraphs = (blocks: ArticleBlock[]): ArticleBlock[] => {
  const deduped: ArticleBlock[] = []
  const overlapThreshold = 48

  for (const block of blocks) {
    if (block.type !== 'paragraph') {
      deduped.push(block)
      continue
    }

    const normalizedCurrent = normalizeText(block.text)
    if (!normalizedCurrent) {
      continue
    }

    const previous = deduped[deduped.length - 1]
    if (previous?.type === 'paragraph') {
      const normalizedPrevious = normalizeText(previous.text)
      if (normalizedPrevious === normalizedCurrent) {
        continue
      }

      if (normalizedCurrent.length >= overlapThreshold && normalizedPrevious.length >= overlapThreshold) {
        if (normalizedCurrent.includes(normalizedPrevious)) {
          previous.text = block.text.trim()
          continue
        }

        if (normalizedPrevious.includes(normalizedCurrent)) {
          continue
        }
      }
    }

    deduped.push({ type: 'paragraph', text: block.text.trim() })
  }

  return deduped
}

const buildSingleTweetBlocks = (tweet: ThreadloomTweet): ArticleBlock[] => {
  const contentBlocks = articleBlocksFromTweet(tweet)
  const mediaBlocks = mediaBlocksFromTweet(tweet)

  const rawBlocks: ArticleBlock[] = []
  if (contentBlocks.length === 0 && tweet.article?.preview_text) {
    rawBlocks.push({ type: 'paragraph', text: normalizeText(tweet.article.preview_text) })
  }
  rawBlocks.push(...contentBlocks)
  rawBlocks.push(...mediaBlocks)
  return dedupeAdjacentParagraphs(rawBlocks)
}

const metricSnapshot = (tweet: ThreadloomTweet): ExtractedArticle['metrics'] => ({
  likes: tweet.likes ?? null,
  replies: tweet.replies ?? null,
  reposts: tweet.retweets ?? null,
  views: tweet.views ?? null,
  bookmarks: tweet.bookmarks ?? null,
})

const toChronologicalTweets = (tweets: ThreadloomTweet[]): ThreadloomTweet[] => {
  return [...tweets].sort((a, b) => {
    const aTimestamp = typeof a.created_timestamp === 'number' ? a.created_timestamp : Number.NaN
    const bTimestamp = typeof b.created_timestamp === 'number' ? b.created_timestamp : Number.NaN

    if (!Number.isNaN(aTimestamp) && !Number.isNaN(bTimestamp)) {
      return aTimestamp - bTimestamp
    }
    if (!Number.isNaN(aTimestamp)) {
      return -1
    }
    if (!Number.isNaN(bTimestamp)) {
      return 1
    }

    const aDate = Date.parse(a.created_at || '')
    const bDate = Date.parse(b.created_at || '')
    if (!Number.isNaN(aDate) && !Number.isNaN(bDate)) {
      return aDate - bDate
    }
    return 0
  })
}

export const parseThreadloomThreadResponse = (
  payloads: unknown[],
  sourceUrl: string,
  options?: { threadLimitReached?: boolean },
): ExtractedArticle => {
  if (payloads.length === 0) {
    throw new Error('No status payloads were provided for thread parsing.')
  }

  const tweetsById = new Map<string, ThreadloomTweet>()
  payloads.forEach((payload, index) => {
    const tweet = parseStatusPayload(payload)
    const fallbackId = `tweet-${index}`
    const id = toStatusId(tweet.id) || fallbackId
    if (!tweetsById.has(id)) {
      tweetsById.set(id, tweet)
    }
  })

  const chronologicalTweets = toChronologicalTweets(Array.from(tweetsById.values()))
  if (chronologicalTweets.length === 0) {
    throw new Error('No printable content found for this status URL.')
  }

  const rootTweet = chronologicalTweets[0]
  const latestTweet = chronologicalTweets[chronologicalTweets.length - 1]
  const authorName = rootTweet.author?.name?.trim() || latestTweet.author?.name?.trim() || 'Unknown Author'
  const authorHandle = rootTweet.author?.screen_name?.trim() || latestTweet.author?.screen_name?.trim() || 'unknown'

  const blocks: ArticleBlock[] = []
  chronologicalTweets.forEach((tweet, index) => {
    const sectionBlocks = buildSingleTweetBlocks(tweet)
    if (sectionBlocks.length === 0) {
      return
    }

    blocks.push({
      type: 'heading',
      level: 2,
      text: `Post ${index + 1}`,
    })
    blocks.push(...sectionBlocks)
  })

  if (blocks.length === 0) {
    throw new Error('No printable content found for this status URL.')
  }

  const warnings = [
    `Auto-detected thread: ${chronologicalTweets.length} posts merged. Metrics shown are from the root post.`,
    'Extracted via public status parser.',
  ]
  if (options?.threadLimitReached) {
    warnings.push('Thread parsing hit the 40-post cap and may be incomplete.')
  }

  return {
    sourceUrl,
    canonicalUrl: rootTweet.url || sourceUrl,
    title: rootTweet.article?.title?.trim() || `${authorName} thread on X`,
    authorName,
    authorHandle,
    authorAvatarUrl: rootTweet.author?.avatar_url || latestTweet.author?.avatar_url,
    publishedAt: asIsoDate(rootTweet.created_at),
    metrics: metricSnapshot(rootTweet),
    blocks,
    warnings,
    extractedAt: new Date().toISOString(),
    mode: 'fallback',
    providerUsed: 'threadloom',
    providerAttempts: [],
    isThread: true,
    threadTweetCount: chronologicalTweets.length,
    threadRootUrl: rootTweet.url || sourceUrl,
    threadUrls: chronologicalTweets.map((tweet) => tweet.url).filter((url): url is string => Boolean(url)),
  }
}

export const parseThreadloomStatusResponse = (payload: unknown, sourceUrl: string): ExtractedArticle => {
  const tweet = parseStatusPayload(payload)
  const authorName = tweet.author?.name?.trim() || 'Unknown Author'
  const authorHandle = tweet.author?.screen_name?.trim() || 'unknown'
  const blocks = buildSingleTweetBlocks(tweet)

  const title = tweet.article?.title?.trim() || `${authorName} on X`

  return {
    sourceUrl,
    canonicalUrl: tweet.url || sourceUrl,
    title,
    authorName,
    authorHandle,
    authorAvatarUrl: tweet.author?.avatar_url,
    publishedAt: asIsoDate(tweet.created_at),
    metrics: metricSnapshot(tweet),
    blocks,
    warnings: ['Extracted via public status parser.'],
    extractedAt: new Date().toISOString(),
    mode: 'fallback',
    providerUsed: 'threadloom',
    providerAttempts: [],
  }
}
