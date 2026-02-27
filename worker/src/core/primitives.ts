import { MILLISECONDS_IN_SECOND } from './constants'

export const firstString = (...values: unknown[]): string | undefined => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }
  return undefined
}

export const firstNumber = (...values: unknown[]): number | undefined => {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }
    if (typeof value === 'string' && value.trim() && /^\d+$/.test(value.trim())) {
      return Number.parseInt(value.trim(), 10)
    }
  }
  return undefined
}

export const normalizeImageUrl = (input: unknown): string | null => {
  if (typeof input !== 'string') return null
  const trimmed = input.trim()
  if (!trimmed.startsWith('http')) return null
  return /[?&]name=/.test(trimmed) ? trimmed : `${trimmed}?name=orig`
}

export const toUnixTimestamp = (value: unknown): number | null => {
  if (typeof value !== 'string' || !value.trim()) return null
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? null : Math.floor(parsed / MILLISECONDS_IN_SECOND)
}

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const stripUrlFromTail = (text: string, expandedUrls: string[]): string => {
  let normalized = text.trim()
  for (const expandedUrl of expandedUrls) {
    normalized = normalized.replace(new RegExp(`\\s*${escapeRegex(expandedUrl)}\\s*$`, 'i'), '').trim()
  }
  return normalized
}

export const chunkParagraphs = (text: string): Array<{ text: string; type: 'paragraph' }> => {
  return text
    .split(/\n{2,}/)
    .map((part) => part.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .map((part) => ({ type: 'paragraph', text: part }))
}
