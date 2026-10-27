import type { ListItem } from './inlineMark'

export interface ListBlock {
  type: 'list'
  ordered?: boolean
  items: ListItem[]
}
