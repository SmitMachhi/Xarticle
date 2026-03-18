import type { ArticleBlock, ExtractedArticle } from '../../types/article'
import { getHandleFromUrl, normalizeInputUrl } from '../xUrl'
import { HEADING_LEVEL_THREE } from './constants'
import { parseMetricsFromText } from './metrics'
import { normalizeText } from './text'

interface ParseState {
  blocks: ArticleBlock[]
  codeBuffer: string[]
  codeLanguage?: string
  inCodeFence: boolean
  listBuffer: string[]
  paragraphBuffer: string[]
}

const MARKDOWN_MARKER = 'Markdown Content:'

const createState = (): ParseState => ({ blocks: [], codeBuffer: [], inCodeFence: false, listBuffer: [], paragraphBuffer: [] })

const flushParagraph = (state: ParseState): void => {
  if (state.paragraphBuffer.length === 0) return
  const text = normalizeText(state.paragraphBuffer.join(' '))
  if (text) state.blocks.push({ type: 'paragraph', text })
  state.paragraphBuffer = []
}

const flushList = (state: ParseState): void => {
  if (state.listBuffer.length === 0) return
  state.blocks.push({ type: 'list', items: state.listBuffer.map((text) => ({ text })) })
  state.listBuffer = []
}

const flushCode = (state: ParseState): void => {
  const code = state.codeBuffer.join('\n').trim()
  if (code) state.blocks.push({ type: 'code', code, language: state.codeLanguage })
  state.codeBuffer = []
  state.codeLanguage = undefined
}

const parseFenceStart = (line: string): string | undefined | null => line.match(/^```([A-Za-z0-9_+-]+)?\s*$/)?.[1] || null

const parseMarkdownImage = (line: string): Extract<ArticleBlock, { type: 'media' }> | null => {
  const match = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
  return match ? { type: 'media', mediaType: 'image', caption: match[1] ? normalizeText(match[1]) : undefined, url: match[2] } : null
}

const processCodeFence = (state: ParseState, line: string, rawLine: string): boolean => {
  if (!state.inCodeFence) return false
  if (parseFenceStart(line) !== null) {
    state.inCodeFence = false
    flushCode(state)
    return true
  }
  state.codeBuffer.push(rawLine)
  return true
}

const startCodeFence = (state: ParseState, line: string): boolean => {
  const language = parseFenceStart(line)
  if (language === null) return false
  flushParagraph(state)
  flushList(state)
  state.inCodeFence = true
  state.codeLanguage = language
  return true
}

const processNonTextBlock = (state: ParseState, line: string): boolean => {
  const media = parseMarkdownImage(line)
  if (media) {
    flushParagraph(state)
    flushList(state)
    state.blocks.push(media)
    return true
  }
  const headingMatch = line.match(/^(#{1,3})\s+(.+)$/)
  if (headingMatch) {
    flushParagraph(state)
    flushList(state)
    const level = Math.min(
      headingMatch[1].length,
      HEADING_LEVEL_THREE,
    ) as Extract<ArticleBlock, { type: 'heading' }>['level']
    state.blocks.push({
      type: 'heading',
      level,
      text: normalizeText(headingMatch[2]),
    })
    return true
  }
  const listMatch = line.match(/^[-*]\s+(.+)$/)
  if (listMatch) {
    flushParagraph(state)
    state.listBuffer.push(normalizeText(listMatch[1]))
    return true
  }
  if (line.startsWith('>')) {
    flushParagraph(state)
    flushList(state)
    const quoteText = normalizeText(line.replace(/^>+/, ''))
    if (quoteText) state.blocks.push({ type: 'quote', text: quoteText })
    return true
  }
  return false
}

const processLine = (state: ParseState, rawLine: string): void => {
  const line = rawLine.trim()
  if (processCodeFence(state, line, rawLine) || startCodeFence(state, line)) return
  if (!line) {
    flushParagraph(state)
    flushList(state)
    return
  }
  if (!processNonTextBlock(state, line)) {
    state.paragraphBuffer.push(line)
  }
}

const parseBlocksFromMarkdown = (markdown: string): ArticleBlock[] => {
  const state = createState()
  markdown.split('\n').forEach((line) => processLine(state, line))
  flushParagraph(state)
  flushList(state)
  if (state.inCodeFence) flushCode(state)
  return state.blocks
}

const resolveTitle = (raw: string, blocks: ArticleBlock[]): string => {
  const titleLineMatch = raw.match(/Title:\s*(.+)/)
  const candidate = titleLineMatch?.[1]?.trim()
  if (candidate && candidate !== 'X') {
    return candidate.replace(/\s*\/\s*X$/i, '')
  }
  return blocks.find((block) => block.type === 'heading')?.text || 'Untitled X Article'
}

export const parseJinaMarkdown = (raw: string, sourceUrl: string): ExtractedArticle => {
  const markdown = raw.includes(MARKDOWN_MARKER) ? raw.slice(raw.indexOf(MARKDOWN_MARKER) + MARKDOWN_MARKER.length).trim() : raw
  const blocks = parseBlocksFromMarkdown(markdown)
  const authorMatch = raw.match(/by\s+(.+?)\s+\(@([^)]+)\)/i)
  const url = normalizeInputUrl(sourceUrl)
  return {
    sourceUrl,
    canonicalUrl: sourceUrl,
    title: resolveTitle(raw, blocks),
    authorName: authorMatch?.[1]?.trim() || getHandleFromUrl(url),
    authorHandle: authorMatch?.[2]?.trim() || getHandleFromUrl(url),
    metrics: parseMetricsFromText(raw),
    metricNotes: {
      likes: 'best effort from fallback text parsing',
      replies: 'best effort from fallback text parsing',
      reposts: 'best effort from fallback text parsing',
      views: 'best effort from fallback text parsing',
      bookmarks: 'best effort from fallback text parsing',
    },
    blocks,
    warnings: ['Fallback extraction mode used. Some metrics or embeds may be missing.'],
    extractedAt: new Date().toISOString(),
    mode: 'fallback',
    providerUsed: 'jina',
    providerAttempts: [],
  }
}
