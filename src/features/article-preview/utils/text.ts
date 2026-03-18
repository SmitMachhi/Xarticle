import type { ArticleBlock } from '../../../types/article'

const toTextByType = (block: ArticleBlock): string => {
  if (block.type === 'code') {
    return block.code
  }
  if (block.type === 'list') {
    return block.items.map((item) => item.text).join('\n')
  }
  if (block.type === 'media') {
    return block.caption || ''
  }
  if (block.type === 'embed') {
    return block.url ? `${block.text} (${block.url})` : block.text
  }
  return block.text
}

export const toPlainTextPayload = (blocks: ArticleBlock[]): string => {
  return blocks.map(toTextByType).filter((line) => line.trim().length > 0).join('\n\n')
}
