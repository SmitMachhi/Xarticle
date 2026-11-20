import type { ArticleBlock, ExtractedArticle } from '../../types/article'
import { parseMarkdownBlocks } from '../markdown/blocks'
import { getHandleFromUrl, normalizeInputUrl } from '../xUrl'
import { parseMetricsFromText } from './metrics'

const MARKDOWN_MARKER = 'Markdown Content:'

const resolveTitle = (raw: string, blocks: ArticleBlock[]): string => {
  const titleLineMatch = raw.match(/Title:\s*(.+)/)
  const candidate = titleLineMatch?.[1]?.trim()
  if (candidate && candidate !== 'X') {
    return candidate.replace(/\s*\/\s*X$/i, '')
  }
  return blocks.find((block) => block.type === 'heading')?.text || 'Untitled X Article'
}

export const parseJinaMarkdown = (raw: string, sourceUrl: string): ExtractedArticle => {
  const markdown = raw.includes(MARKDOWN_MARKER) ? raw.slice(raw.indexOf(MARKDOWN_MARKER) + MARKDOWN_MARKER.length).trim() : raw
  const blocks = parseMarkdownBlocks(markdown)
  const authorMatch = raw.match(/by\s+(.+?)\s+\(@([^)]+)\)/i)
  const url = normalizeInputUrl(sourceUrl)
  return {
    sourceUrl,
    canonicalUrl: sourceUrl,
    title: resolveTitle(raw, blocks),
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
}
