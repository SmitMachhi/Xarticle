import type { ArticleBlock, TableBlock, TableCell } from '../../types/article'
import { parseInline } from './inline'

const DELIMITER_CELL = /^:?-+:?$/
const ESCAPED_PIPE = '\\|'
const PIPE_PLACEHOLDER = ''

const splitRow = (line: string): string[] | null => {
  const safe = line.trim().replaceAll(ESCAPED_PIPE, PIPE_PLACEHOLDER)
  if (!safe.includes('|')) return null
  return safe.replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.replaceAll(PIPE_PLACEHOLDER, '|').trim())
}

const isRow = (row: string[] | null): row is string[] => row !== null

const fitRow = (row: string[], columns: number): TableCell[] => Array.from({ length: columns }, (_, index) => parseInline(row[index] ?? ''))

export const parseMarkdownTable = (source: string): TableBlock | null => {
  const [headerLine = '', delimiterLine = '', ...bodyLines] = source.trim().split('\n')
  const header = splitRow(headerLine)
  const delimiter = splitRow(delimiterLine)
  if (!header || !delimiter || header.length !== delimiter.length || !delimiter.every((cell) => DELIMITER_CELL.test(cell))) return null
  const rows = bodyLines.filter((line) => line.trim()).map(splitRow)
  if (!rows.every(isRow)) return null
  return { type: 'table', header: fitRow(header, header.length), rows: rows.map((row) => fitRow(row, header.length)) }
}

export const codeOrTableBlock = (code: string, language?: string): ArticleBlock => parseMarkdownTable(code) ?? { type: 'code', code, language }
