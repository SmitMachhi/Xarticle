import { ArticlePreview } from '../../../components/ArticlePreview'
import type { ExtractedArticle } from '../../../types/article'

export const PreviewSection = ({ article, loading }: { article: ExtractedArticle | null; loading: boolean }) => {
  if (loading) return <section aria-label="Loading preview" className="preview-skeleton card" />
  if (!article) return null
  return (
    <section className="preview-content card">
      <ArticlePreview article={article} coverMetaStyle="full" coverPageMode="always" themeMode="color" />
    </section>
  )
}
