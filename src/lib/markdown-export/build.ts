import type { ArticleBlock, ExtractedArticle } from '../../types/article'

export interface BuildMarkdownOptions {
  additionalNotes?: string[]
  mediaLinkByUrl?: Map<string, string>
}

type Renderer = (block: ArticleBlock, links?: Map<string, string>) => string

type Renderers = Record<ArticleBlock['type'], Renderer>

const renderers: Renderers = {
  heading: (block) => `${'#'.repeat((block as Extract<ArticleBlock, { type: 'heading' }>).level)} ${(block as Extract<ArticleBlock, { type: 'heading' }>).text}`,
  paragraph: (block) => (block as Extract<ArticleBlock, { type: 'paragraph' }>).text,
  quote: (block) => (block as Extract<ArticleBlock, { type: 'quote' }>).text.split('\n').map((line) => `> ${line}`).join('\n'),
  code: (block) => {
    const codeBlock = block as Extract<ArticleBlock, { type: 'code' }>
    return `\`\`\`${codeBlock.language || ''}\n${codeBlock.code}\n\`\`\``
  },
  list: (block) => (block as Extract<ArticleBlock, { type: 'list' }>).items.map((item) => `- ${item.text}`).join('\n'),
  media: (block, links) => {
    const media = block as Extract<ArticleBlock, { type: 'media' }>
    return `![${media.caption || media.mediaType}](${links?.get(media.url) ?? media.url})`
  },
  embed: (block) => {
    const embed = block as Extract<ArticleBlock, { type: 'embed' }>
    return embed.url ? `[${embed.text}](${embed.url})` : embed.text
  },
}

const pushMetricLines = (lines: string[], article: ExtractedArticle): void => {
  lines.push('- likes: ' + (article.metrics.likes ?? 'N/A'))
  lines.push('- replies: ' + (article.metrics.replies ?? 'N/A'))
  lines.push('- reposts: ' + (article.metrics.reposts ?? 'N/A'))
  lines.push('- views: ' + (article.metrics.views ?? 'N/A'))
  lines.push('- bookmarks: ' + (article.metrics.bookmarks ?? 'N/A'))
}

const markdownForBlock = (block: ArticleBlock, links?: Map<string, string>): string => renderers[block.type](block, links)

export const buildArticleMarkdown = (article: ExtractedArticle, options?: BuildMarkdownOptions): string => {
  const lines: string[] = [`# ${article.title}`, '', `- author: ${article.authorName} (@${article.authorHandle})`, `- source_url: ${article.canonicalUrl}`, `- extracted_at: ${article.extractedAt}`, `- extraction_provider: ${article.providerUsed}`]
  if (article.publishedAt) lines.push(`- published_at: ${article.publishedAt}`)
  lines.push('', '## metrics', '')
  pushMetricLines(lines, article)
  const notes = [...article.warnings, ...(options?.additionalNotes || [])]
  if (notes.length > 0) {
    lines.push('', '## extraction_notes', '')
    notes.forEach((note) => lines.push(`- ${note}`))
  }
  lines.push('', '## content', '')
  article.blocks.forEach((block) => {
    const markdown = markdownForBlock(block, options?.mediaLinkByUrl)
    if (markdown) lines.push(markdown, '')
  })
  return lines.join('\n').trim() + '\n'
}
