import type { ArticleBlock } from '../../types/article'
import {
  HEADING_LEVEL_ONE,
  HEADING_LEVEL_THREE,
  HEADING_LEVEL_TWO,
  MIN_PARAGRAPH_LENGTH,
} from './constants'
import { normalizeText } from './text'

const captureMeta = (doc: Document, key: string, attr: 'name' | 'property' = 'property'): string | undefined => {
  const node = doc.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  return node?.content?.trim() || undefined
}

const paragraphText = (text: string): string | null => {
  const normalized = normalizeText(text)
  return normalized && normalized.length >= MIN_PARAGRAPH_LENGTH ? normalized : null
}

const parseHeading = (node: HTMLHeadingElement): ArticleBlock | null => {
  const text = paragraphText(node.textContent || '')
  if (!text) return null
  const level = Number.parseInt(node.tagName.slice(HEADING_LEVEL_ONE), 10)
  const normalizedLevel = level === HEADING_LEVEL_ONE || level === HEADING_LEVEL_TWO || level === HEADING_LEVEL_THREE ? level : HEADING_LEVEL_TWO
  return { type: 'heading', text, level: normalizedLevel }
}

const parseList = (node: HTMLUListElement | HTMLOListElement): ArticleBlock | null => {
  const items = Array.from(node.querySelectorAll('li')).map((item) => normalizeText(item.textContent || '')).filter(Boolean)
  return items.length > 0 ? { type: 'list', items: items.map((text) => ({ text })) } : null
}

const parseCode = (node: HTMLPreElement): ArticleBlock | null => {
  const code = (node.textContent || '').replace(/\r\n/g, '\n').trim()
  if (!code) return null
  const languageMatch = (node.querySelector('code')?.className || '').match(/language-([A-Za-z0-9_+-]+)/)
  return { type: 'code', code, language: languageMatch?.[1] }
}

const parseImage = (node: HTMLImageElement): ArticleBlock | null => {
  const url = node.src || node.currentSrc
  if (!url) return null
  const caption = node.closest('figure')?.querySelector('figcaption')?.textContent || node.alt || undefined
  return { type: 'media', mediaType: 'image', url, caption: caption ? normalizeText(caption) : undefined }
}

const parseParagraphOrQuote = (node: Element): ArticleBlock | null => {
  const text = paragraphText(node.textContent || '')
  if (!text) return null
  return node.tagName.toLowerCase() === 'blockquote' ? { type: 'quote', text } : { type: 'paragraph', text }
}

const parseEmbedded = (node: HTMLIFrameElement): ArticleBlock | null => (node.src ? { type: 'embed', text: `Embedded media: ${node.src}`, url: node.src } : null)

const parseNode = (node: Element): ArticleBlock | null => {
  if (node instanceof HTMLHeadingElement) return parseHeading(node)
  if (node instanceof HTMLParagraphElement || node instanceof HTMLQuoteElement) return parseParagraphOrQuote(node)
  if (node instanceof HTMLPreElement) return parseCode(node)
  if (node instanceof HTMLUListElement || node instanceof HTMLOListElement) return parseList(node)
  if (node instanceof HTMLImageElement) return parseImage(node)
  if (node instanceof HTMLIFrameElement) return parseEmbedded(node)
  return null
}

const dedupeFingerprint = (block: ArticleBlock): string => {
  if (block.type === 'list') return `list:${block.items.map((i) => i.text).join('|')}`
  if (block.type === 'code') return `code:${block.language || 'plain'}:${block.code}`
  if (block.type === 'media') return `media:${block.url}`
  if (block.type === 'embed') return `embed:${block.url || block.text}`
  return `${block.type}:${block.text}`
}

const dedupeBlocks = (blocks: ArticleBlock[]): ArticleBlock[] => {
  const seen = new Set<string>()
  return blocks.filter((block) => {
    const fingerprint = dedupeFingerprint(block)
    const fresh = !seen.has(fingerprint)
    if (fresh) seen.add(fingerprint)
    return fresh
  })
}

export const extractBlocksFromDocument = (doc: Document): ArticleBlock[] => {
  const articleNode = doc.querySelector('article') || doc.querySelector('main')
  if (!articleNode) return []
  const selectors = 'h1, h2, h3, p, pre, blockquote, ul, ol, img, iframe'
  const blocks = Array.from(articleNode.querySelectorAll(selectors)).map(parseNode).filter((block): block is ArticleBlock => block !== null)
  return dedupeBlocks(blocks)
}

export const inferPublishedAt = (doc: Document): string | undefined => captureMeta(doc, 'article:published_time') || captureMeta(doc, 'og:updated_time') || doc.querySelector('time')?.getAttribute('datetime') || undefined

export const inferTitle = (doc: Document): string => {
  return captureMeta(doc, 'og:title') || captureMeta(doc, 'twitter:title', 'name') || normalizeText(doc.querySelector('title')?.textContent || '') || 'Untitled X Article'
}

export const inferAuthorName = (doc: Document): string | undefined => {
  const fromMeta = captureMeta(doc, 'og:site_name') || captureMeta(doc, 'twitter:creator', 'name')
  if (fromMeta) return fromMeta.replace(/^@/, '').trim()
  const heading = doc.querySelector('h1, h2, h3')
  return heading?.textContent ? normalizeText(heading.textContent) : undefined
}

export const captureMetaContent = captureMeta
