// Roboto (the bundled PDF font) has no arrows, check marks, dingbats or emoji; they render as empty boxes.
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
// Pictographs below U+2190 (©, ®, ™, ‼) exist in Roboto, so only strip from the arrows block upward.
const UNSUPPORTED_PATTERN = /(?:(?=\p{Extended_Pictographic})[^ -↏]|[←-⇿⌀-⏿①-⓿□-◉◐-➿⬀-⯿])[️‍]* ?/gu
const KEYCAP_PATTERN = /[️⃣‍]/gu

export const pdfSafeText = (value: string): string => {
  return value
    .replace(FALLBACK_PATTERN, (match) => GLYPH_FALLBACKS[match.replace('️', '')] ?? '')
    .replace(UNSUPPORTED_PATTERN, '')
    .replace(KEYCAP_PATTERN, '')
}
