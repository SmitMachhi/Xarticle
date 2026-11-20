export interface InlineMark {
  offset: number
  length: number
  type: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code' | 'link'
  url?: string
}

// Text plus its inline marks: one list item, table cell or parsed markdown span.
export interface RichText {
  text: string
  marks?: InlineMark[]
}
