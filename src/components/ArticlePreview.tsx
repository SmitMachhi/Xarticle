import type { ExtractedArticle, ThemeMode } from '../types/article'

const metricRows = [
  { key: 'likes', label: 'Likes' },
  { key: 'replies', label: 'Replies' },
  { key: 'reposts', label: 'Reposts' },
  { key: 'views', label: 'Views' },
  { key: 'bookmarks', label: 'Bookmarks' },
] as const

interface ArticlePreviewProps {
  article: ExtractedArticle
  themeMode: ThemeMode
}

export const ArticlePreview = ({ article, themeMode }: ArticlePreviewProps) => {
  return (
    <article className={`preview-card ${themeMode === 'bw' ? 'preview-bw' : 'preview-color'}`}>
      <header className="preview-header">
        <h1>{article.title}</h1>
        <div className="author-row">
          {article.authorAvatarUrl ? (
            <img className="avatar" src={article.authorAvatarUrl} alt={`${article.authorName} avatar`} />
          ) : (
            <div className="avatar-fallback">@</div>
          )}
          <div>
            <div className="author-name">{article.authorName}</div>
            <div className="author-meta">
              @{article.authorHandle}
              {article.publishedAt ? ` • ${new Date(article.publishedAt).toLocaleString()}` : ''}
            </div>
          </div>
        </div>
        <a href={article.canonicalUrl} target="_blank" rel="noreferrer" className="source-link">
          {article.canonicalUrl}
        </a>
      </header>

      <section className="metric-grid" aria-label="article metrics">
        {metricRows.map((metric) => (
          <div className="metric-card" key={metric.key}>
            <span>{metric.label}</span>
            <strong>
              {article.metrics[metric.key] === null ? 'N/A' : article.metrics[metric.key]?.toLocaleString()}
            </strong>
          </div>
        ))}
      </section>

      {article.warnings.length > 0 ? (
        <section className="warning-box" aria-label="extraction warnings">
          <strong>Extraction Notes</strong>
          <ul>
            {article.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="article-body">
        {article.blocks.map((block, idx) => {
          const blockKey = `${block.type}-${idx}`

          if (block.type === 'heading') {
            if (block.level === 1) {
              return <h2 key={blockKey}>{block.text}</h2>
            }
            if (block.level === 2) {
              return <h3 key={blockKey}>{block.text}</h3>
            }
            return <h4 key={blockKey}>{block.text}</h4>
          }

          if (block.type === 'paragraph') {
            return <p key={blockKey}>{block.text}</p>
          }

          if (block.type === 'quote') {
            return <blockquote key={blockKey}>{block.text}</blockquote>
          }

          if (block.type === 'list') {
            return (
              <ul key={blockKey}>
                {block.items.map((item) => (
                  <li key={`${blockKey}-${item}`}>{item}</li>
                ))}
              </ul>
            )
          }

          if (block.type === 'media') {
            return (
              <figure key={blockKey} className="preview-media">
                <img src={block.url} alt={block.caption || block.mediaType} loading="lazy" />
                {block.caption ? <figcaption>{block.caption}</figcaption> : null}
              </figure>
            )
          }

          if (block.type === 'embed') {
            return (
              <p key={blockKey} className="embed-line">
                {block.url ? (
                  <a href={block.url} target="_blank" rel="noreferrer">
                    {block.text}
                  </a>
                ) : (
                  block.text
                )}
              </p>
            )
          }

          return null
        })}
      </section>
    </article>
  )
}
