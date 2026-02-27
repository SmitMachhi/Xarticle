import { FILENAME_SEGMENT_LIMIT, STATUS_ID_PATTERN } from './constants'

const toFilenameSafe = (value: string): string => {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, FILENAME_SEGMENT_LIMIT)
}

const statusIdFromUrl = (url: string): string | null => {
  try {
    return new URL(url).pathname.match(STATUS_ID_PATTERN)?.[1] || null
  } catch {
    return null
  }
}

const compactStamp = (): string => {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\..*$/, '').replace('T', '-')
}

export const fileNameForPdf = (title: string, handle: string, canonicalUrl: string, isBw: boolean): string => {
  const titleSlug = toFilenameSafe(title || 'article')
  const handleSlug = toFilenameSafe(handle || 'unknown')
  const statusId = statusIdFromUrl(canonicalUrl)
  const core = statusId ? `${handleSlug}-${statusId}` : `${titleSlug}-${handleSlug}`
  return `xarticle-${core}-${isBw ? 'bw' : 'color'}-${compactStamp()}.pdf`
}
