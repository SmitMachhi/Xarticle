import { asArray, asMap, firstString, normalizeImageUrl, type UnknownMap } from './primitives'

export interface MediaRef {
  url: string
  video?: string
}

export const buildEntityLookup = (entityMap: unknown): Map<string, UnknownMap> => {
  const lookup = new Map<string, UnknownMap>()
  if (Array.isArray(entityMap)) {
    entityMap.forEach((entry, index) => {
      const typed = asMap(entry)
      lookup.set(String(typed.key ?? index), asMap(typed.value))
    })
    return lookup
  }
  for (const [key, raw] of Object.entries(asMap(entityMap))) {
    lookup.set(key, asMap(asMap(raw).value || raw))
  }
  return lookup
}

const bestVideoUrl = (mediaInfo: UnknownMap): string | undefined => {
  const mp4s = asArray(mediaInfo.variants).map(asMap).filter((variant) => variant.content_type === 'video/mp4')
  const best = mp4s.sort((a, b) => (Number(b.bit_rate) || 0) - (Number(a.bit_rate) || 0))[0]
  return firstString(best?.url)
}

const toMediaRef = (mediaInfo: UnknownMap): MediaRef | null => {
  const poster = normalizeImageUrl(firstString(mediaInfo.original_img_url, asMap(mediaInfo.preview_image).original_img_url))
  if (!poster) return null
  const video = bestVideoUrl(mediaInfo)
  return video ? { url: poster, video } : { url: poster }
}

export const buildMediaIdMap = (rawArticle: UnknownMap): Map<string, MediaRef> => {
  const idMap = new Map<string, MediaRef>()
  for (const entry of asArray(rawArticle.media_entities)) {
    const typed = asMap(entry)
    const mediaId = firstString(typed.media_id)
    const ref = toMediaRef(asMap(typed.media_info))
    if (mediaId && ref) idMap.set(mediaId, ref)
  }
  return idMap
}

export const toCoverImageUrl = (rawArticle: UnknownMap): string | null => {
  const coverMedia = asMap(rawArticle.cover_media)
  const mediaInfo = asMap(coverMedia.media_info)
  return normalizeImageUrl(firstString(mediaInfo.original_img_url, coverMedia.media_url_https, coverMedia.media_url, asMap(coverMedia.original_info).url))
}

export const resolveMediaRef = (entity: UnknownMap, mediaIdMap: Map<string, MediaRef>): MediaRef | null => {
  const data = asMap(entity.data)
  const directUrl = normalizeImageUrl(firstString(data.src, data.url, data.media_url_https))
  if (directUrl) return { url: directUrl }
  const mediaId = firstString(asMap(asArray(data.mediaItems)[0]).mediaId)
  return mediaId ? (mediaIdMap.get(mediaId) ?? null) : null
}

export const stripMarkdownFence = (markdown: string): string => markdown.replace(/^```[A-Za-z]*\n?/, '').replace(/\n?```$/, '').trim()
