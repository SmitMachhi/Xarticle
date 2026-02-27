import { readCachedJson, writeCachedJson } from './cacheStore'
import {
  EXTRACT_CACHE_KEY_PREFIX,
  EXTRACT_CACHE_TTL_MS,
  MILLISECONDS_IN_SECOND,
} from './constants'

interface CachedExtractResponse {
  payload: unknown
  status: number
}

const toCacheKey = (sourceUrl: string): string => `${EXTRACT_CACHE_KEY_PREFIX}:${sourceUrl}`

export const readExtractCache = async (
  sourceUrl: string,
): Promise<CachedExtractResponse | null> => {
  const cached = await readCachedJson<CachedExtractResponse>(toCacheKey(sourceUrl))
  if (!cached || typeof cached.status !== 'number') {
    return null
  }
  return cached
}

export const writeExtractCache = async (
  sourceUrl: string,
  status: number,
  payload: unknown,
): Promise<void> => {
  await writeCachedJson(
    toCacheKey(sourceUrl),
    { payload, status },
    Math.floor(EXTRACT_CACHE_TTL_MS / MILLISECONDS_IN_SECOND),
  )
}
