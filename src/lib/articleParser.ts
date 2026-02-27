import type { ExtractedArticle } from '../types/article'
import { captureMetaContent, extractBlocksFromDocument, inferAuthorName, inferPublishedAt, inferTitle } from './article-parser/document'
import { parseJinaMarkdown } from './article-parser/markdown'
import { parseMetricsFromText } from './article-parser/metrics'
import { getHandleFromUrl, normalizeInputUrl } from './xUrl'

const inferAuthorAvatar = (html: string): string | undefined => {
  return html.match(/https:\/\/pbs\.twimg\.com\/profile_images\/[^"'\s]+/i)?.[0]
}

const fallbackParagraphs = (doc: Document): ExtractedArticle['blocks'] => {
  return Array.from(doc.querySelectorAll('p'))
    .map((node) => (node.textContent || '').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .map((text) => ({ type: 'paragraph', text }))
}

export { parseJinaMarkdown }

export const parseXHtmlDocument = (html: string, sourceUrl: string): ExtractedArticle => {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const normalizedUrl = normalizeInputUrl(sourceUrl)
  const blocks = extractBlocksFromDocument(doc)
  const resolvedBlocks = blocks.length > 0 ? blocks : fallbackParagraphs(doc)
  if (resolvedBlocks.length === 0) {
    throw new Error('No article body content was found on this page.')
  }
  const handle = captureMetaContent(doc, 'twitter:creator', 'name')?.replace(/^@/, '') || getHandleFromUrl(normalizedUrl)
  const article: ExtractedArticle = {
    sourceUrl,
    canonicalUrl: captureMetaContent(doc, 'og:url') || sourceUrl,
    title: inferTitle(doc),
    authorName: inferAuthorName(doc) || handle,
    authorHandle: handle,
    authorAvatarUrl: inferAuthorAvatar(html),
    publishedAt: inferPublishedAt(doc),
    metrics: parseMetricsFromText(html),
    metricNotes: { bookmarks: 'best effort from public page data' },
    blocks: resolvedBlocks,
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
