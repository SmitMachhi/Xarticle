const GLYPH_FALLBACKS: Record<string, string> = {
  '→': '->',
  '⇒': '=>',
  '⟶': '->',
  '➜': '->',
  '➡': '->',
  '←': '<-',
  '⇐': '<=',
  '↔': '<->',
  '✓': '•',
  '✔': '•',
  '✅': '•',
  '☑': '•',
  '✗': '×',
  '✘': '×',
  '❌': '×',
  '❎': '×',
}

const FALLBACK_PATTERN = new RegExp(`[${Object.keys(GLYPH_FALLBACKS).join('')}]\\uFE0F?`, 'gu')
const UNSUPPORTED_PATTERN = /(?:(?=\p{Extended_Pictographic})[^ -↏]|[←-⇿⌀-⏿①-⓿□-◉◐-➿⬀-⯿])[️‍]* ?/gu
const KEYCAP_PATTERN = /[️⃣‍]/gu

export const pdfSafeText = (value: string): string => {
  return value
    .replace(FALLBACK_PATTERN, (match) => GLYPH_FALLBACKS[match.replace('️', '')] ?? '')
    .replace(UNSUPPORTED_PATTERN, '')
    .replace(KEYCAP_PATTERN, '')
}

const BOX_FALLBACKS: Record<string, string> = { '─': '-', '━': '-', '═': '=', '│': '|', '┃': '|', '║': '|', '├': '|', '┤': '|', '└': '`' }
const BOX_PATTERN = /[─-╿]/gu
const BOX_JOINT = '+'
const WIN_ANSI_EXTRAS = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ'
const NON_WIN_ANSI = new RegExp(`[^\\t\\n\\x20-\\x7E\\xA0-\\xFF${WIN_ANSI_EXTRAS}]`, 'gu')
const MISSING_GLYPH = '?'

export const codeSafeText = (value: string): string => {
  return pdfSafeText(value)
    .replace(BOX_PATTERN, (match) => BOX_FALLBACKS[match] ?? BOX_JOINT)
    .replace(NON_WIN_ANSI, MISSING_GLYPH)
}
