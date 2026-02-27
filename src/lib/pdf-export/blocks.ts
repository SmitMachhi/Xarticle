import type { Content } from 'pdfmake/interfaces'

import type { ArticleBlock } from '../../types/article'
import {
  BODY_IMAGE_FIT_HEIGHT,
  IMAGE_FIT_WIDTH,
  MARGIN_CODE_BLOCK,
  MARGIN_INLINE_NONE,
  MARGIN_MEDIUM,
  MARGIN_SMALL,
} from './constants'

type ImageResolver = (url: string) => Promise<string | null>

const headingContent = (block: Extract<ArticleBlock, { type: 'heading' }>): Content => {
  const style = block.level === 1 ? 'h1' : block.level === 2 ? 'h2' : 'h3'
  return { text: block.text, style, margin: [MARGIN_INLINE_NONE, MARGIN_MEDIUM, MARGIN_INLINE_NONE, MARGIN_MEDIUM] }
}

const mediaFallbackContent = (block: Extract<ArticleBlock, { type: 'media' }>): Content[] => {
  const base: Content[] = [{ text: `Media: ${block.url}`, style: 'embed', link: block.url, margin: [MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_SMALL] }]
  if (block.caption) base.push({ text: block.caption, style: 'mediaCaption', margin: [MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_MEDIUM] })
  return base
}

const mediaContent = async (block: Extract<ArticleBlock, { type: 'media' }>, imageResolver: ImageResolver): Promise<Content[]> => {
  const imageDataUrl = await imageResolver(block.url)
  if (!imageDataUrl) return mediaFallbackContent(block)
  const base: Content[] = [{ image: imageDataUrl, fit: [IMAGE_FIT_WIDTH, BODY_IMAGE_FIT_HEIGHT], margin: [MARGIN_INLINE_NONE, MARGIN_MEDIUM, MARGIN_INLINE_NONE, MARGIN_SMALL] }]
  if (block.caption) base.push({ text: block.caption, style: 'mediaCaption', margin: [MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_MEDIUM] })
  return base
}

const contentForBlock = async (block: ArticleBlock, imageResolver: ImageResolver): Promise<Content[]> => {
  if (block.type === 'heading') return [headingContent(block)]
  if (block.type === 'paragraph') return [{ text: block.text, style: 'paragraph', margin: [MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_MEDIUM] }]
  if (block.type === 'quote') return [{ text: block.text, style: 'quote', margin: [MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_MEDIUM] }]
  if (block.type === 'code') return [{ text: block.code, style: 'paragraph', margin: [MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_CODE_BLOCK] }]
  if (block.type === 'list') return [{ ul: [...block.items], style: 'paragraph', margin: [MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_MEDIUM] }]
  if (block.type === 'media') return await mediaContent(block, imageResolver)
  if (block.type === 'embed' && block.url) return [{ text: block.text, link: block.url, style: 'embed', margin: [MARGIN_INLINE_NONE, 2, MARGIN_INLINE_NONE, MARGIN_MEDIUM] }]
  if (block.type === 'embed') return [{ text: block.text, style: 'embed', margin: [MARGIN_INLINE_NONE, 2, MARGIN_INLINE_NONE, MARGIN_MEDIUM] }]
  return []
}

export const blocksToContent = async (blocks: ArticleBlock[], imageResolver: ImageResolver): Promise<Content[]> => {
  const content: Content[] = []
  for (const block of blocks) {
    content.push(...(await contentForBlock(block, imageResolver)))
  }
  return content
}
