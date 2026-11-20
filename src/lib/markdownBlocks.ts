// Turns the markdown X stores in an article's MARKDOWN blocks (and Jina's fallback text) into article blocks.
// Supports: # headings (levels past 3 become 3), - * + and 1. lists, - [ ] checklists (kept as "[ ] "/"[x] " text),
// > quotes, ```fenced code, ![images](url), | pipe | tables |, and inline `code`, **bold**, *italic*,
// ~~strike~~ and [links](https://...).
// Does not promise: nested lists (flattened), nested inline marks, _underscore_ italics, setext headings,
// horizontal rules, table column alignment, or HTML. Pipe rows that are not a valid table stay plain text.

import type { ArticleBlock, HeadingLevel, InlineMark, RichText, TableBlock } from '../types/article'
import { HEADING_LEVEL_ONE, HEADING_LEVEL_THREE, HEADING_LEVEL_TWO } from './article-parser/constants'
import { normalizeText, trimCode } from './article-parser/text'

// One token per match, checked in priority order: code spans first so their contents stay literal.
// Group names match mark types; only http(s) links become links.
const INLINE_TOKEN = /`(?<code>[^`]+)`|\[(?<link>[^\]]+)\]\((?<url>https?:\/\/[^)\s]+)\)|\*\*(?<bold>[^*]+)\*\*|~~(?<strikethrough>[^~]+)~~|\*(?<italic>[^*\s][^*]*)\*/g
const MARK_TYPES: readonly InlineMark['type'][] = ['code', 'link', 'bold', 'strikethrough', 'italic']

const markFor = (match: RegExpMatchArray, offset: number): { content: string; mark: InlineMark } | null => {
  const groups = match.groups ?? {}
  const type = MARK_TYPES.find((name) => groups[name] !== undefined)
  if (!type) return null
  const content = groups[type]
  const mark: InlineMark = { offset, length: content.length, type }
  return { content, mark: type === 'link' ? { ...mark, url: groups.url } : mark }
}

const parseInline = (raw: string): RichText => {
  const marks: InlineMark[] = []
  let text = ''
  let cursor = 0
  for (const match of raw.matchAll(INLINE_TOKEN)) {
    text += raw.slice(cursor, match.index)
    const token = markFor(match, text.length)
    text += token ? token.content : match[0]
    if (token) marks.push(token.mark)
    cursor = match.index + match[0].length
  }
  text += raw.slice(cursor)
  return marks.length > 0 ? { text, marks } : { text }
}

const DELIMITER_CELL = /^:?-+:?$/
const ESCAPED_PIPE = '\\|'
const PIPE_PLACEHOLDER = '\uE000'

const splitRow = (line: string): string[] | null => {
  const safe = line.trim().replaceAll(ESCAPED_PIPE, PIPE_PLACEHOLDER)
  if (!safe.includes('|')) return null
  return safe.replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.replaceAll(PIPE_PLACEHOLDER, '|').trim())
}

const isRow = (row: string[] | null): row is string[] => row !== null

const fitRow = (row: string[], columns: number): RichText[] => Array.from({ length: columns }, (_, index) => parseInline(row[index] ?? ''))

const parseMarkdownTable = (source: string): TableBlock | null => {
  const [headerLine = '', delimiterLine = '', ...bodyLines] = source.trim().split('\n')
  const header = splitRow(headerLine)
  const delimiter = splitRow(delimiterLine)
  if (!header || !delimiter || header.length !== delimiter.length || !delimiter.every((cell) => DELIMITER_CELL.test(cell))) return null
  const rows = bodyLines.filter((line) => line.trim()).map(splitRow)
  if (!rows.every(isRow)) return null
  return { type: 'table', header: fitRow(header, header.length), rows: rows.map((row) => fitRow(row, header.length)) }
}

const HEADING_LEVELS: readonly HeadingLevel[] = [HEADING_LEVEL_ONE, HEADING_LEVEL_TWO, HEADING_LEVEL_THREE]
const FENCE = /^```([A-Za-z0-9_+-]+)?\s*$/
const HEADING = /^(#{1,6})\s+(.+)$/
const LIST_ITEM = /^(?:[-*+]|(\d+)[.)])\s+(?:\[([ xX])\]\s+)?(.+)$/
const TABLE_ROW = /^\|.*\|$/
const IMAGE = /^!\[([^\]]*)\]\(([^)]+)\)$/
const QUOTE_PREFIX = /^>+/
const CHECKBOX = { checked: '[x] ', open: '[ ] ' }

interface ParseState {
  blocks: ArticleBlock[]
  code?: { language?: string; lines: string[] }
  list?: { ordered: boolean; items: RichText[] }
  paragraph: string[]
  table: string[]
}

const flushParagraph = (state: ParseState): void => {
  const text = normalizeText(state.paragraph.join(' '))
  if (text) state.blocks.push({ type: 'paragraph', ...parseInline(text) })
  state.paragraph = []
}

const flushList = (state: ParseState): void => {
  if (state.list) state.blocks.push({ type: 'list', ...state.list })
  state.list = undefined
}

// Rows that do not form a valid table stay readable as plain text.
const flushTable = (state: ParseState): void => {
  if (state.table.length === 0) return
  const source = state.table.join('\n')
  state.blocks.push(parseMarkdownTable(source) ?? { type: 'paragraph', text: source })
  state.table = []
}

const flushText = (state: ParseState): void => {
  flushParagraph(state)
  flushList(state)
  flushTable(state)
}

const pushBlock = (state: ParseState, block: ArticleBlock): true => {
  flushText(state)
  state.blocks.push(block)
  return true
}

const closeFence = (state: ParseState): void => {
  const code = trimCode(state.code?.lines.join('\n') ?? '')
  if (code) state.blocks.push({ type: 'code', code, language: state.code?.language })
  state.code = undefined
}

const handleFence = (state: ParseState, line: string): boolean => {
  const match = line.match(FENCE)
  if (!match) return false
  flushText(state)
  state.code = { language: match[1], lines: [] }
  return true
}

const handleTableRow = (state: ParseState, line: string): boolean => {
  if (!TABLE_ROW.test(line)) return false
  flushParagraph(state)
  flushList(state)
  state.table.push(line)
  return true
}

const handleImage = (state: ParseState, line: string): boolean => {
  const match = line.match(IMAGE)
  return match ? pushBlock(state, { type: 'media', mediaType: 'image', caption: match[1] ? normalizeText(match[1]) : undefined, url: match[2] }) : false
}

const handleHeading = (state: ParseState, line: string): boolean => {
  const match = line.match(HEADING)
  if (!match) return false
  const level = HEADING_LEVELS[Math.min(match[1].length, HEADING_LEVELS.length) - 1] ?? HEADING_LEVELS[HEADING_LEVELS.length - 1]
  return pushBlock(state, { type: 'heading', level, ...parseInline(normalizeText(match[2])) })
}

const checkboxPrefix = (mark: string | undefined): string => {
  if (mark === undefined) return ''
  return mark.trim() ? CHECKBOX.checked : CHECKBOX.open
}

const handleListItem = (state: ParseState, line: string): boolean => {
  const match = line.match(LIST_ITEM)
  if (!match) return false
  flushParagraph(state)
  flushTable(state)
  const ordered = match[1] !== undefined
  if (state.list?.ordered !== ordered) flushList(state)
  state.list ??= { ordered, items: [] }
  state.list.items.push(parseInline(checkboxPrefix(match[2]) + normalizeText(match[3])))
  return true
}

const handleQuote = (state: ParseState, line: string): boolean => {
  if (!QUOTE_PREFIX.test(line)) return false
  const text = normalizeText(line.replace(QUOTE_PREFIX, ''))
  return text ? pushBlock(state, { type: 'quote', ...parseInline(text) }) : true
}

const LINE_HANDLERS = [handleFence, handleTableRow, handleImage, handleHeading, handleListItem, handleQuote]

const processLine = (state: ParseState, rawLine: string): void => {
  const line = rawLine.trim()
  if (state.code) {
    if (FENCE.test(line)) closeFence(state)
    else state.code.lines.push(rawLine)
    return
  }
  if (!line) {
    flushText(state)
    return
  }
  if (LINE_HANDLERS.some((handle) => handle(state, line))) return
  flushList(state)
  flushTable(state)
  state.paragraph.push(line)
}

export const parseMarkdownBlocks = (markdown: string): ArticleBlock[] => {
  const state: ParseState = { blocks: [], paragraph: [], table: [] }
  markdown.replace(/\r\n/g, '\n').split('\n').forEach((line) => processLine(state, line))
  closeFence(state)
  flushText(state)
  return state.blocks
}
