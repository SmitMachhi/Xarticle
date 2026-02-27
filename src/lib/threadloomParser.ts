import type { ExtractedArticle } from '../types/article'
import { buildTweetBlocks } from './threadloom/blocks'
import { metricSnapshot } from './threadloom/metrics'
import { asIsoDate } from './threadloom/normalize'
import { parseStatusPayload } from './threadloom/parsePayload'
import type { ThreadloomTweet } from './threadloom/types'

const resolveAuthorName = (value?: string): string => value?.trim() || 'Unknown Author'
const resolveAuthorHandle = (value?: string): string => value?.trim() || 'unknown'

const resolveTitle = (tweet: ThreadloomTweet): string => {
  const title = tweet.article?.title?.trim()
  return title || `${resolveAuthorName(tweet.author?.name)} on X`
}

const toArticle = (tweet: ThreadloomTweet, sourceUrl: string, blocks: ExtractedArticle['blocks']): ExtractedArticle => {
  return {
    sourceUrl,
    canonicalUrl: tweet.url || sourceUrl,
    title: resolveTitle(tweet),
    authorName: resolveAuthorName(tweet.author?.name),
    authorHandle: resolveAuthorHandle(tweet.author?.screen_name),
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

const assertArticleContent = (tweet: ThreadloomTweet, blocks: ExtractedArticle['blocks']): void => {
  if (!tweet.article) throw new Error('This status does not include an X Article.')
  if (blocks.length === 0) throw new Error('No article content found on this status.')
}

export const parseThreadloomStatusResponse = (payload: unknown, sourceUrl: string): ExtractedArticle => {
  const tweet = parseStatusPayload(payload)
  const blocks = buildTweetBlocks(tweet)
  assertArticleContent(tweet, blocks)
  return toArticle(tweet, sourceUrl, blocks)
}
