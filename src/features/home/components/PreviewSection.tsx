import { ArticlePreview } from '../../../components/ArticlePreview'
import type { ExtractedArticle } from '../../../types/article'

interface PreviewSectionProps {
  article: ExtractedArticle | null
  error: string | null
  loading: boolean
}

const renderPreview = (article: ExtractedArticle | null, loading: boolean) => {
  if (loading) {
    return <section className="preview-skeleton" aria-label="Loading preview" />
  }
  if (!article) {
    return <section className="empty-state"><p>Paste one public X Article link, then click Load Article.</p></section>
  }
  return <ArticlePreview article={article} coverMetaStyle="full" coverPageMode="always" themeMode="color" />
}

export const PreviewSection = ({ article, error, loading }: PreviewSectionProps) => {
  return (
    <section className="preview-band">
      {error ? <section className="error-box app-card">{error}</section> : null}
      <div className="preview-content app-card">
        <h2>Preview</h2>
        {renderPreview(article, loading)}
      </div>
    </section>
  )
}
