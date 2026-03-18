import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces'

import type { ArticleBlock, ExtractedArticle } from '../../types/article'
import { blocksToContent } from './blocks'
import {
  COVER_IMAGE_CAPTION,
  COVER_IMAGE_FIT_HEIGHT,
  FOOTER_FONT_SIZE,
  IMAGE_FIT_WIDTH,
  MARGIN_INLINE_NONE,
  MARGIN_LARGE,
  MARGIN_MEDIUM,
  MARGIN_SMALL,
  MARGIN_XLARGE,
  MARGIN_XXLARGE,
  marginMap,
  PAGE_MARGIN_BOTTOM,
  PAGE_MARGIN_LEFT,
} from './constants'
import type { PdfExportOptions } from './options'
import { stylesForTheme } from './styles'

type ImageResolver = (url: string) => Promise<string | null>

const metricRows = [
  { key: 'likes', label: 'Likes' },
  { key: 'replies', label: 'Replies' },
  { key: 'reposts', label: 'Reposts' },
  { key: 'views', label: 'Views' },
  { key: 'bookmarks', label: 'Bookmarks' },
] as const

const splitCoverMedia = (blocks: ArticleBlock[], coverEnabled: boolean): { bodyBlocks: ArticleBlock[]; coverMediaUrl: string | null } => {
  if (!coverEnabled) return { bodyBlocks: blocks, coverMediaUrl: null }
  const index = blocks.findIndex((block) => block.type === 'media' && block.caption?.toLowerCase() === COVER_IMAGE_CAPTION)
  if (index < 0) return { bodyBlocks: blocks, coverMediaUrl: null }
  const cover = blocks[index]
  if (cover.type !== 'media') return { bodyBlocks: blocks, coverMediaUrl: null }
  return { bodyBlocks: blocks.filter((_, itemIndex) => itemIndex !== index), coverMediaUrl: cover.url }
}

const coverMetricColumns = (article: ExtractedArticle): Content[] => {
  return metricRows.map((item) => {
    const metricValue = article.metrics[item.key]
    const text = metricValue === null ? 'N/A' : metricValue.toLocaleString()
    return {
      stack: [
        { text: item.label, style: 'coverMetricLabel' },
        { text, style: 'coverMetricValue' },
      ],
    }
  })
}

const bodyHeader = (article: ExtractedArticle): Content[] => {
  const metadata = [`@${article.authorHandle}`]
  if (article.publishedAt) metadata.push(new Date(article.publishedAt).toLocaleString())
  return [{ text: article.title, style: 'h1', margin: [MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_MEDIUM] }, { text: `${article.authorName} • ${metadata.join(' • ')}`, style: 'meta', margin: [MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_LARGE] }]
}

const coverPage = (article: ExtractedArticle, coverImageUrl: string | null, coverMetaStyle: PdfExportOptions['coverMetaStyle']): Content => {
  const metadata = coverMetaStyle === 'minimal' ? `@${article.authorHandle}` : `@${article.authorHandle}${article.publishedAt ? ` • ${new Date(article.publishedAt).toLocaleString()}` : ''}`
  const media: Content[] = coverImageUrl ? [{ image: coverImageUrl, fit: [IMAGE_FIT_WIDTH, COVER_IMAGE_FIT_HEIGHT], margin: [MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_XLARGE] }] : []
  return {
    stack: [
      ...media,
      { text: 'Xarticle.co', style: 'coverBadge', margin: [MARGIN_INLINE_NONE, MARGIN_SMALL, MARGIN_INLINE_NONE, MARGIN_XXLARGE] },
      { text: article.title, style: 'coverTitle', margin: [MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_LARGE] },
      { text: article.authorName, style: 'title', margin: [MARGIN_INLINE_NONE, MARGIN_SMALL, MARGIN_INLINE_NONE, 2] },
      { text: metadata, style: 'coverMeta', margin: [MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_XLARGE] },
      { text: article.canonicalUrl, style: 'embed', link: article.canonicalUrl, margin: [MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_LARGE] },
      { columns: coverMetricColumns(article), columnGap: MARGIN_LARGE },
      { text: `generated ${new Date().toLocaleString()}`, style: 'meta', margin: [MARGIN_INLINE_NONE, MARGIN_LARGE, MARGIN_INLINE_NONE, MARGIN_INLINE_NONE] },
    ],
  }
}

export const buildPdfDefinition = async (
  article: ExtractedArticle,
  opts: PdfExportOptions,
  imageResolver: ImageResolver,
): Promise<TDocumentDefinitions> => {
  const { bodyBlocks, coverMediaUrl } = splitCoverMedia(article.blocks, opts.coverPageMode === 'always')
  const bodyContent = await blocksToContent(bodyBlocks, imageResolver)
  const coverMedia = coverMediaUrl ? await imageResolver(coverMediaUrl) : null
  const content: Content[] = []
  if (opts.coverPageMode === 'always') content.push(coverPage(article, coverMedia, opts.coverMetaStyle))
  if (opts.coverPageMode !== 'always') content.push(...bodyHeader(article))
  content.push(...bodyContent)

  return {
    pageSize: opts.paperSize,
    pageMargins: marginMap[opts.marginPreset],
    content,
    footer: (currentPage, pageCount) => ({
      columns: [
        { text: 'Xarticle.co', alignment: 'left' },
        { text: `${currentPage} / ${pageCount}`, alignment: 'right' },
      ],
      margin: [PAGE_MARGIN_LEFT, MARGIN_INLINE_NONE, PAGE_MARGIN_LEFT, PAGE_MARGIN_BOTTOM],
      fontSize: FOOTER_FONT_SIZE,
    }),
    styles: stylesForTheme(opts.themeMode),
    defaultStyle: { font: 'Roboto' },
    info: {
      title: article.title,
      author: article.authorName,
      subject: 'X Long-form Article Export',
      creator: 'Xarticle.co',
      producer: 'Xarticle.co',
    },
  }
}
