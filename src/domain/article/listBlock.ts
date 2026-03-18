import type { ListItem } from './inlineMark'

export interface ListBlock {
  type: 'list'
  items: ListItem[]
}
