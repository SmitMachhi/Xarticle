import { JSON_HEADERS } from './constants'

export const jsonResponse = (payload: unknown, status = 200): Response => {
  return new Response(JSON.stringify(payload), { status, headers: JSON_HEADERS })
}

export const withTimeout = async (url: string, init: RequestInit, timeoutMs: number): Promise<Response> => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}
