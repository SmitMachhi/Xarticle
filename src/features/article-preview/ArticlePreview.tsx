import { useMemo } from 'react'

import type { CoverMetaStyle, CoverPageMode, ExtractedArticle, ThemeMode } from '../../types/article'
import { ArticleBlocks } from './components/ArticleBlocks'
import { ArticleCopyButton } from './components/ArticleCopyButton'
import { ArticleHeader } from './components/ArticleHeader'
import { ArticlePrintButton } from './components/ArticlePrintButton'
import { MetricGrid } from './components/MetricGrid'
import { toPlainTextPayload } from './utils/text'

interface ArticlePreviewProps {
  article: ExtractedArticle
  coverMetaStyle: CoverMetaStyle
  coverPageMode: CoverPageMode
  themeMode: ThemeMode
}

export const ArticlePreview = ({ article }: ArticlePreviewProps) => {
  const payload = useMemo(() => toPlainTextPayload(article.blocks), [article.blocks])
  return (
    <div className="preview-stack preview-color">
      <article className="preview-card" id="preview-section-article">
        <ArticleHeader article={article} />
        <MetricGrid article={article} id="preview-section-stats" label="article metrics" />
        <div className="article-tools"><ArticlePrintButton /><ArticleCopyButton payload={payload} /></div>
        <ArticleBlocks blocks={article.blocks} />
      </article>
    </div>
  )
}
