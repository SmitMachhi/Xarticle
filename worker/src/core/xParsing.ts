import { DEFAULT_BEARER_TOKEN } from './constants'

type UnknownMap = Record<string, unknown>

const asMap = (value: unknown): UnknownMap => (value && typeof value === 'object' ? (value as UnknownMap) : {})

export const readMainScriptUrl = (html: string): string | null => html.match(/https:\/\/abs\.twimg\.com\/responsive-web\/client-web\/main\.[^"]+\.js/)?.[0] || null

export const readQueryId = (scriptText: string): string | null => scriptText.match(/queryId:"([^"]+)",operationName:"TweetResultByRestId"/)?.[1] || null

export const readBearerToken = (scriptText: string): string => scriptText.match(/AAAAA[0-9A-Za-z%]{30,220}/)?.[0] || DEFAULT_BEARER_TOKEN

const takePrimaryCandidate = (raw: unknown): unknown => {
  const source = asMap(raw)
  const data = asMap(source.data)
  const dataTweetResult = asMap(data.tweetResult)
  if (dataTweetResult.result) return dataTweetResult.result
  const rootTweetResult = asMap(source.tweetResult)
  if (rootTweetResult.result) return rootTweetResult.result
  return Object.keys(dataTweetResult).length > 0 ? dataTweetResult : null
}

const unwrapLayer = (node: unknown): unknown => {
  const typed = asMap(node)
  if (Object.keys(typed).length === 0) return null
  if (typed.result) return typed.result
  if (typed.tweet) return typed.tweet
  if (typed.__typename === 'TweetWithVisibilityResults' && typed.tweet) return typed.tweet
  return typed
}

const unwrapRetweet = (node: UnknownMap): UnknownMap => {
  const retweet = asMap(asMap(asMap(node.legacy).retweeted_status_result).result)
  return Object.keys(retweet).length > 0 ? retweet : node
}

export const unwrapTweetResult = (raw: unknown): UnknownMap | null => {
  const firstPass = asMap(unwrapLayer(takePrimaryCandidate(raw)))
  const secondPass = asMap(unwrapLayer(firstPass))
  if (Object.keys(secondPass).length === 0) return null
  return unwrapRetweet(secondPass)
}
