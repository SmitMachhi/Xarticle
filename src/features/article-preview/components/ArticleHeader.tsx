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
    <header>
      <h1 className="font-serif text-4xl leading-[1.1] tracking-tight text-balance text-neutral-900 sm:text-5xl">{article.title}</h1>
      <div className="mt-6 flex items-center gap-3">
        {article.authorAvatarUrl ? <img alt="" className="size-10 rounded-full object-cover ring-1 ring-neutral-200" src={proxyImageUrl(article.authorAvatarUrl)} /> : null}
        <div className="text-sm leading-snug">
          <div className="font-medium text-neutral-900">{article.authorName}</div>
          <div className="text-neutral-500">
            <a className="hover:text-neutral-900 hover:underline" href={article.canonicalUrl} rel="noreferrer" target="_blank">@{article.authorHandle}</a>{published}
          </div>
        </div>
      </div>
      {stats ? <p aria-label="Article metrics" className="mt-4 text-sm text-neutral-500">{stats}</p> : null}
    </header>
  )
}
