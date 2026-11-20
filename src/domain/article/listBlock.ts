import type { RichText } from './inlineMark'

export interface ListBlock {
  type: 'list'
  ordered?: boolean
  items: RichText[]
}
