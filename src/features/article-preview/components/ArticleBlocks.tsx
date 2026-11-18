import { proxyImageUrl } from '../../../lib/imageProxy'
import type { ArticleBlock } from '../../../types/article'
import { RichText } from './RichText'

const renderHeading = (block: Extract<ArticleBlock, { type: 'heading' }>, key: string) => {
  const content = <RichText marks={block.marks} text={block.text} />
  if (block.level === 1) return <h2 key={key}>{content}</h2>
  if (block.level === 2) return <h3 key={key}>{content}</h3>
  return <h4 key={key}>{content}</h4>
}

const renderList = (block: Extract<ArticleBlock, { type: 'list' }>, key: string) => {
  const items = block.items.map((item, i) => <li key={`${key}-${i}`}><RichText marks={item.marks} text={item.text} /></li>)
  return block.ordered ? <ol key={key}>{items}</ol> : <ul key={key}>{items}</ul>
}

const renderMedia = (block: Extract<ArticleBlock, { type: 'media' }>, key: string) => {
  const image = <img alt={block.caption || block.mediaType} loading="lazy" src={proxyImageUrl(block.url)} />
  return (
    <figure key={key} className="preview-media">
      {block.link ? <a href={block.link} rel="noreferrer" target="_blank">{image}</a> : image}
      {block.link ? <figcaption><a href={block.link} rel="noreferrer" target="_blank">Watch video</a></figcaption> : null}
      {block.caption ? <figcaption>{block.caption}</figcaption> : null}
    </figure>
  )
}

const renderTable = (block: Extract<ArticleBlock, { type: 'table' }>, key: string) => (
  <div className="table-wrap" key={key}>
    <table>
      <thead><tr>{block.header.map((cell, c) => <th key={c}><RichText marks={cell.marks} text={cell.text} /></th>)}</tr></thead>
      <tbody>{block.rows.map((row, r) => <tr key={r}>{row.map((cell, c) => <td key={c}><RichText marks={cell.marks} text={cell.text} /></td>)}</tr>)}</tbody>
    </table>
  </div>
)

const renderEmbed = (block: Extract<ArticleBlock, { type: 'embed' }>, key: string) => (
  <p className="embed-line" key={key}>{block.url ? <a href={block.url} rel="noreferrer" target="_blank">{block.text}</a> : block.text}</p>
)

const renderBlock = (block: ArticleBlock, key: string) => {
  if (block.type === 'heading') return renderHeading(block, key)
  if (block.type === 'paragraph') return <p key={key}><RichText marks={block.marks} text={block.text} /></p>
  if (block.type === 'quote') return <blockquote key={key}><RichText marks={block.marks} text={block.text} /></blockquote>
  if (block.type === 'code') return <pre className="code-block" key={key}><code>{block.code}</code></pre>
  if (block.type === 'list') return renderList(block, key)
  if (block.type === 'table') return renderTable(block, key)
  if (block.type === 'media') return renderMedia(block, key)
  if (block.type === 'divider') return <hr key={key} />
  if (block.type === 'embed') return renderEmbed(block, key)
  return null
}

export const ArticleBlocks = ({ blocks }: { blocks: ArticleBlock[] }) => {
  return <section className="article-body">{blocks.map((block, index) => renderBlock(block, `${block.type}-${index}`))}</section>
}
