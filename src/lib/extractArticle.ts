import type { ExtractRequestResult, ProviderAttempt } from '../types/article'
import { parseXHtmlDocument } from './articleParser'
import { parseThreadloomStatusResponse } from './threadloomParser'
import { extractStatusId, isSupportedXInputUrl, normalizeInputUrl } from './xUrl'

const EXTRACT_ENDPOINT = import.meta.env.VITE_EXTRACT_API_URL?.trim() || '/api/extract'
const EXTRACT_TIMEOUT_MS = 25_000

type StatusExtractResponse = { kind: 'status'; payloads: unknown[]; warnings?: string[] }
type ArticleHtmlExtractResponse = { kind: 'article-html'; html: string; finalUrl?: string; warnings?: string[] }
type ExtractBackendResponse = StatusExtractResponse | ArticleHtmlExtractResponse

type ExtractErrorResponse = { error?: string }

const parseBackendPayload = (raw: string): unknown => {
  if (!raw) {
    return null
  }
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const extractErrorMessage = (payload: unknown, status: number): string => {
  const message = (payload as ExtractErrorResponse | null)?.error
  return typeof message === 'string' && message ? message : `Extraction backend HTTP ${status}.`
}

const assertBackendResponse = (payload: unknown): ExtractBackendResponse => {
  if (!payload || typeof payload !== 'object' || !('kind' in payload)) {
    throw new Error('Extraction backend returned an invalid payload.')
  }
  const typed = payload as ExtractBackendResponse
  if (typed.kind === 'status' && Array.isArray(typed.payloads)) {
    return typed
  }
  if (typed.kind === 'article-html' && typeof typed.html === 'string') {
    return typed
  }
  throw new Error('Unsupported extraction payload.')
}

const withTimeoutSignal = (): { cancel: () => void; signal: AbortSignal } => {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), EXTRACT_TIMEOUT_MS)
  return { signal: controller.signal, cancel: () => window.clearTimeout(timeout) }
}

const fetchBackendExtract = async (sourceUrl: string): Promise<ExtractBackendResponse> => {
  const timeout = withTimeoutSignal()
  try {
    const response = await fetch(EXTRACT_ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: sourceUrl }), cache: 'no-store', signal: timeout.signal })
    const payload = parseBackendPayload(await response.text())
    if (!response.ok) throw new Error(extractErrorMessage(payload, response.status))
    return assertBackendResponse(payload)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Extraction request timed out.')
    }
    throw error
  } finally {
    timeout.cancel()
  }
}

const validateArticleUrl = (rawUrl: string): URL => {
  let parsed: URL
  try {
    parsed = normalizeInputUrl(rawUrl)
  } catch {
    throw new Error('Please paste a valid URL.')
  }
  if (!isSupportedXInputUrl(parsed)) throw new Error('This URL is not a supported X Article link.')
  return parsed
}

const withAttempts = (attempts: ProviderAttempt[]): string => {
  return attempts.map((attempt) => `${attempt.provider}: ${attempt.ok ? 'ok' : `failed (${attempt.message})`}`).join(' | ')
}

const applyWarnings = (warnings: string[] | undefined, article: ExtractRequestResult['article']): void => {
  if (warnings?.length) article.warnings.push(...warnings)
}

export const extractArticleFromUrl = async (rawUrl: string): Promise<ExtractRequestResult> => {
  const sourceUrl = validateArticleUrl(rawUrl).toString()
  const attempts: ProviderAttempt[] = []
  const statusUrl = Boolean(extractStatusId(new URL(sourceUrl)))
  try {
    const result = await fetchBackendExtract(sourceUrl)
    if (result.kind === 'status') {
      if (result.payloads.length === 0) throw new Error('No status payloads were returned.')
      const article = parseThreadloomStatusResponse(result.payloads[0], sourceUrl)
      applyWarnings(result.warnings, article)
      attempts.push({ provider: 'threadloom', ok: true, message: 'Status parser succeeded.' })
      article.providerAttempts = [...attempts]
      return { article }
    }
    const article = parseXHtmlDocument(result.html, result.finalUrl || sourceUrl)
    applyWarnings(result.warnings, article)
    attempts.push({ provider: 'companion', ok: true, message: 'Article HTML extraction succeeded.' })
    article.providerAttempts = [...attempts]
    return { article }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Extraction backend failed.'
    attempts.push({ provider: statusUrl ? 'threadloom' : 'companion', ok: false, message })
    throw new Error(`Extraction failed. ${withAttempts(attempts)}`)
  }
}
