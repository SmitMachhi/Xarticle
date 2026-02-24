import type { ArticleBlock, ExtractedArticle } from '../types/article'

interface FxTweetAuthor {
  name?: string
  screen_name?: string
  avatar_url?: string
}

interface FxArticleBlock {
  type?: string
  text?: string
}

interface FxMediaInfo {
  original_img_url?: string
}

interface FxMediaEntity {
  media_info?: FxMediaInfo
}

interface FxTweetArticle {
  title?: string
  preview_text?: string
  content?: {
    blocks?: FxArticleBlock[]
  }
  cover_media?: {
    media_info?: FxMediaInfo
  }
}

interface FxTweet {
  url?: string
  text?: string
  raw_text?: {
    text?: string
  }
  author?: FxTweetAuthor
  replies?: number
  retweets?: number
  likes?: number
  views?: number
  bookmarks?: number
  created_at?: string
  article?: FxTweetArticle
  media_entities?: FxMediaEntity[]
}

interface FxTweetResponse {
  code?: number
  message?: string
  tweet?: FxTweet
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

const mediaBlocksFromTweet = (tweet: FxTweet): ArticleBlock[] => {
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

  return blocks
}

const articleBlocksFromTweet = (tweet: FxTweet): ArticleBlock[] => {
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

export const parseFxTweetResponse = (payload: unknown, sourceUrl: string): ExtractedArticle => {
  const data = payload as FxTweetResponse

  if (!data?.tweet) {
    throw new Error('Status extractor did not return tweet payload.')
  }

  const tweet = data.tweet
  const authorName = tweet.author?.name?.trim() || 'Unknown Author'
  const authorHandle = tweet.author?.screen_name?.trim() || 'unknown'

  const contentBlocks = articleBlocksFromTweet(tweet)
  const mediaBlocks = mediaBlocksFromTweet(tweet)

  const title = tweet.article?.title?.trim() || `${authorName} on X`

  const rawBlocks: ArticleBlock[] = []
  if (contentBlocks.length === 0 && tweet.article?.preview_text) {
    rawBlocks.push({ type: 'paragraph', text: normalizeText(tweet.article.preview_text) })
  }
  rawBlocks.push(...contentBlocks)
  rawBlocks.push(...mediaBlocks)
  const blocks = dedupeAdjacentParagraphs(rawBlocks)

  if (blocks.length === 0) {
    throw new Error('No printable content found for this status URL.')
  }

  return {
    sourceUrl,
    canonicalUrl: tweet.url || sourceUrl,
    title,
    authorName,
    authorHandle,
    authorAvatarUrl: tweet.author?.avatar_url,
    publishedAt: tweet.created_at ? new Date(tweet.created_at).toISOString() : undefined,
    metrics: {
      likes: tweet.likes ?? null,
      replies: tweet.replies ?? null,
      reposts: tweet.retweets ?? null,
      views: tweet.views ?? null,
      bookmarks: tweet.bookmarks ?? null,
    },
    blocks,
    warnings: ['Extracted via public status parser.'],
    extractedAt: new Date().toISOString(),
    mode: 'fallback',
    providerUsed: 'fxtwitter',
    providerAttempts: [],
  }
}
