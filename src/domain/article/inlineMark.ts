export interface InlineMark {
  offset: number
  length: number
  type: 'bold' | 'italic' | 'underline' | 'code' | 'link'
  url?: string
}

export interface ListItem {
  text: string
  marks?: InlineMark[]
}
