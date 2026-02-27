import type { ExtractedArticle } from '../../../types/article'

interface ArticleHeaderProps {
  article: ExtractedArticle
}

export const ArticleHeader = ({ article }: ArticleHeaderProps) => {
  const published = article.publishedAt ? ` • ${new Date(article.publishedAt).toLocaleString()}` : ''
  return (
    <header className="preview-header">
      <h1>{article.title}</h1>
      <div className="author-row">
        {article.authorAvatarUrl ? <img alt={`${article.authorName} avatar`} className="avatar" src={article.authorAvatarUrl} /> : <div className="avatar-fallback">@</div>}
        <div>
          <div className="author-name">{article.authorName}</div>
          <div className="author-meta">@{article.authorHandle}{published}</div>
        </div>
      </div>
      <a className="source-link" href={article.canonicalUrl} rel="noreferrer" target="_blank">{article.canonicalUrl}</a>
    </header>
  )
}
