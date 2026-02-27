export const firstString = (...values) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
}

export const firstNumber = (...values) => {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && /^\d+$/.test(value.trim())) return Number.parseInt(value.trim(), 10)
  }
}

export const normalizeStatusId = value => {
  const cleaned = typeof value === 'string' ? value.trim() : ''
  return /^\d+$/.test(cleaned) ? cleaned : null
}

export const normalizeImageUrl = input => {
  const trimmed = typeof input === 'string' ? input.trim() : ''
  if (!trimmed.startsWith('http')) return null
  return /[?&]name=/.test(trimmed) ? trimmed : `${trimmed}?name=orig`
}

export const toUnixTimestamp = value => {
  if (typeof value !== 'string' || !value.trim()) return null
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? null : Math.floor(parsed / 1000)
}

export const chunkParagraphs = text => {
  if (typeof text !== 'string') return []
  const normalize = part => part.replace(/\s+/g, ' ').trim()
  return text.split(/\n{2,}/).map(normalize).filter(Boolean).map(part => ({ type: 'paragraph', text: part }))
}

const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const stripUrlFromTail = (text, expandedUrls) => {
  let normalized = typeof text === 'string' ? text.trim() : ''
  for (const url of expandedUrls) normalized = normalized.replace(new RegExp(`\\s*${escapeRegex(url)}\\s*$`, 'i'), '').trim()
  return normalized
}
