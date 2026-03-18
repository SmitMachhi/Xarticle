import type { ReactNode } from 'react'

import type { InlineMark } from '../../../types/article'

interface MarkEvent {
  position: number
  isStart: boolean
  mark: InlineMark
}

const wrapWithMark = (children: ReactNode, mark: InlineMark, key: string): ReactNode => {
  if (mark.type === 'bold') return <strong key={key}>{children}</strong>
  if (mark.type === 'italic') return <em key={key}>{children}</em>
  if (mark.type === 'underline') return <u key={key}>{children}</u>
  if (mark.type === 'code') return <code key={key}>{children}</code>
  if (mark.type === 'link' && mark.url) {
    return <a href={mark.url} key={key} rel="noreferrer" target="_blank">{children}</a>
  }
  return children
}

const buildSegments = (text: string, marks: InlineMark[]): ReactNode[] => {
  const events: MarkEvent[] = []
  for (const mark of marks) {
    events.push({ position: mark.offset, isStart: true, mark })
    events.push({ position: mark.offset + mark.length, isStart: false, mark })
  }
  events.sort((a, b) => a.position - b.position || Number(a.isStart) - Number(b.isStart))

  const breakpoints = [...new Set(events.map((e) => e.position))].sort((a, b) => a - b)
  const segments: ReactNode[] = []
  let cursor = 0

  for (const bp of breakpoints) {
    if (bp > cursor && bp <= text.length) {
      const slice = text.slice(cursor, bp)
      const activeMarks = marks.filter((m) => m.offset <= cursor && m.offset + m.length >= bp)
      let node: ReactNode = slice
      for (const mark of activeMarks) {
        node = wrapWithMark(node, mark, `m${cursor}-${mark.type}-${mark.offset}`)
      }
      segments.push(node)
    }
    cursor = bp
  }

  if (cursor < text.length) {
    const slice = text.slice(cursor)
    const activeMarks = marks.filter((m) => m.offset <= cursor && m.offset + m.length >= text.length)
    let node: ReactNode = slice
    for (const mark of activeMarks) {
      node = wrapWithMark(node, mark, `m${cursor}-${mark.type}-${mark.offset}`)
    }
    segments.push(node)
  }

  return segments
}

interface RichTextProps {
  text: string
  marks?: InlineMark[]
}

export const RichText = ({ text, marks }: RichTextProps) => {
  if (!marks || marks.length === 0) return <>{text}</>
  return <>{buildSegments(text, marks)}</>
}
