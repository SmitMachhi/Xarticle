import type { Content, Node, NodeQueries, TDocumentDefinitions } from 'pdfmake/interfaces'

import type { ArticleBlock, ExtractedArticle } from '../../types/article'
import { blocksToContent } from './blocks'
import {
  COVER_IMAGE_CAPTION,
  COVER_IMAGE_FIT_HEIGHT,
  DATE_FORMAT,
  DATE_LOCALE,
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
import { pdfSafeText } from './glyphs'
import type { PdfExportOptions } from './options'
import { paletteForTheme, stylesForTheme } from './styles'

type ImageResolver = (url: string) => Promise<string | null>

const metricRows = [
  { key: 'likes', label: 'Likes' },
  { key: 'replies', label: 'Replies' },
  { key: 'reposts', label: 'Reposts' },
  { key: 'views', label: 'Views' },
  { key: 'bookmarks', label: 'Bookmarks' },
] as const

const formatDate = (value: string | Date): string => new Date(value).toLocaleDateString(DATE_LOCALE, DATE_FORMAT)

// Footer nodes are reported with their own (smaller) top, so only nodes below the heading count as body content.
const keepHeadingWithNext = (node: Node, queries: NodeQueries): boolean => {
  if (!node.headlineLevel) return false
  return !queries.getFollowingNodesOnPage().some((next) => next.startPosition.top > node.startPosition.top)
}

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
  if (article.publishedAt) metadata.push(formatDate(article.publishedAt))
  return [{ text: pdfSafeText(article.title), style: 'h1', margin: [MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_MEDIUM] }, { text: `${pdfSafeText(article.authorName)} • ${metadata.join(' • ')}`, style: 'meta', margin: [MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_LARGE] }]
}

const coverPage = (article: ExtractedArticle, coverImageUrl: string | null, coverMetaStyle: PdfExportOptions['coverMetaStyle']): Content => {
  const metadata = coverMetaStyle === 'minimal' ? `@${article.authorHandle}` : `@${article.authorHandle}${article.publishedAt ? ` • ${formatDate(article.publishedAt)}` : ''}`
  const media: Content[] = coverImageUrl ? [{ image: coverImageUrl, fit: [IMAGE_FIT_WIDTH, COVER_IMAGE_FIT_HEIGHT], margin: [MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_XLARGE] }] : []
  return {
    pageBreak: 'after',
    stack: [
      ...media,
      { text: 'Xarticle.co', style: 'coverBadge', margin: [MARGIN_INLINE_NONE, MARGIN_SMALL, MARGIN_INLINE_NONE, MARGIN_XXLARGE] },
      { text: pdfSafeText(article.title), style: 'coverTitle', margin: [MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_LARGE] },
      { text: pdfSafeText(article.authorName), style: 'title', margin: [MARGIN_INLINE_NONE, MARGIN_SMALL, MARGIN_INLINE_NONE, 2] },
      { text: metadata, style: 'coverMeta', margin: [MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_XLARGE] },
      { text: article.canonicalUrl, style: 'embed', link: article.canonicalUrl, margin: [MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_LARGE] },
      { columns: coverMetricColumns(article), columnGap: MARGIN_LARGE },
      { text: `generated ${formatDate(new Date())}`, style: 'meta', margin: [MARGIN_INLINE_NONE, MARGIN_LARGE, MARGIN_INLINE_NONE, MARGIN_INLINE_NONE] },
    ],
  }
}

export const buildPdfDefinition = async (
  article: ExtractedArticle,
  opts: PdfExportOptions,
  imageResolver: ImageResolver,
): Promise<TDocumentDefinitions> => {
  const { bodyBlocks, coverMediaUrl } = splitCoverMedia(article.blocks, opts.coverPageMode === 'always')
  const bodyContent = await blocksToContent(bodyBlocks, imageResolver, paletteForTheme(opts.themeMode))
  const coverMedia = coverMediaUrl ? await imageResolver(coverMediaUrl) : null
  const content: Content[] = []
  if (opts.coverPageMode === 'always') content.push(coverPage(article, coverMedia, opts.coverMetaStyle))
  if (opts.coverPageMode !== 'always') content.push(...bodyHeader(article))
  content.push(...bodyContent)

  return {
    pageSize: opts.paperSize,
    pageMargins: marginMap[opts.marginPreset],
    content,
    pageBreakBefore: keepHeadingWithNext,
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
