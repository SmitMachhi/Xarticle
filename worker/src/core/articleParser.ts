import { buildEntityLookup, buildMediaIdMap, type MediaRef, resolveMediaRef, stripMarkdownFence, toCoverImageUrl } from './articleEntities'
import { asArray, asMap, chunkParagraphs, firstString, type UnknownMap } from './primitives'

type EntityLookup = Map<string, UnknownMap>

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
  caption?: string
  video?: string
  marks?: InlineMark[]
}

const entityFor = (entities: EntityLookup, range: unknown): UnknownMap => entities.get(String(asMap(range).key ?? '')) ?? {}

const toMediaBlock = (ref: MediaRef, caption: string | undefined): ContentBlock => {
  const block: ContentBlock = { type: 'atomic', text: '', url: ref.url }
  if (caption) block.caption = caption
  if (ref.video) block.video = ref.video
  return block
}

const resolveAtomicBlock = (entities: EntityLookup, block: UnknownMap, mediaIdMap: Map<string, MediaRef>): ContentBlock | null => {
  const entity = entityFor(entities, asArray(block.entityRanges)[0])
  const entityType = firstString(entity.type)
  const data = asMap(entity.data)
  if (entityType === 'MEDIA' || entityType === 'IMAGE') {
    const ref = resolveMediaRef(entity, mediaIdMap)
    return ref ? toMediaBlock(ref, firstString(data.caption)) : null
  }
  if (entityType === 'DIVIDER') return { type: 'divider', text: '' }
  if (entityType === 'MARKDOWN') {
    const code = stripMarkdownFence(firstString(data.markdown) || '')
    return code ? { type: 'code-block', text: code } : null
  }
  if (entityType === 'LINK') {
    const url = firstString(data.url)
    return url ? { type: 'embed', text: url, url } : null
  }
  return null
}

const STYLE_MAP: Record<string, InlineMark['type']> = {
  BOLD: 'bold',
  ITALIC: 'italic',
  UNDERLINE: 'underline',
  CODE: 'code',
}

const toValidRange = (r: UnknownMap): { offset: number; length: number } | null => {
  const offset = Number(r.offset)
  const length = Number(r.length)
  return Number.isFinite(offset) && Number.isFinite(length) && length > 0 ? { offset, length } : null
}

const styleMarks = (block: UnknownMap): InlineMark[] => {
  return asArray(block.inlineStyleRanges).flatMap((range) => {
    const r = asMap(range)
    const mapped = STYLE_MAP[(firstString(r.style) || '').toUpperCase()]
    const valid = toValidRange(r)
    return mapped && valid ? [{ ...valid, type: mapped }] : []
  })
}

const linkMarks = (block: UnknownMap, entities: EntityLookup): InlineMark[] => {
  return asArray(block.entityRanges).flatMap((range) => {
    const entity = entityFor(entities, range)
    if (firstString(entity.type) !== 'LINK') return []
    const url = firstString(asMap(entity.data).url, asMap(entity.data).href)
    const valid = toValidRange(asMap(range))
    return url && valid ? [{ ...valid, type: 'link' as const, url }] : []
  })
}

const extractAttachedMarkdown = (block: UnknownMap, entities: EntityLookup): ContentBlock[] => {
  return asArray(block.entityRanges).flatMap((range) => {
    const entity = entityFor(entities, range)
    if (firstString(entity.type) !== 'MARKDOWN') return []
    const code = stripMarkdownFence(firstString(asMap(entity.data).markdown) || '')
    return code ? [{ type: 'code-block', text: code }] : []
  })
}

const toTextBlocks = (typed: UnknownMap, blockType: string, entities: EntityLookup): ContentBlock[] => {
  const text = firstString(typed.text)
  if (!text) return []
  const marks = [...styleMarks(typed), ...linkMarks(typed, entities)]
  const primary: ContentBlock = marks.length > 0 ? { type: blockType, text, marks } : { type: blockType, text }
  return [primary, ...extractAttachedMarkdown(typed, entities)]
}

const toArticleBlocksFromState = (rawArticle: UnknownMap): ContentBlock[] => {
  const contentState = asMap(rawArticle.content_state)
  const entities = buildEntityLookup(contentState.entityMap)
  const mediaIdMap = buildMediaIdMap(rawArticle)
  return asArray(contentState.blocks).flatMap((block) => {
    const typed = asMap(block)
    const blockType = firstString(typed.type) || 'unstyled'
    if (blockType !== 'atomic') return toTextBlocks(typed, blockType, entities)
    const resolved = resolveAtomicBlock(entities, typed, mediaIdMap)
    return resolved ? [resolved] : []
  })
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
