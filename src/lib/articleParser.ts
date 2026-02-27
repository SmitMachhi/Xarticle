import type { ArticleBlock, ExtractedArticle, MetricKey } from '../types/article'
import { getHandleFromUrl, normalizeInputUrl } from './xUrl'

const DEFAULT_METRICS: Record<MetricKey, number | null> = {
  likes: null,
  replies: null,
  reposts: null,
  views: null,
  bookmarks: null,
}

const metricPatterns: Record<MetricKey, RegExp[]> = {
  likes: [/"favorite_count"\s*:\s*(\d+)/gi, /"like_count"\s*:\s*(\d+)/gi, /(\d[\d,.]*)\s+likes?/gi],
  replies: [/"reply_count"\s*:\s*(\d+)/gi, /(\d[\d,.]*)\s+repl(?:y|ies)/gi],
  reposts: [/"retweet_count"\s*:\s*(\d+)/gi, /"repost_count"\s*:\s*(\d+)/gi, /(\d[\d,.]*)\s+reposts?/gi],
  views: [/"view_count"\s*:\s*(\d+)/gi, /"views"\s*:\s*"?(\d+)"?/gi, /(\d[\d,.]*)\s+views?/gi],
  bookmarks: [/"bookmark_count"\s*:\s*(\d+)/gi, /(\d[\d,.]*)\s+bookmarks?/gi],
}

const normalizeText = (value: string): string => value.replace(/\s+/g, ' ').trim()

const parseCount = (raw: string): number | null => {
  const cleaned = raw.replace(/,/g, '').trim().toLowerCase()
  if (!cleaned) {
    return null
  }

  const suffix = cleaned.slice(-1)
  const base = Number.parseFloat(cleaned)
  if (Number.isNaN(base)) {
    return null
  }

  if (suffix === 'k') {
    return Math.round(base * 1_000)
  }
  if (suffix === 'm') {
    return Math.round(base * 1_000_000)
  }
  if (suffix === 'b') {
    return Math.round(base * 1_000_000_000)
  }

  return Math.round(base)
}

const captureMeta = (doc: Document, key: string, attr: 'name' | 'property' = 'property'): string | undefined => {
  const node = doc.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  const content = node?.content?.trim()
  return content || undefined
}

const parseMetricsFromText = (sourceText: string): Record<MetricKey, number | null> => {
  const metrics: Record<MetricKey, number | null> = { ...DEFAULT_METRICS }

  ;(Object.keys(metricPatterns) as MetricKey[]).forEach((metricKey) => {
    const candidates: number[] = []
    for (const pattern of metricPatterns[metricKey]) {
      pattern.lastIndex = 0
      let match: RegExpExecArray | null = pattern.exec(sourceText)
      while (match) {
        const parsed = parseCount(match[1] || '')
        if (parsed !== null) {
          candidates.push(parsed)
        }
        match = pattern.exec(sourceText)
      }
    }

    if (candidates.length > 0) {
      metrics[metricKey] = Math.max(...candidates)
    }
  })

  return metrics
}

const maybePushTextBlock = (blocks: ArticleBlock[], text: string) => {
  const normalized = normalizeText(text)
  if (!normalized) {
    return
  }

  if (normalized.length < 4) {
    return
  }

  blocks.push({ type: 'paragraph', text: normalized })
}

const parseList = (listNode: HTMLUListElement | HTMLOListElement): ArticleBlock | null => {
  const items = Array.from(listNode.querySelectorAll('li'))
    .map((item) => normalizeText(item.textContent || ''))
    .filter(Boolean)

  if (items.length === 0) {
    return null
  }

  return {
    type: 'list',
    items,
  }
}

const parseMedia = (mediaNode: HTMLImageElement | HTMLVideoElement): ArticleBlock | null => {
  if (mediaNode instanceof HTMLImageElement) {
    const imageUrl = mediaNode.src || mediaNode.currentSrc
    if (!imageUrl) {
      return null
    }

    const figure = mediaNode.closest('figure')
    const caption = figure?.querySelector('figcaption')?.textContent || mediaNode.alt || undefined

    return {
      type: 'media',
      mediaType: 'image',
      url: imageUrl,
      caption: caption ? normalizeText(caption) : undefined,
    }
  }

  return null
}

const parseCodeBlock = (codeNode: HTMLPreElement): ArticleBlock | null => {
  const text = (codeNode.textContent || '').replace(/\r\n/g, '\n').trim()
  if (!text) {
    return null
  }

  const codeEl = codeNode.querySelector('code')
  const className = codeEl?.className || ''
  const languageMatch = className.match(/language-([A-Za-z0-9_+-]+)/)

  return {
    type: 'code',
    code: text,
    language: languageMatch?.[1],
  }
}

const extractBlocksFromDocument = (doc: Document): ArticleBlock[] => {
  const blocks: ArticleBlock[] = []
  const articleNode = doc.querySelector('article') || doc.querySelector('main')

  if (!articleNode) {
    return blocks
  }

  const nodes = Array.from(articleNode.querySelectorAll('h1, h2, h3, p, pre, blockquote, ul, ol, img, video, figure, iframe'))

  for (const node of nodes) {
    if (node instanceof HTMLHeadingElement) {
      const text = normalizeText(node.textContent || '')
      if (!text) {
        continue
      }
      const level = Number.parseInt(node.tagName.slice(1), 10)
      blocks.push({
        type: 'heading',
        text,
        level: level === 1 || level === 2 || level === 3 ? level : 2,
      })
      continue
    }

    if (node instanceof HTMLParagraphElement) {
      maybePushTextBlock(blocks, node.textContent || '')
      continue
    }

    if (node instanceof HTMLPreElement) {
      const codeBlock = parseCodeBlock(node)
      if (codeBlock) {
        blocks.push(codeBlock)
      }
      continue
    }

    if (node instanceof HTMLQuoteElement) {
      const text = normalizeText(node.textContent || '')
      if (text) {
        blocks.push({ type: 'quote', text })
      }
      continue
    }

    if (node instanceof HTMLUListElement || node instanceof HTMLOListElement) {
      const parsedList = parseList(node)
      if (parsedList) {
        blocks.push(parsedList)
      }
      continue
    }

    if (node instanceof HTMLImageElement || node instanceof HTMLVideoElement) {
      const mediaBlock = parseMedia(node)
      if (mediaBlock) {
        blocks.push(mediaBlock)
      }
      continue
    }

    if (node instanceof HTMLIFrameElement) {
      const src = node.src
      if (src) {
        blocks.push({
          type: 'embed',
          text: `Embedded media: ${src}`,
          url: src,
        })
      }
    }
  }

  return dedupeBlocks(blocks)
}

const dedupeBlocks = (blocks: ArticleBlock[]): ArticleBlock[] => {
  const seen = new Set<string>()
  const deduped: ArticleBlock[] = []

  for (const block of blocks) {
    let fingerprint = block.type
    if (block.type === 'paragraph' || block.type === 'quote' || block.type === 'heading') {
      fingerprint += `:${block.text}`
    }
    if (block.type === 'code') {
      fingerprint += `:${block.language || 'plain'}:${block.code}`
    }
    if (block.type === 'list') {
      fingerprint += `:${block.items.join('|')}`
    }
    if (block.type === 'media') {
      fingerprint += `:${block.url}`
    }
    if (block.type === 'embed') {
      fingerprint += `:${block.url || block.text}`
    }

    if (!seen.has(fingerprint)) {
      seen.add(fingerprint)
      deduped.push(block)
    }
  }

  return deduped
}

const inferAuthorAvatar = (html: string): string | undefined => {
  const match = html.match(/https:\/\/pbs\.twimg\.com\/profile_images\/[^"'\s]+/i)
  return match?.[0]
}

const inferPublishedAt = (doc: Document): string | undefined => {
  return (
    captureMeta(doc, 'article:published_time') ||
    captureMeta(doc, 'og:updated_time') ||
    doc.querySelector('time')?.getAttribute('datetime') ||
    undefined
  )
}

const inferTitle = (doc: Document): string => {
  return (
    captureMeta(doc, 'og:title') ||
    captureMeta(doc, 'twitter:title', 'name') ||
    normalizeText(doc.querySelector('title')?.textContent || '') ||
    'Untitled X Article'
  )
}

const inferAuthorName = (doc: Document): string | undefined => {
  const fromMeta = captureMeta(doc, 'og:site_name') || captureMeta(doc, 'twitter:creator', 'name')
  if (fromMeta) {
    return fromMeta.replace(/^@/, '').trim()
  }

  const h = doc.querySelector('h1, h2, h3')
  if (h?.textContent) {
    return normalizeText(h.textContent)
  }

  return undefined
}

const buildFallbackBlocks = (doc: Document): ArticleBlock[] => {
  const blocks = extractBlocksFromDocument(doc)
  if (blocks.length > 0) {
    return blocks
  }

  const paragraphNodes = Array.from(doc.querySelectorAll('p'))
  const parsed: ArticleBlock[] = []
  paragraphNodes.forEach((node) => {
    maybePushTextBlock(parsed, node.textContent || '')
  })

  return parsed
}

const parseMarkdownImage = (line: string): ArticleBlock | null => {
  const match = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
  if (!match) {
    return null
  }

  return {
    type: 'media',
    mediaType: 'image',
    caption: match[1] ? normalizeText(match[1]) : undefined,
    url: match[2],
  }
}

const parseMarkdownFenceStart = (line: string): { language?: string } | null => {
  const match = line.match(/^```([A-Za-z0-9_+-]+)?\s*$/)
  if (!match) {
    return null
  }

  return {
    language: match[1] || undefined,
  }
}

export const parseJinaMarkdown = (raw: string, sourceUrl: string): ExtractedArticle => {
  const marker = 'Markdown Content:'
  const markerIndex = raw.indexOf(marker)
  const markdown = markerIndex >= 0 ? raw.slice(markerIndex + marker.length).trim() : raw

  const lines = markdown.split('\n').map((line) => line.trimEnd())
  const blocks: ArticleBlock[] = []
  let paragraphBuffer: string[] = []
  let listBuffer: string[] = []
  let codeBuffer: string[] = []
  let codeLanguage: string | undefined
  let inCodeFence = false

  const flushParagraph = () => {
    if (paragraphBuffer.length === 0) {
      return
    }
    const text = normalizeText(paragraphBuffer.join(' '))
    if (text) {
      blocks.push({ type: 'paragraph', text })
    }
    paragraphBuffer = []
  }

  const flushList = () => {
    if (listBuffer.length === 0) {
      return
    }
    blocks.push({ type: 'list', items: [...listBuffer] })
    listBuffer = []
  }

  const flushCode = () => {
    if (codeBuffer.length === 0) {
      return
    }
    const code = codeBuffer.join('\n').trim()
    if (code) {
      blocks.push({
        type: 'code',
        code,
        language: codeLanguage,
      })
    }
    codeBuffer = []
    codeLanguage = undefined
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()

    if (inCodeFence) {
      if (parseMarkdownFenceStart(line)) {
        inCodeFence = false
        flushCode()
      } else {
        codeBuffer.push(rawLine)
      }
      continue
    }

    const codeFenceStart = parseMarkdownFenceStart(line)
    if (codeFenceStart) {
      flushParagraph()
      flushList()
      inCodeFence = true
      codeLanguage = codeFenceStart.language
      continue
    }

    if (!line) {
      flushParagraph()
      flushList()
      continue
    }

    const media = parseMarkdownImage(line)
    if (media) {
      flushParagraph()
      flushList()
      blocks.push(media)
      continue
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/)
    if (headingMatch) {
      flushParagraph()
      flushList()
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length as 1 | 2 | 3,
        text: normalizeText(headingMatch[2]),
      })
      continue
    }

    const listMatch = line.match(/^[-*]\s+(.+)$/)
    if (listMatch) {
      flushParagraph()
      listBuffer.push(normalizeText(listMatch[1]))
      continue
    }

    if (line.startsWith('>')) {
      flushParagraph()
      flushList()
      const quoteText = normalizeText(line.replace(/^>+/, ''))
      if (quoteText) {
        blocks.push({ type: 'quote', text: quoteText })
      }
      continue
    }

    paragraphBuffer.push(line)
  }

  flushParagraph()
  flushList()
  if (inCodeFence) {
    flushCode()
  }

  const url = normalizeInputUrl(sourceUrl)
  const titleLineMatch = raw.match(/Title:\s*(.+)/)
  const authorMatch = raw.match(/by\s+(.+?)\s+\(@([^)]+)\)/i)
  const titleFromRaw = titleLineMatch?.[1]?.trim()

  const title = titleFromRaw && titleFromRaw !== 'X' ? titleFromRaw.replace(/\s*\/\s*X$/i, '') : blocks.find((b) => b.type === 'heading')?.text || 'Untitled X Article'

  const article: ExtractedArticle = {
    sourceUrl,
    canonicalUrl: sourceUrl,
    title,
    authorName: authorMatch?.[1]?.trim() || getHandleFromUrl(url),
    authorHandle: authorMatch?.[2]?.trim() || getHandleFromUrl(url),
    metrics: parseMetricsFromText(raw),
    metricNotes: {
      likes: 'best effort from fallback text parsing',
      replies: 'best effort from fallback text parsing',
      reposts: 'best effort from fallback text parsing',
      views: 'best effort from fallback text parsing',
      bookmarks: 'best effort from fallback text parsing',
    },
    blocks,
    warnings: ['Fallback extraction mode used. Some metrics or embeds may be missing.'],
    extractedAt: new Date().toISOString(),
    mode: 'fallback',
    providerUsed: 'jina',
    providerAttempts: [],
  }

  return article
}

export const parseXHtmlDocument = (html: string, sourceUrl: string): ExtractedArticle => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  const normalizedUrl = normalizeInputUrl(sourceUrl)
  const title = inferTitle(doc)
  const handle = captureMeta(doc, 'twitter:creator', 'name')?.replace(/^@/, '') || getHandleFromUrl(normalizedUrl)

  const blocks = buildFallbackBlocks(doc)
  if (blocks.length === 0) {
    throw new Error('No article body content was found on this page.')
  }

  const article: ExtractedArticle = {
    sourceUrl,
    canonicalUrl: captureMeta(doc, 'og:url') || sourceUrl,
    title,
    authorName: inferAuthorName(doc) || handle,
    authorHandle: handle,
    authorAvatarUrl: inferAuthorAvatar(html),
    publishedAt: inferPublishedAt(doc),
    metrics: parseMetricsFromText(html),
    metricNotes: {
      bookmarks: 'best effort from public page data',
    },
    blocks,
    warnings: [],
    extractedAt: new Date().toISOString(),
    mode: 'companion',
    providerUsed: 'companion',
    providerAttempts: [],
  }

  if (article.metrics.bookmarks === null) {
    article.warnings.push('Bookmark count is often unavailable on public pages.')
  }

  return article
}
