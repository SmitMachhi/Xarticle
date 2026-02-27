import { DEFAULT_BEARER_TOKEN } from './constants'

export const readMainScriptUrl = html => {
  const match = html.match(/https:\/\/abs\.twimg\.com\/responsive-web\/client-web\/main\.[^"]+\.js/)
  return match?.[0] || null
}

export const readQueryId = script => {
  const match = script.match(/queryId:"([^"]+)",operationName:"TweetResultByRestId"/)
  return match?.[1] || null
}

export const readBearerToken = script => {
  const match = script.match(/AAAAA[0-9A-Za-z%]{30,220}/)
  return match?.[0] || DEFAULT_BEARER_TOKEN
}

export const unwrapTweetResult = raw => {
  let node = raw?.data?.tweetResult?.result || raw?.tweetResult?.result || raw?.data?.tweetResult || null
  if (node?.result) node = node.result
  if (node?.tweet) node = node.tweet
  if (node?.__typename === 'TweetWithVisibilityResults' && node?.tweet) node = node.tweet
  if (node?.legacy?.retweeted_status_result?.result) node = node.legacy.retweeted_status_result.result
  return node
}
