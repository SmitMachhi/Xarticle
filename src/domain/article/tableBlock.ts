import type { RichText } from './inlineMark'

export interface TableBlock {
  type: 'table'
  header: RichText[]
  rows: RichText[][]
}
