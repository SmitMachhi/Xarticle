import type { Column, Content, Node, NodeQueries, TDocumentDefinitions } from 'pdfmake/interfaces'

import type { ArticleBlock, ExtractedArticle } from '../../types/article'
import { blocksToContent, dividerContent } from './blocks'
import {
  COVER_IMAGE_CAPTION,
  DATE_FORMAT,
  DATE_LOCALE,
  FOOTER_FONT_SIZE,
  HEADER_COLUMN_GAP,
  HEADER_THUMB,
  MARGIN_INLINE_NONE,
  MARGIN_SMALL,
  marginMap,
  PAGE_MARGIN_BOTTOM,
  PAGE_MARGIN_LEFT,
  URL_PROTOCOL_PATTERN,
} from './constants'
import { pdfSafeText } from './glyphs'
import type { PdfExportOptions } from './options'
import { paletteForTheme, stylesForTheme } from './styles'

type ImageResolver = (url: string) => Promise<string | null>

// Only the three stats readers care about, to keep the header to one short line.
const metricRows = [
  { key: 'likes', label: 'likes' },
  { key: 'views', label: 'views' },
  { key: 'bookmarks', label: 'bookmarks' },
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

const statsLine = (article: ExtractedArticle): string => metricRows.flatMap(({ key, label }) => {
  const value = article.metrics[key]
  return value === null ? [] : [`${value.toLocaleString(DATE_LOCALE)} ${label}`]
}).join(' · ')

const headerText = (article: ExtractedArticle, metaStyle: PdfExportOptions['coverMetaStyle']): Column => {
  const byline = [`${pdfSafeText(article.authorName)} @${article.authorHandle}`]
  if (metaStyle === 'full' && article.publishedAt) byline.push(formatDate(article.publishedAt))
  const stats = statsLine(article)
  return {
    width: '*',
    stack: [
      { text: pdfSafeText(article.title), style: 'headerTitle', margin: [MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_SMALL] },
      { text: byline.join(' · '), style: 'headerMeta' },
      ...(stats ? [{ text: stats, style: 'headerMeta' }] : []),
      { text: article.canonicalUrl.replace(URL_PROTOCOL_PATTERN, ''), link: article.canonicalUrl, decoration: 'underline', style: 'headerMeta' },
    ],
  }
}

// Cover thumbnail beside the title keeps the whole header under ~90pt, so page 1 is mostly article.
const articleHeader = (article: ExtractedArticle, coverUrl: string | null, metaStyle: PdfExportOptions['coverMetaStyle']): Content => {
  const thumbnail: Column[] = coverUrl ? [{ image: coverUrl, fit: [HEADER_THUMB.width, HEADER_THUMB.height], width: HEADER_THUMB.width }] : []
  return { columns: [...thumbnail, headerText(article, metaStyle)], columnGap: HEADER_COLUMN_GAP }
}

export const buildPdfDefinition = async (
  article: ExtractedArticle,
  opts: PdfExportOptions,
  imageResolver: ImageResolver,
): Promise<TDocumentDefinitions> => {
  const { bodyBlocks, coverMediaUrl } = splitCoverMedia(article.blocks, opts.coverPageMode === 'always')
  const palette = paletteForTheme(opts.themeMode)
  const bodyContent = await blocksToContent(bodyBlocks, imageResolver, palette)
  const coverMedia = coverMediaUrl ? await imageResolver(coverMediaUrl) : null
  // The header shares page 1 with the article to save paper; a rule separates the two.
  const content: Content[] = [articleHeader(article, coverMedia, opts.coverMetaStyle), dividerContent(palette), ...bodyContent]

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
