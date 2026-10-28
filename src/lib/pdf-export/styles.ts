import type { StyleDictionary } from 'pdfmake/interfaces'

import type { ThemeMode } from '../../types/article'

export interface PdfPalette {
  accent: string
  code: string
  meta: string
  rule: string
  text: string
}

export const paletteForTheme = (themeMode: ThemeMode): PdfPalette => {
  if (themeMode === 'bw') return { accent: '#555555', code: '#f3f4f6', meta: '#333333', rule: '#bbbbbb', text: '#111111' }
  return { accent: '#7aa98b', code: '#f4fbf6', meta: '#525252', rule: '#bfd1c1', text: '#171717' }
}

export const stylesForTheme = (themeMode: ThemeMode): StyleDictionary => {
  const { code, meta, text } = paletteForTheme(themeMode)
  return {
    codeBlock: { fontSize: 10, color: text, background: code },
    embed: { fontSize: 10, color: text, decoration: 'underline' },
    h1: { fontSize: 21, bold: true, color: text },
    h2: { fontSize: 17, bold: true, color: text },
    h3: { fontSize: 14, bold: true, color: text },
    inlineCode: { background: code },
    inlineLink: { color: text, decoration: 'underline' },
    mediaCaption: { fontSize: 9, color: meta, italics: true },
    meta: { fontSize: 10, color: meta },
    paragraph: { fontSize: 10, lineHeight: 1.3, color: text },
    quote: { fontSize: 10, lineHeight: 1.3, italics: true, color: meta },
  }
}
