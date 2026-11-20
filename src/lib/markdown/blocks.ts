import type { ArticleBlock, HeadingLevel, ListItem } from '../../types/article'
import { HEADING_LEVEL_ONE, HEADING_LEVEL_THREE, HEADING_LEVEL_TWO } from '../article-parser/constants'
import { normalizeText } from '../article-parser/text'
import { parseInline } from './inline'
import { codeOrTableBlock, parseMarkdownTable } from './table'

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
  list?: { ordered: boolean; items: ListItem[] }
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
  const code = state.code?.lines.join('\n').trim()
  if (code) state.blocks.push(codeOrTableBlock(code, state.code?.language))
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
