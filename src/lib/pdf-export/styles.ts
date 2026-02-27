import type { StyleDictionary } from 'pdfmake/interfaces'

import type { ThemeMode } from '../../types/article'
import { MARGIN_CODE_BLOCK, MARGIN_INLINE_NONE, MARGIN_SMALL, MARGIN_XLARGE } from './constants'

export const stylesForTheme = (themeMode: ThemeMode): StyleDictionary => {
  const textColor = themeMode === 'bw' ? '#111111' : '#171717'
  const metaColor = themeMode === 'bw' ? '#333333' : '#525252'
  return {
    coverBadge: { fontSize: 11, bold: true, color: textColor },
    coverMeta: { fontSize: 12, color: metaColor },
    coverMetricLabel: { fontSize: 9, color: metaColor, bold: true },
    coverMetricValue: { fontSize: 13, color: textColor, bold: true },
    coverTitle: { fontSize: 28, bold: true, color: textColor },
    embed: { fontSize: 10, color: textColor, decoration: 'underline' },
    h1: { fontSize: 18, bold: true, color: textColor },
    h2: { fontSize: 16, bold: true, color: textColor },
    h3: { fontSize: 14, bold: true, color: textColor },
    mediaCaption: { fontSize: 9, color: metaColor, italics: true },
    meta: { fontSize: 10, color: metaColor },
    paragraph: { fontSize: 11, lineHeight: 1.4, color: textColor },
    quote: { fontSize: 11, italics: true, color: textColor, margin: [MARGIN_XLARGE, MARGIN_SMALL, MARGIN_INLINE_NONE, MARGIN_CODE_BLOCK] },
    title: { fontSize: 22, bold: true, color: textColor },
  }
}
