export const normalizeText = (value: string): string => value.replace(/\s+/g, ' ').trim()

export const asIsoDate = (value: string | undefined): string | undefined => {
  if (!value) {
    return undefined
  }
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? undefined : new Date(timestamp).toISOString()
}

export const parseFencedCode = (value: string): { code: string; language?: string } | null => {
  const match = value.match(/^```([A-Za-z0-9_+-]+)?\n([\s\S]+)\n```$/)
  if (!match) {
    return null
  }
  return { code: match[2].trim(), language: match[1] || undefined }
}
