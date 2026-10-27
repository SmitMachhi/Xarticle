import type { CoverMetaStyle, CoverPageMode, ExtractedArticle, ThemeMode } from '../../types/article'
import { ArticleBlocks } from './components/ArticleBlocks'
import { ArticleHeader } from './components/ArticleHeader'

interface ArticlePreviewProps {
  article: ExtractedArticle
  coverMetaStyle: CoverMetaStyle
  coverPageMode: CoverPageMode
  themeMode: ThemeMode
}

export const ArticlePreview = ({ article }: ArticlePreviewProps) => {
  return (
    <article className="preview-card" id="preview-section-article">
      <ArticleHeader article={article} />
      <ArticleBlocks blocks={article.blocks} />
    </article>
  )
}
