import type { InlineMark } from '../../types/article'

// One token per match, checked in priority order: code spans first so their contents stay literal.
// Group names match mark types; only http(s) links become links.
const INLINE_TOKEN = /`(?<code>[^`]+)`|\[(?<link>[^\]]+)\]\((?<url>https?:\/\/[^)\s]+)\)|\*\*(?<bold>[^*]+)\*\*|~~(?<strikethrough>[^~]+)~~|\*(?<italic>[^*\s][^*]*)\*/g
const MARK_TYPES: readonly InlineMark['type'][] = ['code', 'link', 'bold', 'strikethrough', 'italic']

export interface RichText {
  text: string
  marks?: InlineMark[]
}

const markFor = (match: RegExpMatchArray, offset: number): { content: string; mark: InlineMark } | null => {
  const groups = match.groups ?? {}
  const type = MARK_TYPES.find((name) => groups[name] !== undefined)
  if (!type) return null
  const content = groups[type]
  const mark: InlineMark = { offset, length: content.length, type }
  return { content, mark: type === 'link' ? { ...mark, url: groups.url } : mark }
}

export const parseInline = (raw: string): RichText => {
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
