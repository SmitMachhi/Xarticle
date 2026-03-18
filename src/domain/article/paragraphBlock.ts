import type { InlineMark } from './inlineMark'

export interface ParagraphBlock {
  type: 'paragraph'
  text: string
  marks?: InlineMark[]
}
