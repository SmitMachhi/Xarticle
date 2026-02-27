import type { ArticleBlock } from '../../types/article'

const FALLBACK_EXTENSION = 'png'
const SUPPORTED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'])

export const collectMediaUrls = (blocks: ArticleBlock[]): string[] => {
  const mediaUrls = blocks.filter((block): block is Extract<ArticleBlock, { type: 'media' }> => block.type === 'media').map((block) => block.url)
  return [...new Set(mediaUrls.filter(Boolean))]
}

export const extensionFromContentType = (contentType: string | null): string => {
  if (!contentType) {
    return ''
  }
  const normalized = contentType.toLowerCase().split(';')[0].trim()
  if (normalized === 'image/jpeg') return 'jpg'
  if (normalized === 'image/png') return 'png'
  if (normalized === 'image/webp') return 'webp'
  if (normalized === 'image/gif') return 'gif'
  if (normalized === 'image/avif') return 'avif'
  return ''
}

export const extensionFromUrl = (url: string): string => {
  try {
    const maybeExt = new URL(url).pathname.split('.').at(-1)?.toLowerCase()
    if (maybeExt && SUPPORTED_EXTENSIONS.has(maybeExt)) {
      return maybeExt === 'jpeg' ? 'jpg' : maybeExt
    }
  } catch {
    return FALLBACK_EXTENSION
  }
  return FALLBACK_EXTENSION
}
