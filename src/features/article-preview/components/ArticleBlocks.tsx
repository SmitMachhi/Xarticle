import { proxyImageUrl } from '../../../lib/imageProxy'
import type { ArticleBlock } from '../../../types/article'
import { RichText } from './RichText'

const renderHeading = (block: Extract<ArticleBlock, { type: 'heading' }>, key: string) => {
  const content = <RichText marks={block.marks} text={block.text} />
  if (block.level === 1) return <h2 key={key}>{content}</h2>
  if (block.level === 2) return <h3 key={key}>{content}</h3>
  return <h4 key={key}>{content}</h4>
}

const renderBlock = (block: ArticleBlock, key: string) => {
  if (block.type === 'heading') return renderHeading(block, key)
  if (block.type === 'paragraph') return <p key={key}><RichText marks={block.marks} text={block.text} /></p>
  if (block.type === 'quote') return <blockquote key={key}><RichText marks={block.marks} text={block.text} /></blockquote>
  if (block.type === 'code') return <pre className="code-block" key={key}><code>{block.code}</code></pre>
  if (block.type === 'list') return <ul key={key}>{block.items.map((item, i) => <li key={`${key}-${i}`}><RichText marks={item.marks} text={item.text} /></li>)}</ul>
  if (block.type === 'media') return <figure key={key} className="preview-media"><img alt={block.caption || block.mediaType} loading="lazy" src={proxyImageUrl(block.url)} /></figure>
  if (block.type === 'embed') return <p className="embed-line" key={key}>{block.url ? <a href={block.url} rel="noreferrer" target="_blank">{block.text}</a> : block.text}</p>
  return null
}

export const ArticleBlocks = ({ blocks }: { blocks: ArticleBlock[] }) => {
  return <section className="article-body">{blocks.map((block, index) => renderBlock(block, `${block.type}-${index}`))}</section>
}
