import type { InlineMark } from '../../types/article'

export const normalizeText = (value: string): string => value.replace(/\s+/g, ' ').trim()

const WHITESPACE_SPLIT = /(\s+)/
const PARAGRAPH_BREAK = '\n\n'

const collapseRun = (run: string): string => {
  const breaks = run.split('\n').length - 1
  if (breaks === 0) return ' '
  return breaks === 1 ? '\n' : PARAGRAPH_BREAK
}

// Collapses whitespace but keeps line/paragraph breaks; positions[i] is where source index i lands.
const collapseWhitespace = (value: string): { text: string; positions: number[] } => {
  const positions: number[] = []
  let text = ''
  for (const part of value.split(WHITESPACE_SPLIT)) {
    const isRun = part.trim() === '' && part.length > 0
    for (let index = 0; index < part.length; index += 1) positions.push(text.length + (isRun ? 0 : index))
    text += isRun ? collapseRun(part) : part
  }
  positions.push(text.length)
  return { text, positions }
}

const remapMark = (mark: InlineMark, toIndex: (source: number) => number): InlineMark | null => {
  const start = toIndex(mark.offset)
  const end = toIndex(mark.offset + mark.length)
  return end > start ? { ...mark, offset: start, length: end - start } : null
}

export const normalizeRichText = (value: string, marks?: InlineMark[]): { text: string; marks?: InlineMark[] } => {
  const { text, positions } = collapseWhitespace(value)
  const lead = text.length - text.trimStart().length
  const trimmed = text.trim()
  const toIndex = (source: number): number => Math.min(Math.max(positions[Math.min(source, value.length)] - lead, 0), trimmed.length)
  const remapped = marks?.map((mark) => remapMark(mark, toIndex)).filter((mark): mark is InlineMark => mark !== null)
  return remapped && remapped.length > 0 ? { text: trimmed, marks: remapped } : { text: trimmed }
}

export const asIsoDate = (value: string | undefined): string | undefined => {
  if (!value) {
    return undefined
  }
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? undefined : new Date(timestamp).toISOString()
}

export const parseFencedCode = (value: string): { code: string; language?: string } | null => {
  const match = value.match(/^```([A-Za-z0-9_+-]+)?\n([\s\S]+)\n```$/)
  if (!match) {
    return null
  }
  return { code: match[2].trim(), language: match[1] || undefined }
}
