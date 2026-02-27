import type { ExtractRequestResult, ProviderAttempt } from '../types/article'
import { parseXHtmlDocument } from './articleParser'
import { parseThreadloomStatusResponse } from './threadloomParser'
import { extractStatusId, isSupportedXInputUrl, normalizeInputUrl } from './xUrl'

const EXTRACT_ENDPOINT = import.meta.env.VITE_EXTRACT_API_URL?.trim() || '/api/extract'
const EXTRACT_TIMEOUT_MS = 25000

interface StatusExtractResponse {
  kind: 'status'
  payloads: unknown[]
  warnings?: string[]
}

interface ArticleHtmlExtractResponse {
  kind: 'article-html'
  html: string
  finalUrl?: string
  warnings?: string[]
}

interface ExtractErrorResponse {
  error?: string
}

type ExtractBackendResponse = StatusExtractResponse | ArticleHtmlExtractResponse

const validateArticleUrl = (rawUrl: string): URL => {
  let parsed: URL
  try {
    parsed = normalizeInputUrl(rawUrl)
  } catch {
    throw new Error('Please paste a valid URL.')
  }

  if (!isSupportedXInputUrl(parsed)) {
    throw new Error('This URL is not a supported X Article link.')
  }

  return parsed
}

const fetchBackendExtract = async (sourceUrl: string): Promise<ExtractBackendResponse> => {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), EXTRACT_TIMEOUT_MS)

  try {
    const response = await fetch(EXTRACT_ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ url: sourceUrl }),
      cache: 'no-store',
      signal: controller.signal,
    })

    const raw = await response.text()
    let payload: unknown = null
    if (raw) {
      try {
        payload = JSON.parse(raw)
      } catch {
        payload = null
      }
    }

    if (!response.ok) {
      const message = (payload as ExtractErrorResponse | null)?.error
      throw new Error(typeof message === 'string' && message ? message : `Extraction backend HTTP ${response.status}.`)
    }

    if (!payload || typeof payload !== 'object' || !('kind' in payload)) {
      throw new Error('Extraction backend returned an invalid payload.')
    }

    const extracted = payload as ExtractBackendResponse
    if (extracted.kind === 'status') {
      if (!Array.isArray(extracted.payloads)) {
        throw new Error('Status extraction payload was malformed.')
      }
      return extracted
    }

    if (extracted.kind === 'article-html') {
      if (typeof extracted.html !== 'string') {
        throw new Error('Article extraction payload was malformed.')
      }
      return extracted
    }

    throw new Error('Unsupported extraction payload.')
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Extraction request timed out.')
    }
    throw error
  } finally {
    window.clearTimeout(timeout)
  }
}

export const extractArticleFromUrl = async (rawUrl: string): Promise<ExtractRequestResult> => {
  const parsedUrl = validateArticleUrl(rawUrl)
  const sourceUrl = parsedUrl.toString()
  const attempts: ProviderAttempt[] = []
  const isStatusUrl = Boolean(extractStatusId(parsedUrl))

  try {
    const backendResult = await fetchBackendExtract(sourceUrl)
    if (backendResult.kind === 'status') {
      const payloads = backendResult.payloads
      if (payloads.length === 0) {
        throw new Error('No status payloads were returned.')
      }

      const article = parseThreadloomStatusResponse(payloads[0], sourceUrl)
      if (backendResult.warnings && backendResult.warnings.length > 0) {
        article.warnings.push(...backendResult.warnings)
      }
      attempts.push({
        provider: 'threadloom',
        ok: true,
        message: 'Status parser succeeded.',
      })
      article.providerAttempts = [...attempts]
      return { article }
    }

    const article = parseXHtmlDocument(backendResult.html, backendResult.finalUrl || sourceUrl)
    if (backendResult.warnings && backendResult.warnings.length > 0) {
      article.warnings.push(...backendResult.warnings)
    }
    attempts.push({
      provider: 'companion',
      ok: true,
      message: 'Article HTML extraction succeeded.',
    })
    article.providerAttempts = [...attempts]
    return { article }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Extraction backend failed.'
    attempts.push({
      provider: isStatusUrl ? 'threadloom' : 'companion',
      ok: false,
      message,
    })
    const debugLines = attempts.map((attempt) => `${attempt.provider}: ${attempt.ok ? 'ok' : `failed (${attempt.message})`}`).join(' | ')
    throw new Error(`Extraction failed. ${debugLines}`)
  }
}
