import type { ArticleBlock, HeadingLevel, InlineMark, ListItem } from '../../types/article'
import { normalizeRichText, normalizeText, parseFencedCode } from './normalize'
import type { ThreadloomArticleBlock, ThreadloomMediaItem, ThreadloomTweet } from './types'

const COVER_CAPTION = 'Cover image'
const OVERLAP_THRESHOLD = 48

const HEADING_TYPES = ['header-one', 'header-two', 'header-three']
const LIST_TYPES: Record<string, boolean> = { 'ordered-list-item': true, 'unordered-list-item': false }

const toMarks = (block: ThreadloomArticleBlock): InlineMark[] | undefined => {
  if (!block.marks || block.marks.length === 0) return undefined
  return block.marks.map((m) => (m.url ? { offset: m.offset, length: m.length, type: m.type, url: m.url } : { offset: m.offset, length: m.length, type: m.type }))
}

const toListItem = (text: string, marks?: InlineMark[]): ListItem => (marks ? { text, marks } : { text })

const convertBlockType = (block: ThreadloomArticleBlock, rawText: string): ArticleBlock => {
  const fencedCode = parseFencedCode(rawText.trim())
  if (fencedCode) return { type: 'code', code: fencedCode.code, language: fencedCode.language }
  const { text, marks } = normalizeRichText(rawText, toMarks(block))
  const type = block.type || ''
  const headingIndex = HEADING_TYPES.indexOf(type)
  if (headingIndex >= 0) return { type: 'heading', level: (headingIndex + 1) as HeadingLevel, text, marks }
  if (type in LIST_TYPES) return { type: 'list', ordered: LIST_TYPES[type], items: [toListItem(text, marks)] }
  if (type === 'blockquote') return { type: 'quote', text, marks }
  return { type: 'paragraph', text, marks }
}

const mergeAdjacentBlocks = (blocks: ArticleBlock[]): ArticleBlock[] => {
  const merged: ArticleBlock[] = []
  for (const block of blocks) {
    const previous = merged[merged.length - 1]
    if (block.type === 'list' && previous?.type === 'list' && Boolean(block.ordered) === Boolean(previous.ordered)) {
      previous.items.push(...block.items)
      continue
    }
    if (block.type === 'code' && previous?.type === 'code') {
      previous.code += '\n' + block.code
      continue
    }
    merged.push(block)
  }
  return merged
}

const toCodeBlock = (block: ThreadloomArticleBlock): ArticleBlock | null => {
  const code = (block.text || '').trim()
  return code ? { type: 'code', code, language: undefined } : null
}

const toMediaBlock = (block: ThreadloomArticleBlock & { url: string }): ArticleBlock => {
  const media: ArticleBlock = { type: 'media', mediaType: block.video ? 'video-thumbnail' : 'image', url: block.url, caption: block.caption?.trim() || undefined }
  return block.video ? { ...media, link: block.video } : media
}

const toContentBlock = (block: ThreadloomArticleBlock): ArticleBlock | null => {
  if (block.type === 'atomic' && block.url) return toMediaBlock({ ...block, url: block.url })
  if (block.type === 'divider') return { type: 'divider' }
  if (block.type === 'code-block') return toCodeBlock(block)
  if (block.type === 'embed' && block.url) {
    return { type: 'embed', text: block.text || block.url, url: block.url }
  }
  const rawText = block.text || ''
  return rawText.trim() ? convertBlockType(block, rawText) : null
}

const parseArticleContentBlocks = (tweet: ThreadloomTweet): ArticleBlock[] => {
  const parsed = (tweet.article?.content?.blocks || [])
    .map(toContentBlock)
    .filter((block): block is ArticleBlock => block !== null)
  return mergeAdjacentBlocks(parsed)
}

const pushUrl = (urls: Set<string>, value: string | undefined): void => {
  if (value) urls.add(value)
}

const collectEntityUrls = (tweet: ThreadloomTweet, urls: Set<string>): void => {
  for (const media of tweet.media_entities || []) {
    pushUrl(urls, media.media_info?.original_img_url)
  }
}

const collectMediaListUrls = (mediaList: ThreadloomMediaItem[] | undefined, urls: Set<string>): void => {
  for (const media of mediaList || []) {
    pushUrl(urls, media.url)
  }
}

const collectMediaUrls = (tweet: ThreadloomTweet): string[] => {
  const urls = new Set<string>()
  pushUrl(urls, tweet.article?.cover_media?.media_info?.original_img_url)
  collectEntityUrls(tweet, urls)
  collectMediaListUrls(tweet.media?.photos, urls)
  collectMediaListUrls(tweet.media?.all, urls)
  return [...urls]
}

const toMediaBlocks = (tweet: ThreadloomTweet): ArticleBlock[] => {
  const coverImageUrl = tweet.article?.cover_media?.media_info?.original_img_url
  return collectMediaUrls(tweet).map((url) => ({ type: 'media', mediaType: 'image', url, caption: url === coverImageUrl ? COVER_CAPTION : undefined }))
}

const isLongEnough = (current: string, previous: string): boolean => {
  return current.length >= OVERLAP_THRESHOLD && previous.length >= OVERLAP_THRESHOLD
}

const shouldReplacePrevious = (current: string, previous: string): boolean => isLongEnough(current, previous) && current.includes(previous)
const shouldSkipCurrent = (current: string, previous: string): boolean => isLongEnough(current, previous) && previous.includes(current)

const dedupeAdjacentParagraphs = (blocks: ArticleBlock[]): ArticleBlock[] => {
  const deduped: ArticleBlock[] = []
  for (const block of blocks) {
    if (block.type !== 'paragraph') {
      deduped.push(block)
      continue
    }
    const current = normalizeText(block.text)
    if (!current) continue
    const previous = deduped[deduped.length - 1]
    if (previous?.type === 'paragraph') {
      const previousText = normalizeText(previous.text)
      if (previousText === current) continue
      if (shouldReplacePrevious(current, previousText)) {
        deduped[deduped.length - 1] = block
        continue
      }
      if (shouldSkipCurrent(current, previousText)) continue
    }
    deduped.push(block)
  }
  return deduped
}

const inlineMediaUrls = (blocks: ArticleBlock[]): Set<string> => {
  const urls = new Set<string>()
  for (const block of blocks) {
    if (block.type === 'media') urls.add(block.url)
  }
  return urls
}

export const buildTweetBlocks = (tweet: ThreadloomTweet): ArticleBlock[] => {
  const contentBlocks = parseArticleContentBlocks(tweet)
  const inlineUrls = inlineMediaUrls(contentBlocks)
  const extraMedia = toMediaBlocks(tweet).filter((b) => b.type !== 'media' || !inlineUrls.has(b.url))
  const fallbackBlocks = contentBlocks.length === 0 && tweet.article?.preview_text ? [{ type: 'paragraph', text: normalizeText(tweet.article.preview_text) } satisfies ArticleBlock] : []
  return dedupeAdjacentParagraphs([...fallbackBlocks, ...contentBlocks, ...extraMedia])
}
