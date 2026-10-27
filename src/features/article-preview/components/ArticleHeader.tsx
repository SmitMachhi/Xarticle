import { proxyImageUrl } from '../../../lib/imageProxy'
import type { ExtractedArticle } from '../../../types/article'
import { DATE_FORMAT, DATE_LOCALE, METRIC_ROWS } from '../constants'

const statsLine = (article: ExtractedArticle): string => {
  return METRIC_ROWS.flatMap(({ key, label }) => {
    const value = article.metrics[key]
    return value === null ? [] : [`${value.toLocaleString(DATE_LOCALE)} ${label}`]
  }).join(' · ')
}

export const ArticleHeader = ({ article }: { article: ExtractedArticle }) => {
  const published = article.publishedAt ? ` · ${new Date(article.publishedAt).toLocaleDateString(DATE_LOCALE, DATE_FORMAT)}` : ''
  const stats = statsLine(article)
  return (
    <header className="preview-header">
      <h1>{article.title}</h1>
      <div className="author-row">
        {article.authorAvatarUrl ? <img alt="" className="avatar" src={proxyImageUrl(article.authorAvatarUrl)} /> : null}
        <div>
          <div className="author-name">{article.authorName}</div>
          <div className="author-meta">
            <a href={article.canonicalUrl} rel="noreferrer" target="_blank">@{article.authorHandle}</a>{published}
          </div>
        </div>
      </div>
      {stats ? <p aria-label="Article metrics" className="stats-line">{stats}</p> : null}
    </header>
  )
}
