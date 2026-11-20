export interface InlineMark {
  offset: number
  length: number
  type: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code' | 'link'
  url?: string
}

export interface RichText {
  text: string
  marks?: InlineMark[]
}
