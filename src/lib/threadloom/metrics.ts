import type { ExtractedArticle } from '../../types/article'
import type { ThreadloomTweet } from './types'

export const metricSnapshot = (tweet: ThreadloomTweet): ExtractedArticle['metrics'] => ({
  likes: tweet.likes ?? null,
  replies: tweet.replies ?? null,
  reposts: tweet.retweets ?? null,
  views: tweet.views ?? null,
  bookmarks: tweet.bookmarks ?? null,
})
