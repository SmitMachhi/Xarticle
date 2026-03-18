import type { InlineMark } from '../../types/article'

type PdfTextFragment = string | {
  text: string
  bold?: boolean
  italics?: boolean
  decoration?: 'underline'
  link?: string
  style?: string
}

const breakpointsFor = (text: string, marks: InlineMark[]): number[] => {
  const points = new Set<number>([0, text.length])
  for (const mark of marks) {
    points.add(mark.offset)
    points.add(mark.offset + mark.length)
  }
  return [...points].filter((point) => point >= 0 && point <= text.length).sort((a, b) => a - b)
}

const withMark = (fragment: Exclude<PdfTextFragment, string>, mark: InlineMark): Exclude<PdfTextFragment, string> => {
  if (mark.type === 'bold') return { ...fragment, bold: true }
  if (mark.type === 'italic') return { ...fragment, italics: true }
  if (mark.type === 'underline') return { ...fragment, decoration: 'underline' }
  if (mark.type === 'code') return { ...fragment, style: 'inlineCode' }
  if (mark.type === 'link' && mark.url) return { ...fragment, link: mark.url, decoration: 'underline', style: 'inlineLink' }
  return fragment
}

export const inlineText = (text: string, marks?: InlineMark[]): PdfTextFragment | PdfTextFragment[] => {
  if (!marks || marks.length === 0) return text
  const fragments: PdfTextFragment[] = []
  const breakpoints = breakpointsFor(text, marks)
  for (let index = 0; index < breakpoints.length - 1; index += 1) {
    const start = breakpoints[index]
    const end = breakpoints[index + 1]
    if (end <= start) continue
    const slice = text.slice(start, end)
    const activeMarks = marks.filter((mark) => mark.offset <= start && mark.offset + mark.length >= end)
    if (activeMarks.length === 0) {
      fragments.push(slice)
      continue
    }
    let fragment: Exclude<PdfTextFragment, string> = { text: slice }
    for (const mark of activeMarks) fragment = withMark(fragment, mark)
    fragments.push(fragment)
  }
  return fragments
}
