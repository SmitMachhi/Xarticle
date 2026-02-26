import type { ExtractRequestResult, ProviderAttempt } from '../types/article'
import { parseJinaMarkdown, parseXHtmlDocument } from './articleParser'
import { requestCompanionHtml } from './companionBridge'
import { parseFxTweetResponse, parseFxTweetThreadResponse } from './fxTweetParser'
import { extractStatusId, isSupportedXInputUrl, normalizeInputUrl } from './xUrl'

const JINA_TIMEOUT_MS = 20000
const FX_TIMEOUT_MS = 15000
const FX_THREAD_LIMIT = 40

interface FxThreadMeta {
  statusId: string | null
  authorHandle: string
  replyingToStatusId: string | null
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
      const article =
        thread.payloads.length > 1
          ? parseFxTweetThreadResponse(thread.payloads, sourceUrl, { threadLimitReached: thread.limitReached })
          : parseFxTweetResponse(seedPayload, sourceUrl)
      article.warnings.push(...thread.warnings)
      attempts.push({
        provider: 'fxtwitter',
        ok: true,
        message: thread.payloads.length > 1 ? 'Public status parser succeeded (thread merged).' : 'Public status parser succeeded.',
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
