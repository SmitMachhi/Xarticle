import type { CoverMetaStyle, CoverPageMode, ExtractedArticle, ThemeMode } from '../types/article'

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
  coverPageMode: CoverPageMode
  coverMetaStyle: CoverMetaStyle
}

const getCoverMediaIndex = (blocks: ExtractedArticle['blocks']): number =>
  blocks.findIndex((block) => block.type === 'media' && block.caption?.toLowerCase() === 'cover image')

export const ArticlePreview = ({ article, themeMode, coverPageMode, coverMetaStyle }: ArticlePreviewProps) => {
  const coverMeta = coverMetaStyle === 'minimal'
    ? `@${article.authorHandle}`
    : `@${article.authorHandle}${article.publishedAt ? ` • ${new Date(article.publishedAt).toLocaleString()}` : ''}`
  const showBodyHeader = coverPageMode !== 'always'
  const coverMediaIndex = getCoverMediaIndex(article.blocks)
  const coverMediaBlock = coverMediaIndex >= 0 ? article.blocks[coverMediaIndex] : null
  const visibleBlocks = coverPageMode === 'always'
    ? article.blocks.filter((_, index) => index !== coverMediaIndex)
    : article.blocks
  const previewStackClass = `preview-stack ${themeMode === 'bw' ? 'preview-bw' : 'preview-color'}`

  return (
    <div className={previewStackClass}>
      {coverPageMode === 'always' ? (
        <article className="preview-card preview-cover" id="preview-section-cover">
          {coverMediaBlock?.type === 'media' ? (
            <figure className="preview-cover-media">
              <img src={coverMediaBlock.url} alt={coverMediaBlock.caption || coverMediaBlock.mediaType} loading="lazy" />
              {coverMediaBlock.caption ? <figcaption>{coverMediaBlock.caption}</figcaption> : null}
            </figure>
          ) : null}
          <header className="preview-header">
            <div className="source-badge">Xarticle.co</div>
            <h1>{article.title}</h1>
            <div className="author-row">
              {article.authorAvatarUrl ? (
                <img className="avatar" src={article.authorAvatarUrl} alt={`${article.authorName} avatar`} />
              ) : (
                <div className="avatar-fallback">@</div>
              )}
              <div>
                <div className="author-name">{article.authorName}</div>
                <div className="author-meta">{coverMeta}</div>
              </div>
            </div>
            <a href={article.canonicalUrl} target="_blank" rel="noreferrer" className="source-link">
              {article.canonicalUrl}
            </a>
          </header>

          <section className="metric-grid" aria-label="cover metrics" id="preview-section-stats">
            {metricRows.map((metric) => (
              <div className="metric-card" key={`cover-${metric.key}`}>
                <span>{metric.label}</span>
                <strong>{article.metrics[metric.key] === null ? 'N/A' : article.metrics[metric.key]?.toLocaleString()}</strong>
                {article.metricNotes?.[metric.key] ? <em>{article.metricNotes[metric.key]}</em> : null}
              </div>
            ))}
          </section>
        </article>
      ) : null}

      <article className="preview-card" id="preview-section-article">
        {showBodyHeader ? (
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
        ) : null}

        {showBodyHeader ? (
          <section className="metric-grid" aria-label="article metrics" id="preview-section-stats">
            {metricRows.map((metric) => (
              <div className="metric-card" key={metric.key}>
                <span>{metric.label}</span>
                <strong>
                  {article.metrics[metric.key] === null ? 'N/A' : article.metrics[metric.key]?.toLocaleString()}
                </strong>
                {article.metricNotes?.[metric.key] ? <em>{article.metricNotes[metric.key]}</em> : null}
              </div>
            ))}
          </section>
        ) : null}

        <section className="article-body">
          {visibleBlocks.map((block, idx) => {
            const blockKey = `${block.type}-${idx}`
            const hasMediaAnchor = visibleBlocks
              .slice(0, idx)
              .some((candidate) => candidate.type === 'media')
            const hasEmbedAnchor = visibleBlocks
              .slice(0, idx)
              .some((candidate) => candidate.type === 'embed')

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

          if (block.type === 'code') {
            return (
              <pre key={blockKey} className="code-block">
                <code>{block.code}</code>
              </pre>
            )
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
              <figure
                key={blockKey}
                className="preview-media"
                id={!hasMediaAnchor ? 'preview-section-media' : undefined}
              >
                <img src={block.url} alt={block.caption || block.mediaType} loading="lazy" />
                {block.caption ? <figcaption>{block.caption}</figcaption> : null}
              </figure>
            )
          }

          if (block.type === 'embed') {
            return (
              <p key={blockKey} className="embed-line" id={!hasEmbedAnchor ? 'preview-section-embeds' : undefined}>
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
    </div>
  )
}
