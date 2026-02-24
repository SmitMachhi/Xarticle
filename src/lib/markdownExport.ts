import type { ArticleBlock, ExtractedArticle } from '../types/article'

const sanitizeFileSegment = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)

const toMarkdownForBlock = (block: ArticleBlock): string => {
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
    return `![${caption}](${block.url})`
  }

  if (block.type === 'embed') {
    return block.url ? `[${block.text}](${block.url})` : block.text
  }

  return ''
}

export const buildArticleMarkdown = (article: ExtractedArticle): string => {
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

  if (article.warnings.length > 0) {
    lines.push('')
    lines.push('## extraction_notes')
    lines.push('')
    article.warnings.forEach((warning) => {
      lines.push(`- ${warning}`)
    })
  }

  lines.push('')
  lines.push('## content')
  lines.push('')

  article.blocks.forEach((block) => {
    const markdown = toMarkdownForBlock(block)
    if (markdown) {
      lines.push(markdown)
      lines.push('')
    }
  })

  return lines.join('\n').trim() + '\n'
}

export const downloadArticleMarkdown = (article: ExtractedArticle): void => {
  const titleSegment = sanitizeFileSegment(article.title || 'article')
  const authorSegment = sanitizeFileSegment(article.authorHandle || 'unknown')
  const filename = `${titleSegment}-${authorSegment}.md`
  const markdown = buildArticleMarkdown(article)

  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(objectUrl)
}
