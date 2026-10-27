import type { Content, CustomTableLayout } from 'pdfmake/interfaces'

import type { ArticleBlock } from '../../types/article'
import {
  BODY_IMAGE_FIT_HEIGHT,
  DIVIDER_LINE_WIDTH,
  IMAGE_FIT_WIDTH,
  MARGIN_CODE_BLOCK,
  MARGIN_INLINE_NONE,
  MARGIN_LARGE,
  MARGIN_MEDIUM,
  MARGIN_SMALL,
  MARGIN_XLARGE,
  QUOTE_BAR_WIDTH,
  QUOTE_PADDING_LEFT,
  VIDEO_LINK_LABEL,
} from './constants'
import { pdfSafeText } from './glyphs'
import { inlineText } from './inline'
import type { PdfPalette } from './styles'

type ImageResolver = (url: string) => Promise<string | null>
type Margins = [number, number, number, number]

const BLOCK_MARGIN: Margins = [MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_MEDIUM]
const CAPTION_MARGIN: Margins = [MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_MEDIUM]
const HEADING_STYLES = ['h1', 'h2', 'h3'] as const

const headingContent = (block: Extract<ArticleBlock, { type: 'heading' }>): Content => {
  const style = HEADING_STYLES[block.level - 1]
  return { text: inlineText(block.text, block.marks), style, headlineLevel: block.level, margin: [MARGIN_INLINE_NONE, MARGIN_XLARGE, MARGIN_INLINE_NONE, MARGIN_MEDIUM] }
}

const listContent = (block: Extract<ArticleBlock, { type: 'list' }>): Content => {
  const items = block.items.map((item) => ({ text: inlineText(item.text, item.marks), style: 'paragraph' }))
  return block.ordered ? { ol: items, margin: BLOCK_MARGIN } : { ul: items, margin: BLOCK_MARGIN }
}

const quoteLayout = (palette: PdfPalette): CustomTableLayout => ({
  hLineWidth: () => MARGIN_INLINE_NONE,
  vLineWidth: (index) => (index === 0 ? QUOTE_BAR_WIDTH : MARGIN_INLINE_NONE),
  vLineColor: () => palette.accent,
  paddingLeft: () => QUOTE_PADDING_LEFT,
})

const quoteContent = (block: Extract<ArticleBlock, { type: 'quote' }>, palette: PdfPalette): Content => ({
  table: { widths: ['*'], body: [[{ text: inlineText(block.text, block.marks), style: 'quote' }]] },
  layout: quoteLayout(palette),
  margin: [MARGIN_INLINE_NONE, MARGIN_SMALL, MARGIN_INLINE_NONE, MARGIN_LARGE],
})

const dividerContent = (palette: PdfPalette): Content => ({
  table: { widths: ['*'], body: [['']] },
  layout: { hLineWidth: (index) => (index === 0 ? DIVIDER_LINE_WIDTH : MARGIN_INLINE_NONE), vLineWidth: () => MARGIN_INLINE_NONE, hLineColor: () => palette.rule },
  margin: [MARGIN_INLINE_NONE, MARGIN_LARGE, MARGIN_INLINE_NONE, MARGIN_SMALL],
})

const mediaExtras = (block: Extract<ArticleBlock, { type: 'media' }>): Content[] => {
  const extras: Content[] = []
  if (block.link) extras.push({ text: VIDEO_LINK_LABEL, link: block.link, style: 'embed', margin: CAPTION_MARGIN })
  if (block.caption) extras.push({ text: pdfSafeText(block.caption), style: 'mediaCaption', margin: CAPTION_MARGIN })
  return extras
}

const mediaContent = async (block: Extract<ArticleBlock, { type: 'media' }>, imageResolver: ImageResolver): Promise<Content[]> => {
  const imageDataUrl = await imageResolver(block.url)
  const visual: Content = imageDataUrl
    ? { image: imageDataUrl, fit: [IMAGE_FIT_WIDTH, BODY_IMAGE_FIT_HEIGHT], link: block.link, margin: [MARGIN_INLINE_NONE, MARGIN_MEDIUM, MARGIN_INLINE_NONE, MARGIN_SMALL] }
    : { text: `Media: ${block.url}`, style: 'embed', link: block.url, margin: [MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_SMALL] }
  return [visual, ...mediaExtras(block)]
}

const embedContent = (block: Extract<ArticleBlock, { type: 'embed' }>): Content => {
  return { text: pdfSafeText(block.text), link: block.url, style: 'embed', margin: [MARGIN_INLINE_NONE, 2, MARGIN_INLINE_NONE, MARGIN_MEDIUM] }
}

const contentForBlock = async (block: ArticleBlock, imageResolver: ImageResolver, palette: PdfPalette): Promise<Content[]> => {
  if (block.type === 'heading') return [headingContent(block)]
  if (block.type === 'paragraph') return [{ text: inlineText(block.text, block.marks), style: 'paragraph', margin: BLOCK_MARGIN }]
  if (block.type === 'quote') return [quoteContent(block, palette)]
  if (block.type === 'code') return [{ text: pdfSafeText(block.code), style: 'codeBlock', margin: [MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_CODE_BLOCK] }]
  if (block.type === 'list') return [listContent(block)]
  if (block.type === 'media') return await mediaContent(block, imageResolver)
  if (block.type === 'embed') return [embedContent(block)]
  if (block.type === 'divider') return [dividerContent(palette)]
  return []
}

export const blocksToContent = async (blocks: ArticleBlock[], imageResolver: ImageResolver, palette: PdfPalette): Promise<Content[]> => {
  const content: Content[] = []
  for (const block of blocks) {
    content.push(...(await contentForBlock(block, imageResolver, palette)))
  }
  return content
}
