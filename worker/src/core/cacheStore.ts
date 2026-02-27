import { WORKER_CACHE_ROOT } from './constants'

const cacheRequest = (key: string): Request => {
  return new Request(`${WORKER_CACHE_ROOT}/${encodeURIComponent(key)}`, { method: 'GET' })
}

const cacheResponse = (payload: unknown, ttlSeconds: number): Response => {
  return new Response(JSON.stringify(payload), {
    headers: {
      'cache-control': `public, max-age=${ttlSeconds}`,
      'content-type': 'application/json; charset=utf-8',
    },
  })
}

export const readCachedJson = async <T>(key: string): Promise<T | null> => {
  try {
    const response = await caches.default.match(cacheRequest(key))
    if (!response) return null
    return (await response.json()) as T
  } catch {
    return null
  }
}

export const writeCachedJson = async (
  key: string,
  payload: unknown,
  ttlSeconds: number,
): Promise<void> => {
  try {
    await caches.default.put(cacheRequest(key), cacheResponse(payload, ttlSeconds))
  } catch {
    return
  }
}

export const deleteCachedJson = async (key: string): Promise<void> => {
  try {
    await caches.default.delete(cacheRequest(key))
  } catch {
    return
  }
}
