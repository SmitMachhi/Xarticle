import type { Column, Content, ContentStack, StyleDictionary, TDocumentDefinitions } from 'pdfmake/interfaces'
import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import { recordPlannedDownload } from './downloadTelemetry'
import type {
  ArticleBlock,
  CoverMetaStyle,
  CoverPageMode,
  ExtractedArticle,
  MarginPreset,
  PaperSize,
  ThemeMode,
} from '../types/article'

pdfMake.addVirtualFileSystem(pdfFonts)

const marginMap: Record<MarginPreset, [number, number, number, number]> = {
  default: [42, 44, 42, 44],
  minimum: [24, 24, 24, 24],
}

const metricLabelMap = {
  likes: 'Likes',
  replies: 'Replies',
  reposts: 'Reposts',
  views: 'Views',
  bookmarks: 'Bookmarks',
} as const

const toFilenameSafe = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 42)
}

const getStatusId = (url: string): string | null => {
  try {
    const match = new URL(url).pathname.match(/\/status\/(\d+)/)
    return match?.[1] ?? null
  } catch {
    return null
  }
}

const compactStamp = (): string =>
  new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\..*$/, '')
    .replace('T', '-')

const fileNameFor = (article: ExtractedArticle, themeMode: ThemeMode): string => {
  const titleSlug = toFilenameSafe(article.title || 'article')
  const handleSlug = toFilenameSafe(article.authorHandle || 'unknown')
  const statusId = getStatusId(article.canonicalUrl)
  const stamp = compactStamp()
  const mode = themeMode === 'bw' ? 'bw' : 'color'
  const core = statusId ? `${handleSlug}-${statusId}` : `${titleSlug}-${handleSlug}`
  return `xarticle-${core}-${mode}-${stamp}.pdf`
}

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Failed to read image data.'))
    reader.readAsDataURL(blob)
  })

const loadImageDataUrl = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      return null
    }
    const blob = await response.blob()
    return blobToDataUrl(blob)
  } catch {
    return null
  }
}

export interface PdfExportOptions {
  paperSize: PaperSize
  marginPreset: MarginPreset
  themeMode: ThemeMode
  coverPageMode: CoverPageMode
  coverMetaStyle: CoverMetaStyle
}

const asMetricCell = (label: string, value: number | null, note?: string): ContentStack => {
  const stack: Content[] = [
    { text: label, style: 'metricLabel' },
    { text: value === null ? 'N/A' : value.toLocaleString(), style: 'metricValue' },
  ]
  if (note) {
    stack.push({ text: note, style: 'metricNote' })
  }

  return {
    stack,
    margin: [0, 0, 0, 0],
  }
}

const stylesFor = (themeMode: ThemeMode): StyleDictionary => {
  const textColor = themeMode === 'bw' ? '#111111' : '#171717'
  const metaColor = themeMode === 'bw' ? '#333333' : '#525252'
  const quoteColor = themeMode === 'bw' ? '#1f2937' : '#0f172a'
  const codeBackground = themeMode === 'bw' ? '#ffffff' : '#f5f7fb'
  const codeBorder = themeMode === 'bw' ? '#777777' : '#d8dfeb'
  return {
    title: { fontSize: 22, bold: true, color: textColor },
    coverTitle: { fontSize: 28, bold: true, color: textColor },
    meta: { fontSize: 10, color: metaColor },
    coverMeta: { fontSize: 12, color: metaColor },
    coverBadge: { fontSize: 11, color: textColor, bold: true },
    sourceBadge: { fontSize: 8.5, color: themeMode === 'bw' ? '#111111' : '#0d6e35', bold: true },
    paragraph: { fontSize: 11, lineHeight: 1.4, color: textColor },
    h1: { fontSize: 18, bold: true, color: textColor },
    h2: { fontSize: 16, bold: true, color: textColor },
    h3: { fontSize: 14, bold: true, color: textColor },
    quote: {
      fontSize: 11,
      italics: true,
      color: quoteColor,
      margin: [14, 4, 0, 10],
    },
    codeLanguage: { fontSize: 8, color: metaColor, bold: true },
    codeBlock: {
      fontSize: 9.5,
      color: textColor,
      margin: [0, 0, 0, 8],
      fillColor: codeBackground,
      decorationColor: codeBorder,
      font: 'Courier',
    },
    metricLabel: { fontSize: 8, color: metaColor, bold: true },
    metricValue: { fontSize: 11, color: textColor },
    metricNote: { fontSize: 7.4, color: metaColor },
    coverMetricLabel: { fontSize: 9, color: metaColor, bold: true },
    coverMetricValue: { fontSize: 13, color: textColor, bold: true },
    mediaCaption: { fontSize: 9, color: metaColor, italics: true },
    embed: { fontSize: 10, color: textColor, decoration: 'underline' },
    avatarFallback: {
      fontSize: 12,
      bold: true,
      color: textColor,
      alignment: 'center',
      margin: [0, 12, 0, 0],
    },
  }
}

const asCoverMetricCell = (label: string, value: number | null): Content => {
  return {
    stack: [
      { text: label, style: 'coverMetricLabel' },
      { text: value === null ? 'N/A' : value.toLocaleString(), style: 'coverMetricValue' },
    ],
  }
}

const metricCardLayout = (themeMode: ThemeMode) => ({
  hLineColor: () => (themeMode === 'bw' ? '#777777' : '#dce1dc'),
  vLineColor: () => (themeMode === 'bw' ? '#777777' : '#dce1dc'),
  hLineWidth: () => 1,
  vLineWidth: () => 1,
  paddingLeft: () => 8,
  paddingRight: () => 8,
  paddingTop: () => 6,
  paddingBottom: () => 6,
})

const splitCoverMediaBlock = (
  blocks: ArticleBlock[],
  coverEnabled: boolean,
): { coverMediaBlock: Extract<ArticleBlock, { type: 'media' }> | null; bodyBlocks: ArticleBlock[] } => {
  if (!coverEnabled) {
    return { coverMediaBlock: null, bodyBlocks: blocks }
  }

  const index = blocks.findIndex((block) => block.type === 'media' && block.caption?.toLowerCase() === 'cover image')
  if (index === -1) {
    return { coverMediaBlock: null, bodyBlocks: blocks }
  }

  const maybeCover = blocks[index]
  if (maybeCover.type !== 'media') {
    return { coverMediaBlock: null, bodyBlocks: blocks }
  }

  return {
    coverMediaBlock: maybeCover,
    bodyBlocks: blocks.filter((_, blockIndex) => blockIndex !== index),
  }
}

const blockToContent = async (block: ArticleBlock, imageResolver: (url: string) => Promise<string | null>): Promise<Content[]> => {
  if (block.type === 'heading') {
    const style = block.level === 1 ? 'h1' : block.level === 2 ? 'h2' : 'h3'
    return [{ text: block.text, style, margin: [0, 8, 0, 8] }]
  }

  if (block.type === 'paragraph') {
    return [{ text: block.text, style: 'paragraph', margin: [0, 0, 0, 8] }]
  }

  if (block.type === 'quote') {
    return [
      {
        columns: [
          {
            width: 4,
            canvas: [{ type: 'rect', x: 0, y: 0, w: 2, h: 44, color: '#64748b' }],
            margin: [0, 0, 8, 0],
          },
          {
            width: '*',
            text: block.text,
            style: 'quote',
          },
        ],
        margin: [0, 0, 0, 8],
      },
    ]
  }

  if (block.type === 'code') {
    const codeContent: Content[] = []
    if (block.language) {
      codeContent.push({
        text: block.language,
        style: 'codeLanguage',
        margin: [0, 2, 0, 4],
      })
    }

    codeContent.push({
      table: {
        widths: ['*'],
        body: [[{ text: block.code, style: 'codeBlock' }]],
      },
      layout: {
        hLineColor: () => '#d8dfeb',
        vLineColor: () => '#d8dfeb',
        hLineWidth: () => 1,
        vLineWidth: () => 1,
        paddingLeft: () => 8,
        paddingRight: () => 8,
        paddingTop: () => 6,
        paddingBottom: () => 6,
      },
      margin: [0, 0, 0, 10],
    })

    return codeContent
  }

  if (block.type === 'list') {
    return [{ ul: [...block.items], style: 'paragraph', margin: [0, 0, 0, 8] }]
  }

  if (block.type === 'media') {
    const imageDataUrl = await imageResolver(block.url)
    if (!imageDataUrl) {
      return [
        { text: `Media: ${block.url}`, style: 'embed', link: block.url, margin: [0, 0, 0, 4] },
        block.caption ? { text: block.caption, style: 'mediaCaption', margin: [0, 0, 0, 8] } : { text: '', margin: [0, 0, 0, 0] },
      ]
    }

    const imageBlock: Content[] = [
      {
        image: imageDataUrl,
        fit: [500, 260],
        margin: [0, 8, 0, 4],
      },
    ]

    if (block.caption) {
      imageBlock.push({ text: block.caption, style: 'mediaCaption', margin: [0, 0, 0, 8] })
    }

    return imageBlock
  }

  if (block.type === 'embed') {
    if (block.url) {
      return [{ text: block.text, link: block.url, style: 'embed', margin: [0, 2, 0, 8] }]
    }

    return [{ text: block.text, style: 'embed', margin: [0, 2, 0, 8] }]
  }

  return []
}

export const buildArticlePdfDefinition = async (
  article: ExtractedArticle,
  opts: PdfExportOptions,
  imageResolver: (url: string) => Promise<string | null> = loadImageDataUrl,
): Promise<TDocumentDefinitions> => {
  const avatarDataUrl = article.authorAvatarUrl ? await imageResolver(article.authorAvatarUrl) : null
  const { coverMediaBlock, bodyBlocks } = splitCoverMediaBlock(article.blocks, opts.coverPageMode === 'always')
  const coverMediaDataUrl = coverMediaBlock ? await imageResolver(coverMediaBlock.url) : null
  const bodyContent: Content[] = []

  for (const block of bodyBlocks) {
    const contentItems = await blockToContent(block, imageResolver)
    bodyContent.push(...contentItems)
  }

  const metricColumns: ContentStack[] = [
    asMetricCell(metricLabelMap.likes, article.metrics.likes, article.metricNotes?.likes),
    asMetricCell(metricLabelMap.replies, article.metrics.replies, article.metricNotes?.replies),
    asMetricCell(metricLabelMap.reposts, article.metrics.reposts, article.metricNotes?.reposts),
    asMetricCell(metricLabelMap.views, article.metrics.views, article.metricNotes?.views),
    asMetricCell(metricLabelMap.bookmarks, article.metrics.bookmarks, article.metricNotes?.bookmarks),
  ]

  const metadataParts = [`@${article.authorHandle}`]
  if (article.publishedAt) {
    metadataParts.push(new Date(article.publishedAt).toLocaleString())
  }
  const coverMetadataParts = opts.coverMetaStyle === 'minimal' ? [`@${article.authorHandle}`] : metadataParts

  const coverMetrics: Content[] = [
    asCoverMetricCell(metricLabelMap.likes, article.metrics.likes),
    asCoverMetricCell(metricLabelMap.replies, article.metrics.replies),
    asCoverMetricCell(metricLabelMap.reposts, article.metrics.reposts),
    asCoverMetricCell(metricLabelMap.views, article.metrics.views),
    asCoverMetricCell(metricLabelMap.bookmarks, article.metrics.bookmarks),
  ]

  const coverAuthorVisual: Column = avatarDataUrl
    ? {
        width: 62,
        image: avatarDataUrl,
        fit: [56, 56],
      }
    : {
        width: 62,
        text: '@',
        style: 'avatarFallback',
      }

  const coverMediaContent: Content[] = coverMediaDataUrl
    ? [
        {
          image: coverMediaDataUrl,
          fit: [500, 250],
          margin: [0, 0, 0, 14],
        },
      ]
    : []

  const coverPage: Content = {
    stack: [
      ...coverMediaContent,
      { text: 'Xarticle.app', style: 'coverBadge', margin: [0, 4, 0, 16] },
      { text: article.title, style: 'coverTitle', margin: [0, 0, 0, 12] },
      {
        columns: [
          coverAuthorVisual,
          {
            width: '*',
            stack: [
              { text: article.authorName, style: 'title', margin: [0, 4, 0, 2] },
              { text: coverMetadataParts.join(' • '), style: 'coverMeta' },
            ],
          },
        ],
        margin: [0, 0, 0, 14],
      },
      {
        text: article.canonicalUrl,
        style: 'embed',
        link: article.canonicalUrl,
        margin: [0, 0, 0, 12],
      },
      { columns: coverMetrics, columnGap: 12, margin: [0, 0, 0, 12] },
      {
        text: `generated ${new Date().toLocaleString()}`,
        style: 'meta',
        margin: [0, 0, 0, 0],
      },
    ],
  }

  const content: Content[] = []
  const showBodyHeader = opts.coverPageMode !== 'always'
  const bodyHeaderContent: Content[] = showBodyHeader
    ? [
        { text: article.title, style: 'h1', margin: [0, 0, 0, 8] },
        { text: `${article.authorName} • ${metadataParts.join(' • ')}`, style: 'meta', margin: [0, 0, 0, 6] },
        {
          columns: metricColumns.map((metricCell) => ({
            table: {
              widths: ['*'],
              body: [[{ ...metricCell, fillColor: opts.themeMode === 'bw' ? '#ffffff' : '#f8faf8' }]],
            },
            layout: metricCardLayout(opts.themeMode),
          })),
          columnGap: 8,
          margin: [0, 0, 0, 12],
        },
      ]
    : []

  if (opts.coverPageMode === 'always') {
    content.push(coverPage)
  }

  content.push(
    ...bodyHeaderContent,
    ...bodyContent,
  )

  return {
    pageSize: opts.paperSize,
    pageMargins: marginMap[opts.marginPreset],
    content,
    footer: () => ({
      text: 'Xarticle.app',
      alignment: 'left',
      margin: [24, 0, 0, 12],
      fontSize: 8,
      color: opts.themeMode === 'bw' ? '#444444' : '#3d8f62',
    }),
    styles: stylesFor(opts.themeMode),
    defaultStyle: {
      font: 'Roboto',
    },
    info: {
      title: article.title,
      author: article.authorName,
      subject: 'X Long-form Article Export',
      creator: 'Xarticle.app',
      producer: 'Xarticle.app',
    },
  }
}

export const downloadArticlePdf = async (article: ExtractedArticle, opts: PdfExportOptions): Promise<void> => {
  const docDefinition = await buildArticlePdfDefinition(article, opts)
  const filename = fileNameFor(article, opts.themeMode)
  recordPlannedDownload(filename)
  pdfMake.createPdf(docDefinition).download(filename)
}
