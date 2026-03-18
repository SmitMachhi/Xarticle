import type { InlineMark } from './inlineMark'

export interface QuoteBlock {
  type: 'quote'
  text: string
  marks?: InlineMark[]
}
