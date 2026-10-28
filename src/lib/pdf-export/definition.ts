import type { Content, Node, NodeQueries, TDocumentDefinitions } from 'pdfmake/interfaces'

import type { ArticleBlock, ExtractedArticle } from '../../types/article'
import { blocksToContent, dividerContent } from './blocks'
import {
  COVER_IMAGE_CAPTION,
  DATE_FORMAT,
  DATE_LOCALE,
  FOOTER_FONT_SIZE,
  IMAGE_LIMITS,
  MARGIN_INLINE_NONE,
  MARGIN_MEDIUM,
  MARGIN_SMALL,
  marginMap,
  PAGE_MARGIN_BOTTOM,
  PAGE_MARGIN_LEFT,
  URL_PROTOCOL_PATTERN,
} from './constants'
import { pdfSafeText } from './glyphs'
import { fitImage } from './image/sizing'
import type { PdfExportOptions } from './options'
import { paletteForTheme, stylesForTheme } from './styles'

type ImageResolver = (url: string) => Promise<string | null>

const metricRows = [
  { key: 'likes', label: 'likes' },
  { key: 'replies', label: 'replies' },
  { key: 'reposts', label: 'reposts' },
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

// Title, byline and stats in three tight lines: print readers get the source without a full-page cover.
const articleHeader = (article: ExtractedArticle, metaStyle: PdfExportOptions['coverMetaStyle']): Content[] => {
  const byline = [`${pdfSafeText(article.authorName)} @${article.authorHandle}`]
  if (metaStyle === 'full' && article.publishedAt) byline.push(formatDate(article.publishedAt))
  const stats = statsLine(article)
  return [
    { text: pdfSafeText(article.title), style: 'h1', margin: [MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_SMALL] },
    { text: [`${byline.join(' · ')} · `, { text: article.canonicalUrl.replace(URL_PROTOCOL_PATTERN, ''), link: article.canonicalUrl, decoration: 'underline' }], style: 'meta' },
    ...(stats ? [{ text: stats, style: 'meta' }] : []),
  ]
}

const coverImage = (url: string | null): Content[] => url ? [{ image: url, fit: fitImage(url, IMAGE_LIMITS), alignment: 'center', margin: [MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_INLINE_NONE, MARGIN_MEDIUM] }] : []

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
  const content: Content[] = [...coverImage(coverMedia), ...articleHeader(article, opts.coverMetaStyle), dividerContent(palette), ...bodyContent]

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
