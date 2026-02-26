import type { ExtractRequestResult, ProviderAttempt } from '../types/article'
import { parseJinaMarkdown, parseXHtmlDocument } from './articleParser'
import { requestCompanionHtml } from './companionBridge'
import { parseFxTweetResponse, parseFxTweetThreadResponse } from './fxTweetParser'
import { extractStatusId, isSupportedXInputUrl, normalizeInputUrl } from './xUrl'

const JINA_TIMEOUT_MS = 20000
const FX_TIMEOUT_MS = 15000
const FX_THREAD_LIMIT = 40
const THREADREADER_TIMEOUT_MS = 20000
const THREADREADER_BASE_URL = 'https://threadreaderapp.com'

interface FxThreadMeta {
  statusId: string | null
  authorHandle: string
  replyingToStatusId: string | null
}

interface ThreadReaderTweet {
  statusId: string
  text: string
}

const fetchJinaMarkdown = async (url: string): Promise<string> => {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), JINA_TIMEOUT_MS)

  try {
    const response = await fetch(`https://r.jina.ai/http://${url.replace(/^https?:\/\//i, '')}`, {
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`Fallback extractor returned HTTP ${response.status}.`)
    }

    return await response.text()
  } finally {
    window.clearTimeout(timeout)
  }
}

const fetchThreadReaderHtml = async (statusId: string): Promise<string> => {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), THREADREADER_TIMEOUT_MS)

  try {
    const target = `${THREADREADER_BASE_URL}/thread/${statusId}.html`
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`
    const response = await fetch(proxyUrl, {
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`Thread Reader fallback HTTP ${response.status}.`)
    }

    return await response.text()
  } finally {
    window.clearTimeout(timeout)
  }
}

const htmlToText = (html: string): string => {
  const withBreaks = html.replace(/<br\s*\/?>/gi, '\n')
  const temp = document.createElement('div')
  temp.innerHTML = withBreaks
  return temp.textContent?.replace(/\u00a0/g, ' ').replace(/\n{3,}/g, '\n\n').trim() || ''
}

const parseThreadReaderTweets = (html: string): ThreadReaderTweet[] => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const nodes = Array.from(doc.querySelectorAll<HTMLElement>('.content-tweet[data-tweet]'))
  const tweets: ThreadReaderTweet[] = []
  const seen = new Set<string>()

  for (const node of nodes) {
    const statusId = node.dataset.tweet?.trim() || ''
    if (!statusId || seen.has(statusId)) {
      continue
    }
    seen.add(statusId)

    const clone = node.cloneNode(true) as HTMLElement
    clone.querySelectorAll('sup.tw-permalink').forEach((el) => el.remove())
    const text = htmlToText(clone.innerHTML)
    if (!text) {
      continue
    }
    tweets.push({
      statusId,
      text,
    })
  }

  return tweets
}

const fallbackThreadPayload = (
  statusId: string,
  text: string,
  sourceUrl: string,
  authorName: string,
  authorHandle: string,
  avatarUrl: string | undefined,
  createdTimestamp: number,
): unknown => {
  return {
    code: 200,
    message: 'OK',
    tweet: {
      id: statusId,
      url: `https://x.com/${authorHandle}/status/${statusId}`,
      text,
      raw_text: {
        text,
      },
      author: {
        name: authorName,
        screen_name: authorHandle,
        avatar_url: avatarUrl,
      },
      created_at: new Date(createdTimestamp * 1000).toUTCString(),
      created_timestamp: createdTimestamp,
      replying_to_status: null,
      source_url: sourceUrl,
    },
  }
}

const validateArticleUrl = (rawUrl: string): URL => {
  let parsed: URL
  try {
    parsed = normalizeInputUrl(rawUrl)
  } catch {
    throw new Error('Please paste a valid URL.')
  }

  if (!isSupportedXInputUrl(parsed)) {
    throw new Error('This URL is not a supported X article or status link.')
  }

  return parsed
}

const toStatusId = (value: unknown): string | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(Math.trunc(value)) : null
  }
  if (typeof value === 'string') {
    const normalized = value.trim()
    return normalized || null
  }
  return null
}

const getThreadMeta = (payload: unknown): FxThreadMeta => {
  const tweet = (payload as { tweet?: { id?: unknown; author?: { screen_name?: unknown }; replying_to_status?: unknown } })?.tweet
  const authorHandle = typeof tweet?.author?.screen_name === 'string' ? tweet.author.screen_name.trim().toLowerCase() : ''
  return {
    statusId: toStatusId(tweet?.id),
    authorHandle,
    replyingToStatusId: toStatusId(tweet?.replying_to_status),
  }
}

const fetchFxTweetByStatusId = async (statusId: string): Promise<unknown> => {
  const endpoint = `https://api.fxtwitter.com/i/status/${statusId}`

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), FX_TIMEOUT_MS)

  try {
    const response = await fetch(endpoint, { signal: controller.signal })
    if (!response.ok) {
      throw new Error(`Status parser HTTP ${response.status}.`)
    }
    return await response.json()
  } finally {
    window.clearTimeout(timeout)
  }
}

const fetchFxThreadChain = async (
  seedPayload: unknown,
): Promise<{ payloads: unknown[]; warnings: string[]; limitReached: boolean }> => {
  const warnings: string[] = []
  const payloads: unknown[] = [seedPayload]

  const seedMeta = getThreadMeta(seedPayload)
  if (!seedMeta.statusId || !seedMeta.authorHandle) {
    return {
      payloads,
      warnings: ['Thread auto-detection skipped due to missing status metadata.'],
      limitReached: false,
    }
  }

  let currentParentId = seedMeta.replyingToStatusId
  let limitReached = false

  while (currentParentId) {
    if (payloads.length >= FX_THREAD_LIMIT) {
      limitReached = true
      break
    }

    try {
      const parentPayload = await fetchFxTweetByStatusId(currentParentId)
      const parentMeta = getThreadMeta(parentPayload)

      if (!parentMeta.statusId) {
        warnings.push(`Thread chain stopped early because a parent status payload was incomplete (${currentParentId}).`)
        break
      }

      if (!parentMeta.authorHandle || parentMeta.authorHandle !== seedMeta.authorHandle) {
        break
      }

      payloads.push(parentPayload)
      currentParentId = parentMeta.replyingToStatusId
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown status parser error.'
      warnings.push(`Thread chain stopped early while fetching ${currentParentId}: ${message}`)
      break
    }
  }

  return {
    payloads: payloads.reverse(),
    warnings,
    limitReached,
  }
}

const fetchThreadViaThreadReader = async (
  seedPayload: unknown,
): Promise<{ payloads: unknown[]; warnings: string[]; ok: boolean }> => {
  const seedMeta = getThreadMeta(seedPayload)
  const seedTweet = (seedPayload as { tweet?: { author?: { name?: string; screen_name?: string; avatar_url?: string }; created_timestamp?: number } })?.tweet
  const authorName = seedTweet?.author?.name?.trim() || 'Unknown Author'
  const authorHandle = seedTweet?.author?.screen_name?.trim() || seedMeta.authorHandle || 'unknown'
  const createdTimestamp = typeof seedTweet?.created_timestamp === 'number' ? seedTweet.created_timestamp : Math.floor(Date.now() / 1000)

  if (!seedMeta.statusId || !authorHandle) {
    return {
      payloads: [seedPayload],
      warnings: ['Thread Reader fallback skipped due to missing status metadata.'],
      ok: false,
    }
  }

  try {
    const html = await fetchThreadReaderHtml(seedMeta.statusId)
    const threadTweets = parseThreadReaderTweets(html)
      .filter((tweet) => Boolean(tweet.statusId))
      .slice(0, FX_THREAD_LIMIT)

    if (threadTweets.length <= 1) {
      return {
        payloads: [seedPayload],
        warnings: ['Thread Reader fallback did not return multi-post thread data.'],
        ok: false,
      }
    }

    const payloads: unknown[] = []
    for (let index = 0; index < threadTweets.length; index += 1) {
      const threadTweet = threadTweets[index]
      try {
        const payload = await fetchFxTweetByStatusId(threadTweet.statusId)
        payloads.push(payload)
      } catch {
        payloads.push(
          fallbackThreadPayload(
            threadTweet.statusId,
            threadTweet.text,
            `https://x.com/${authorHandle}/status/${seedMeta.statusId}`,
            authorName,
            authorHandle,
            seedTweet?.author?.avatar_url,
            createdTimestamp + index,
          ),
        )
      }
    }

    return {
      payloads,
      warnings: [
        `Thread resolved via Thread Reader fallback (${threadTweets.length} posts).`,
      ],
      ok: true,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Thread Reader fallback error.'
    return {
      payloads: [seedPayload],
      warnings: [`Thread Reader fallback failed: ${message}`],
      ok: false,
    }
  }
}

export const extractArticleFromUrl = async (rawUrl: string): Promise<ExtractRequestResult> => {
  const parsedUrl = validateArticleUrl(rawUrl)
  const sourceUrl = parsedUrl.toString()
  const warnings: string[] = []
  const attempts: ProviderAttempt[] = []

  if (extractStatusId(parsedUrl)) {
    try {
      const statusId = extractStatusId(parsedUrl)
      if (!statusId) {
        throw new Error('Could not find status id in URL.')
      }

      const seedPayload = await fetchFxTweetByStatusId(statusId)
      const thread = await fetchFxThreadChain(seedPayload)
      let payloads = thread.payloads
      const warningLines = [...thread.warnings]
      const threadLimitReached = thread.limitReached

      if (payloads.length <= 1) {
        const threadReaderResult = await fetchThreadViaThreadReader(seedPayload)
        payloads = threadReaderResult.ok ? threadReaderResult.payloads : payloads
        warningLines.push(...threadReaderResult.warnings)
      }

      const article =
        payloads.length > 1
          ? parseFxTweetThreadResponse(payloads, sourceUrl, { threadLimitReached })
          : parseFxTweetResponse(seedPayload, sourceUrl)
      if (warningLines.length > 0) {
        article.warnings.push(...warningLines)
      }
      attempts.push({
        provider: 'fxtwitter',
        ok: true,
        message: payloads.length > 1 ? 'Public status parser succeeded (thread merged).' : 'Public status parser succeeded.',
      })
      article.providerAttempts = [...attempts]
      return { article }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Status parser failed.'
      attempts.push({
        provider: 'fxtwitter',
        ok: false,
        message,
      })
      warnings.push(`fxtwitter failed: ${message}`)
    }
  }

  try {
    const companionResult = await requestCompanionHtml(sourceUrl)
    const article = parseXHtmlDocument(companionResult.html, companionResult.finalUrl || sourceUrl)
    attempts.push({
      provider: 'companion',
      ok: true,
      message: 'Companion extension extraction succeeded.',
    })
    article.warnings.push(...warnings)
    article.providerAttempts = [...attempts]
    return { article }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Companion extension unavailable.'
    attempts.push({
      provider: 'companion',
      ok: false,
      message,
    })
    warnings.push(`companion failed: ${message}`)
  }

  try {
    const raw = await fetchJinaMarkdown(sourceUrl)
    const article = parseJinaMarkdown(raw, sourceUrl)
    if (article.blocks.length < 3) {
      throw new Error('Could not extract enough content from this page.')
    }

    attempts.push({
      provider: 'jina',
      ok: true,
      message: 'Jina fallback extraction succeeded.',
    })
    article.warnings = [...warnings, ...article.warnings]
    article.providerAttempts = [...attempts]

    return { article }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Jina fallback failed.'
    attempts.push({
      provider: 'jina',
      ok: false,
      message,
    })
    const debugLines = attempts.map((attempt) => `${attempt.provider}: ${attempt.ok ? 'ok' : `failed (${attempt.message})`}`).join(' | ')
    throw new Error(`All extraction providers failed. ${debugLines}`)
  }
}
