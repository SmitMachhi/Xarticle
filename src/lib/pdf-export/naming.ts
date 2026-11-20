import { FILENAME_FALLBACK, FILENAME_TITLE_LIMIT } from './constants'

const ILLEGAL_FILENAME_CHARS = /[<>:"/\\|?*\p{Cc}]/gu

export const fileNameForPdf = (title: string): string => {
  const name = title.replace(ILLEGAL_FILENAME_CHARS, ' ').replace(/\s+/g, ' ').slice(0, FILENAME_TITLE_LIMIT).replace(/[\s.]+$/, '').trim()
  return `${name || FILENAME_FALLBACK}.pdf`
}
