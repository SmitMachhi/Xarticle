import { BILLION, MILLION, THOUSAND } from './constants'

export const normalizeText = (value: string): string => value.replace(/\s+/g, ' ').trim()

export const parseCount = (raw: string): number | null => {
  const cleaned = raw.replace(/,/g, '').trim().toLowerCase()
  if (!cleaned) {
    return null
  }
  const base = Number.parseFloat(cleaned)
  if (Number.isNaN(base)) {
    return null
  }
  const suffix = cleaned.slice(-1)
  if (suffix === 'k') {
    return Math.round(base * THOUSAND)
  }
  if (suffix === 'm') {
    return Math.round(base * MILLION)
  }
  if (suffix === 'b') {
    return Math.round(base * BILLION)
  }
  return Math.round(base)
}
