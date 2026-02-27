export interface MediaBlock {
  type: 'media'
  mediaType: 'image' | 'video-thumbnail'
  url: string
  caption?: string
}
