import type { ListItem } from './inlineMark'

export type TableCell = ListItem

export interface TableBlock {
  type: 'table'
  header: TableCell[]
  rows: TableCell[][]
}
