import type { ThreadloomTweet, ThreadloomTweetResponse } from './types'

export const parseStatusPayload = (payload: unknown): ThreadloomTweet => {
  const data = payload as ThreadloomTweetResponse
  if (!data?.tweet) {
    throw new Error('Status extractor did not return tweet payload.')
  }
  return data.tweet
}
