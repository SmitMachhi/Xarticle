import { ArticlePreview } from '../../../components/ArticlePreview'
import { BlurFade } from '../../../components/magicui/blur-fade'
import type { ExtractedArticle } from '../../../types/article'
import { CARD } from '../constants/styles'

export const PreviewSection = ({ article, loading }: { article: ExtractedArticle | null; loading: boolean }) => {
  if (loading) return <section aria-label="Loading preview" className={`h-96 animate-pulse ${CARD}`} />
  if (!article) return null
  return (
    <BlurFade key={article.canonicalUrl}>
      <section className={`preview-content min-w-0 px-6 py-8 sm:px-12 sm:py-12 print:border-0 print:p-0 print:shadow-none ${CARD}`}>
        <ArticlePreview article={article} coverMetaStyle="full" coverPageMode="always" themeMode="color" />
      </section>
    </BlurFade>
  )
}
