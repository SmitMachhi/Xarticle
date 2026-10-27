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
    coverBadge: { fontSize: 11, bold: true, color: text },
    coverMeta: { fontSize: 12, color: meta },
    coverMetricLabel: { fontSize: 9, color: meta, bold: true },
    coverMetricValue: { fontSize: 13, color: text, bold: true },
    codeBlock: { fontSize: 10, color: text, background: code },
    coverTitle: { fontSize: 30, bold: true, color: text, lineHeight: 1.1 },
    embed: { fontSize: 10, color: text, decoration: 'underline' },
    h1: { fontSize: 21, bold: true, color: text },
    h2: { fontSize: 17, bold: true, color: text },
    h3: { fontSize: 14, bold: true, color: text },
    inlineCode: { background: code },
    inlineLink: { color: text, decoration: 'underline' },
    mediaCaption: { fontSize: 9, color: meta, italics: true },
    meta: { fontSize: 10, color: meta },
    paragraph: { fontSize: 11, lineHeight: 1.4, color: text },
    quote: { fontSize: 11, lineHeight: 1.4, italics: true, color: meta },
    title: { fontSize: 22, bold: true, color: text },
  }
}
