import type { ArticleBlock } from '../../../types/article'

const renderHeading = (block: Extract<ArticleBlock, { type: 'heading' }>, key: string) => {
  if (block.level === 1) {
    return <h2 key={key}>{block.text}</h2>
  }
  if (block.level === 2) {
    return <h3 key={key}>{block.text}</h3>
  }
  return <h4 key={key}>{block.text}</h4>
}

const renderBlock = (block: ArticleBlock, key: string) => {
  if (block.type === 'heading') return renderHeading(block, key)
  if (block.type === 'paragraph') return <p key={key}>{block.text}</p>
  if (block.type === 'quote') return <blockquote key={key}>{block.text}</blockquote>
  if (block.type === 'code') return <pre key={key}><code>{block.code}</code></pre>
  if (block.type === 'list') return <ul key={key}>{block.items.map((item) => <li key={`${key}-${item}`}>{item}</li>)}</ul>
  if (block.type === 'media') return <figure key={key} className="preview-media"><img alt={block.caption || block.mediaType} loading="lazy" src={block.url} /></figure>
  if (block.type === 'embed') return <p className="embed-line" key={key}>{block.url ? <a href={block.url} rel="noreferrer" target="_blank">{block.text}</a> : block.text}</p>
  return null
}

export const ArticleBlocks = ({ blocks }: { blocks: ArticleBlock[] }) => {
  return <section className="article-body">{blocks.map((block, index) => renderBlock(block, `${block.type}-${index}`))}</section>
}
