import { CORS_HEADERS, JSON_HEADERS, MAX_TIMEOUT_MS } from './constants'

export const withTimeout = async (url, init, timeoutMs = MAX_TIMEOUT_MS) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

export const jsonResponse = (payload, status = 200) => {
  return new Response(JSON.stringify(payload), { status, headers: JSON_HEADERS })
}

export const optionsResponse = () => {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}
