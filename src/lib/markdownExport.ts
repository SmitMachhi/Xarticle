import JSZip from 'jszip'
import type { ArticleBlock, ExtractedArticle } from '../types/article'

const sanitizeFileSegment = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)

interface BuildMarkdownOptions {
  mediaLinkByUrl?: Map<string, string>
  additionalNotes?: string[]
}

export interface MarkdownDownloadResult {
  format: 'md' | 'zip'
  assetsIncluded: number
  assetsFailed: number
}

export type MarkdownDownloadMode = 'auto' | 'online-md' | 'offline-zip'

const fileExtensionFromContentType = (contentType: string | null): string => {
  if (!contentType) {
    return ''
  }
  const normalized = contentType.toLowerCase().split(';')[0].trim()
  if (normalized === 'image/jpeg') {
    return 'jpg'
  }
  if (normalized === 'image/png') {
    return 'png'
  }
  if (normalized === 'image/webp') {
    return 'webp'
  }
  if (normalized === 'image/gif') {
    return 'gif'
  }
  if (normalized === 'image/avif') {
    return 'avif'
  }
  return ''
}

const fileExtensionFromUrl = (url: string): string => {
  try {
    const pathname = new URL(url).pathname
    const maybeExt = pathname.split('.').at(-1)?.toLowerCase()
    if (!maybeExt) {
      return 'png'
    }
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'].includes(maybeExt)) {
      return maybeExt === 'jpeg' ? 'jpg' : maybeExt
    }
  } catch {
    return 'png'
  }
  return 'png'
}

const saveBlobAsFile = (blob: Blob, filename: string): void => {
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(objectUrl)
}

const toMarkdownForBlock = (block: ArticleBlock, mediaLinkByUrl?: Map<string, string>): string => {
  if (block.type === 'heading') {
    return `${'#'.repeat(block.level)} ${block.text}`
  }

  if (block.type === 'paragraph') {
    return block.text
  }

  if (block.type === 'quote') {
    return block.text
      .split('\n')
      .map((line) => `> ${line}`)
      .join('\n')
  }

  if (block.type === 'code') {
    const language = block.language || ''
    return `\`\`\`${language}\n${block.code}\n\`\`\``
  }

  if (block.type === 'list') {
    return block.items.map((item) => `- ${item}`).join('\n')
  }

  if (block.type === 'media') {
    const caption = block.caption || block.mediaType
    const mediaUrl = mediaLinkByUrl?.get(block.url) ?? block.url
    return `![${caption}](${mediaUrl})`
  }

  if (block.type === 'embed') {
    return block.url ? `[${block.text}](${block.url})` : block.text
  }

  return ''
}

export const buildArticleMarkdown = (article: ExtractedArticle, options?: BuildMarkdownOptions): string => {
  const lines: string[] = []

  lines.push(`# ${article.title}`)
  lines.push('')
  lines.push(`- author: ${article.authorName} (@${article.authorHandle})`)
  lines.push(`- source_url: ${article.canonicalUrl}`)
  lines.push(`- extracted_at: ${article.extractedAt}`)
  lines.push(`- extraction_provider: ${article.providerUsed}`)
  if (article.publishedAt) {
    lines.push(`- published_at: ${article.publishedAt}`)
  }
  lines.push('')
  lines.push('## metrics')
  lines.push('')
  lines.push(`- likes: ${article.metrics.likes ?? 'N/A'}`)
  lines.push(`- replies: ${article.metrics.replies ?? 'N/A'}`)
  lines.push(`- reposts: ${article.metrics.reposts ?? 'N/A'}`)
  lines.push(`- views: ${article.metrics.views ?? 'N/A'}`)
  lines.push(`- bookmarks: ${article.metrics.bookmarks ?? 'N/A'}`)

  const extractionNotes = [...article.warnings, ...(options?.additionalNotes ?? [])]
  if (extractionNotes.length > 0) {
    lines.push('')
    lines.push('## extraction_notes')
    lines.push('')
    extractionNotes.forEach((warning) => {
      lines.push(`- ${warning}`)
    })
  }

  lines.push('')
  lines.push('## content')
  lines.push('')

  article.blocks.forEach((block) => {
    const markdown = toMarkdownForBlock(block, options?.mediaLinkByUrl)
    if (markdown) {
      lines.push(markdown)
      lines.push('')
    }
  })

  return lines.join('\n').trim() + '\n'
}

const collectUniqueMediaUrls = (blocks: ArticleBlock[]): string[] => {
  const urls = blocks
    .filter((block): block is Extract<ArticleBlock, { type: 'media' }> => block.type === 'media')
    .map((block) => block.url)
    .filter((url) => Boolean(url))
  return [...new Set(urls)]
}

const buildBaseFilename = (article: ExtractedArticle): string => {
  const titleSegment = sanitizeFileSegment(article.title || 'article')
  const authorSegment = sanitizeFileSegment(article.authorHandle || 'unknown')
  return `${titleSegment}-${authorSegment}`
}

const downloadOfflineMarkdownZip = async (
  article: ExtractedArticle,
  baseFilename: string,
  mediaUrls: string[],
): Promise<MarkdownDownloadResult> => {
  const zip = new JSZip()
  const assetFolder = zip.folder('assets')
  const mediaLinkByUrl = new Map<string, string>()
  let assetsIncluded = 0
  let assetsFailed = 0

  for (const mediaUrl of mediaUrls) {
    try {
      const response = await fetch(mediaUrl)
      if (!response.ok) {
        assetsFailed += 1
        continue
      }

      const blob = await response.blob()
      const ext = fileExtensionFromContentType(blob.type) || fileExtensionFromUrl(mediaUrl)
      const assetName = `image-${String(assetsIncluded + 1).padStart(3, '0')}.${ext}`
      assetFolder?.file(assetName, blob)
      mediaLinkByUrl.set(mediaUrl, `assets/${assetName}`)
      assetsIncluded += 1
    } catch {
      assetsFailed += 1
    }
  }

  const additionalNotes =
    assetsFailed > 0
      ? [`${assetsFailed} media file(s) could not be downloaded for offline packaging and remain linked online.`]
      : []
  const markdown = buildArticleMarkdown(article, { mediaLinkByUrl, additionalNotes })
  zip.file('article.md', markdown)

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  saveBlobAsFile(zipBlob, `${baseFilename}.zip`)

  return {
    format: 'zip',
    assetsIncluded,
    assetsFailed,
  }
}

export const downloadArticleMarkdown = async (article: ExtractedArticle): Promise<MarkdownDownloadResult> => {
  return downloadArticleMarkdownWithMode(article, 'auto')
}

export const downloadArticleMarkdownWithMode = async (
  article: ExtractedArticle,
  mode: MarkdownDownloadMode,
): Promise<MarkdownDownloadResult> => {
  const baseFilename = buildBaseFilename(article)
  const mediaUrls = collectUniqueMediaUrls(article.blocks)

  if (mode === 'offline-zip') {
    return downloadOfflineMarkdownZip(article, baseFilename, mediaUrls)
  }

  if (mode === 'auto' && mediaUrls.length > 0) {
    return downloadOfflineMarkdownZip(article, baseFilename, mediaUrls)
  }

  const markdown = buildArticleMarkdown(article)
  const markdownBlob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
  saveBlobAsFile(markdownBlob, `${baseFilename}.md`)

  return {
    format: 'md',
    assetsIncluded: 0,
    assetsFailed: 0,
  }
}
