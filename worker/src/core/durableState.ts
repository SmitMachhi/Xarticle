import { deleteCachedJson, readCachedJson, writeCachedJson } from './cacheStore'
import {
  GUEST_TOKEN_CACHE_KEY,
  MILLISECONDS_IN_SECOND,
  QUERY_CACHE_TTL_MS,
  QUERY_STATE_CACHE_KEY,
} from './constants'

interface CachedQueryState {
  bearerToken: string
  queryId: string
  resolvedAt: number
}

interface CachedGuestToken {
  expiresAt: number
  guestToken: string
}

const isString = (value: unknown): value is string => typeof value === 'string' && value.length > 0
const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)
const toTtlSeconds = (ttlMs: number): number => Math.max(1, Math.floor(ttlMs / MILLISECONDS_IN_SECOND))

export const readDurableQueryState = async (): Promise<CachedQueryState | null> => {
  const cached = await readCachedJson<CachedQueryState>(QUERY_STATE_CACHE_KEY)
  if (!cached || !isString(cached.bearerToken) || !isString(cached.queryId) || !isNumber(cached.resolvedAt)) {
    return null
  }
  if (Date.now() - cached.resolvedAt >= QUERY_CACHE_TTL_MS) {
    return null
  }
  return cached
}

export const writeDurableQueryState = async (
  bearerToken: string,
  queryId: string,
  resolvedAt: number,
): Promise<void> => {
  await writeCachedJson(QUERY_STATE_CACHE_KEY, { bearerToken, queryId, resolvedAt }, toTtlSeconds(QUERY_CACHE_TTL_MS))
}

export const readDurableGuestToken = async (): Promise<CachedGuestToken | null> => {
  const cached = await readCachedJson<CachedGuestToken>(GUEST_TOKEN_CACHE_KEY)
  if (!cached || !isString(cached.guestToken) || !isNumber(cached.expiresAt)) {
    return null
  }
  if (Date.now() >= cached.expiresAt) {
    return null
  }
  return cached
}

export const writeDurableGuestToken = async (
  guestToken: string,
  expiresAt: number,
): Promise<void> => {
  const ttlMs = expiresAt - Date.now()
  if (ttlMs <= 0) {
    return
  }
  await writeCachedJson(GUEST_TOKEN_CACHE_KEY, { expiresAt, guestToken }, toTtlSeconds(ttlMs))
}

export const clearDurableGuestToken = async (): Promise<void> => {
  await deleteCachedJson(GUEST_TOKEN_CACHE_KEY)
}
