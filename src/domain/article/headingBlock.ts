import type { InlineMark } from './inlineMark'

export type HeadingLevel = 1 | 2 | 3

export interface HeadingBlock {
  type: 'heading'
  text: string
  level: HeadingLevel
  marks?: InlineMark[]
}
