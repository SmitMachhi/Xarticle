import type { Content, CustomTableLayout } from 'pdfmake/interfaces'

import type { RichText, TableBlock } from '../../types/article'
import { MARGIN_INLINE_NONE, MARGIN_LARGE, MARGIN_SMALL, TABLE_COLUMN_CHARS, TABLE_PADDING, TABLE_RULE_WIDTH } from './constants'
import { inlineText } from './inline'
import type { PdfPalette } from './styles'

const PERCENT = 100
const PERCENT_DECIMALS = 2

const columnWeight = (cells: RichText[]): number => {
  const longest = Math.max(...cells.map((cell) => cell.text.length))
  return Math.min(Math.max(longest, TABLE_COLUMN_CHARS.min), TABLE_COLUMN_CHARS.max)
}

const tableColumnWidths = (block: TableBlock): string[] => {
  const weights = block.header.map((_, column) => columnWeight([block.header[column], ...block.rows.map((row) => row[column])]))
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  return weights.map((weight) => `${((weight / total) * PERCENT).toFixed(PERCENT_DECIMALS)}%`)
}

const tableLayout = (palette: PdfPalette): CustomTableLayout => ({
  hLineWidth: () => TABLE_RULE_WIDTH,
  vLineWidth: () => MARGIN_INLINE_NONE,
  hLineColor: () => palette.rule,
  fillColor: (rowIndex) => (rowIndex === 0 ? palette.code : null),
  paddingLeft: () => TABLE_PADDING.x,
  paddingRight: () => TABLE_PADDING.x,
  paddingTop: () => TABLE_PADDING.y,
  paddingBottom: () => TABLE_PADDING.y,
})

const toRow = (cells: RichText[], style: string): Content[] => cells.map((cell) => ({ text: inlineText(cell.text, cell.marks), style }))

export const tableContent = (block: TableBlock, palette: PdfPalette): Content => ({
  table: {
    headerRows: 1,
    dontBreakRows: true,
    widths: tableColumnWidths(block),
    body: [toRow(block.header, 'tableHeader'), ...block.rows.map((row) => toRow(row, 'tableCell'))],
  },
  layout: tableLayout(palette),
  margin: [MARGIN_INLINE_NONE, MARGIN_SMALL, MARGIN_INLINE_NONE, MARGIN_LARGE],
})
