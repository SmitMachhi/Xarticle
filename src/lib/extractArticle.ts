import type { ExtractRequestResult } from '../types/article'
import { parseJinaMarkdown, parseXHtmlDocument } from './articleParser'
import { requestCompanionHtml } from './companionBridge'
import { parseFxTweetResponse } from './fxTweetParser'
import { extractStatusId, isSupportedXInputUrl, normalizeInputUrl } from './xUrl'

const JINA_TIMEOUT_MS = 20000
const FX_TIMEOUT_MS = 15000

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

const fetchFxTweet = async (statusUrl: string): Promise<unknown> => {
  const urlObj = new URL(statusUrl)
  const statusId = extractStatusId(urlObj)
  if (!statusId) {
    throw new Error('Could not find status id in URL.')
  }

  const handle = urlObj.pathname.split('/').filter(Boolean)[0] || ''
  const endpoint = `https://api.fxtwitter.com/${handle}/status/${statusId}`

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

export const extractArticleFromUrl = async (rawUrl: string): Promise<ExtractRequestResult> => {
  const parsedUrl = validateArticleUrl(rawUrl)
  const sourceUrl = parsedUrl.toString()
  const warnings: string[] = []

  if (extractStatusId(parsedUrl)) {
    try {
      const payload = await fetchFxTweet(sourceUrl)
      const article = parseFxTweetResponse(payload, sourceUrl)
      return { article }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Status parser failed.'
      warnings.push(`Status parser failed: ${message}`)
    }
  }

  try {
    const companionResult = await requestCompanionHtml(sourceUrl)
    const article = parseXHtmlDocument(companionResult.html, companionResult.finalUrl || sourceUrl)
    article.warnings.push(...warnings)
    return { article }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Companion extension unavailable.'
    warnings.push(`Companion extractor unavailable: ${message}`)
  }

  const raw = await fetchJinaMarkdown(sourceUrl)
  const article = parseJinaMarkdown(raw, sourceUrl)
  article.warnings = [...warnings, ...article.warnings]

  if (article.blocks.length < 3) {
    throw new Error('Could not extract enough content from this page. Try again with the companion extension enabled.')
  }

  return { article }
}
