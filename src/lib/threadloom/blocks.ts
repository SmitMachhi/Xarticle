import type { ArticleBlock, InlineMark, ListItem } from '../../types/article'
import { normalizeText, parseFencedCode } from './normalize'
import type { ThreadloomArticleBlock, ThreadloomMediaItem, ThreadloomTweet } from './types'

const COVER_CAPTION = 'Cover image'
const OVERLAP_THRESHOLD = 48

const toMarks = (block: ThreadloomArticleBlock): InlineMark[] | undefined => {
  if (!block.marks || block.marks.length === 0) return undefined
  return block.marks.map((m) => (m.url ? { offset: m.offset, length: m.length, type: m.type, url: m.url } : { offset: m.offset, length: m.length, type: m.type }))
}

const toListItem = (text: string, marks?: InlineMark[]): ListItem => (marks ? { text, marks } : { text })

const convertBlockType = (block: ThreadloomArticleBlock, rawText: string, normalized: string): ArticleBlock => {
  const marks = toMarks(block)
  const fencedCode = parseFencedCode(rawText)
  if (fencedCode) return { type: 'code', code: fencedCode.code, language: fencedCode.language }
  if (block.type === 'code-block') return { type: 'code', code: rawText, language: undefined }
  if (block.type === 'header-one') return { type: 'heading', level: 1, text: normalized, marks }
  if (block.type === 'header-two') return { type: 'heading', level: 2, text: normalized, marks }
  if (block.type === 'header-three') return { type: 'heading', level: 3, text: normalized, marks }
  if (block.type === 'ordered-list-item' || block.type === 'unordered-list-item') return { type: 'list', items: [toListItem(normalized, marks)] }
  if (block.type === 'blockquote') return { type: 'quote', text: normalized, marks }
  return { type: 'paragraph', text: normalized, marks }
}

const mergeAdjacentBlocks = (blocks: ArticleBlock[]): ArticleBlock[] => {
  const merged: ArticleBlock[] = []
  for (const block of blocks) {
    const previous = merged[merged.length - 1]
    if (block.type === 'list' && previous?.type === 'list') {
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

const parseArticleContentBlocks = (tweet: ThreadloomTweet): ArticleBlock[] => {
  const parsed = (tweet.article?.content?.blocks || [])
    .map((block) => {
      if (block.type === 'atomic' && block.url) {
        return { type: 'media', mediaType: 'image', url: block.url, caption: undefined } satisfies ArticleBlock
      }
      if (block.type === 'code-block') {
        const code = (block.text || '').trim()
        return code ? { type: 'code', code, language: undefined } satisfies ArticleBlock : null
      }
      if (block.type === 'embed' && block.url) {
        return { type: 'embed', text: block.text || block.url, url: block.url } satisfies ArticleBlock
      }
      const rawText = (block.text || '').trim()
      return rawText ? convertBlockType(block, rawText, normalizeText(rawText)) : null
    })
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
        previous.text = block.text.trim()
        continue
      }
      if (shouldSkipCurrent(current, previousText)) continue
    }
    deduped.push({ type: 'paragraph', text: block.text.trim() })
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
