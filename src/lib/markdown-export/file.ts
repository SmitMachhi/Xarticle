import { MAX_FILENAME_SEGMENT_LENGTH } from './constants'

export const sanitizeFileSegment = (value: string): string => {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, MAX_FILENAME_SEGMENT_LENGTH)
}

export const saveBlobAsFile = (blob: Blob, filename: string): void => {
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(objectUrl)
}

export const baseFilename = (title: string, handle: string): string => {
  return `${sanitizeFileSegment(title || 'article')}-${sanitizeFileSegment(handle || 'unknown')}`
}
