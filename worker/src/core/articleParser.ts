import { chunkParagraphs, firstString, normalizeImageUrl } from './primitives'

type UnknownMap = Record<string, unknown>

const asMap = (value: unknown): UnknownMap => (value && typeof value === 'object' ? (value as UnknownMap) : {})
const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])

interface InlineMark {
  offset: number
  length: number
  type: 'bold' | 'italic' | 'underline' | 'code' | 'link'
  url?: string
}

interface ContentBlock {
  type: string
  text: string
  url?: string
  marks?: InlineMark[]
}

const toCoverImageUrl = (rawArticle: UnknownMap): string | null => {
  const coverMedia = asMap(rawArticle.cover_media)
  return normalizeImageUrl(firstString(coverMedia.media_url_https, coverMedia.media_url, asMap(coverMedia.original_info).url))
}

const buildMediaIdMap = (rawArticle: UnknownMap): Map<string, string> => {
  const idMap = new Map<string, string>()
  for (const entry of asArray(rawArticle.media_entities)) {
    const typed = asMap(entry)
    const mediaId = firstString(typed.media_id)
    const url = normalizeImageUrl(firstString(asMap(typed.media_info).original_img_url))
    if (mediaId && url) idMap.set(mediaId, url)
  }
  return idMap
}

const resolveAtomicImageUrl = (entityMap: UnknownMap, block: UnknownMap, mediaIdMap: Map<string, string>): string | null => {
  const ranges = asArray(block.entityRanges)
  if (ranges.length === 0) return null
  const key = String(asMap(ranges[0]).key ?? '')
  const raw = asMap(entityMap[key])
  const entity = asMap(raw.value || raw)
  if (entity.type !== 'MEDIA' && entity.type !== 'IMAGE') return null
  const data = asMap(entity.data)
  const directUrl = normalizeImageUrl(firstString(data.src, data.url, data.media_url_https))
  if (directUrl) return directUrl
  const mediaId = firstString(asMap(asArray(data.mediaItems)[0]).mediaId)
  return mediaId ? (mediaIdMap.get(mediaId) ?? null) : null
}

const STYLE_MAP: Record<string, InlineMark['type']> = {
  BOLD: 'bold',
  ITALIC: 'italic',
  UNDERLINE: 'underline',
  CODE: 'code',
}

const resolveEntity = (entityMap: UnknownMap, key: string): UnknownMap => {
  const raw = asMap(entityMap[key])
  return asMap(raw.value || raw)
}

const toValidRange = (r: UnknownMap): { offset: number; length: number } | null => {
  const offset = Number(r.offset)
  const length = Number(r.length)
  return Number.isFinite(offset) && Number.isFinite(length) && length > 0 ? { offset, length } : null
}

const extractMarks = (block: UnknownMap, entityMap: UnknownMap): InlineMark[] => {
  const marks: InlineMark[] = []
  for (const range of asArray(block.inlineStyleRanges)) {
    const r = asMap(range)
    const mapped = STYLE_MAP[(firstString(r.style) || '').toUpperCase()]
    if (!mapped) continue
    const valid = toValidRange(r)
    if (valid) marks.push({ ...valid, type: mapped })
  }
  for (const range of asArray(block.entityRanges)) {
    const r = asMap(range)
    const entity = resolveEntity(entityMap, String(r.key ?? ''))
    if (firstString(entity.type) !== 'LINK') continue
    const url = firstString(asMap(entity.data).url, asMap(entity.data).href)
    if (!url) continue
    const valid = toValidRange(r)
    if (valid) marks.push({ ...valid, type: 'link', url })
  }
  return marks
}

const toArticleBlocksFromState = (rawArticle: UnknownMap): ContentBlock[] => {
  const contentState = asMap(rawArticle.content_state)
  const entityMap = asMap(contentState.entityMap)
  const mediaIdMap = buildMediaIdMap(rawArticle)
  return asArray(contentState.blocks)
    .map((block) => {
      const typed = asMap(block)
      const blockType = firstString(typed.type) || 'unstyled'
      if (blockType === 'atomic') {
        const url = resolveAtomicImageUrl(entityMap, typed, mediaIdMap)
        return url ? { type: 'atomic', text: '', url } : null
      }
      const text = firstString(typed.text)
      if (!text) return null
      const marks = extractMarks(typed, entityMap)
      return marks.length > 0 ? { type: blockType, text, marks } : { type: blockType, text }
    })
    .filter((block): block is ContentBlock => block !== null)
}

const toArticleBlocks = (rawArticle: UnknownMap): ContentBlock[] => {
  const fromState = toArticleBlocksFromState(rawArticle)
  if (fromState.length > 0) return fromState
  const plainText = firstString(rawArticle.plain_text, asMap(rawArticle.content_state).plain_text, rawArticle.preview_text) || ''
  return chunkParagraphs(plainText).map((block) => ({ type: 'unstyled', text: block.text }))
}

export const toArticle = (tweetNode: UnknownMap) => {
  const rawArticle = asMap(asMap(asMap(tweetNode.article).article_results).result)
  if (Object.keys(rawArticle).length === 0) return undefined
  const coverImageUrl = toCoverImageUrl(rawArticle)
  return {
    content: { blocks: toArticleBlocks(rawArticle) },
    cover_media: coverImageUrl ? { media_info: { original_img_url: coverImageUrl } } : undefined,
    preview_text: firstString(rawArticle.preview_text) || undefined,
    title: firstString(rawArticle.title) || undefined,
  }
}
