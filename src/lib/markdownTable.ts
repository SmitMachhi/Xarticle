import type { ArticleBlock, InlineMark, TableBlock, TableCell } from '../types/article'

const DELIMITER_CELL = /^:?-+:?$/
const INLINE_TOKEN = /`([^`]+)`|\*\*([^*]+)\*\*/g
const ESCAPED_PIPE = '\\|'
const PIPE_PLACEHOLDER = '\uE000'

const splitRow = (line: string): string[] | null => {
  const safe = line.trim().replaceAll(ESCAPED_PIPE, PIPE_PLACEHOLDER)
  if (!safe.includes('|')) return null
  return safe.replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.replaceAll(PIPE_PLACEHOLDER, '|').trim())
}

const isRow = (row: string[] | null): row is string[] => row !== null

// Turns `code` and **bold** spans into marks so cells render like the rest of the article.
const toCell = (raw: string): TableCell => {
  const marks: InlineMark[] = []
  let text = ''
  let cursor = 0
  for (const match of raw.matchAll(INLINE_TOKEN)) {
    const content = match[1] ?? match[2]
    text += raw.slice(cursor, match.index)
    marks.push({ offset: text.length, length: content.length, type: match[1] === undefined ? 'bold' : 'code' })
    text += content
    cursor = match.index + match[0].length
  }
  text += raw.slice(cursor)
  return marks.length > 0 ? { text, marks } : { text }
}

const fitRow = (row: string[], columns: number): TableCell[] => Array.from({ length: columns }, (_, index) => toCell(row[index] ?? ''))

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
