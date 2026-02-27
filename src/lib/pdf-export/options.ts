import type { CoverMetaStyle, CoverPageMode, MarginPreset, PaperSize, ThemeMode } from '../../types/article'

export interface PdfExportOptions {
  coverMetaStyle: CoverMetaStyle
  coverPageMode: CoverPageMode
  marginPreset: MarginPreset
  paperSize: PaperSize
  themeMode: ThemeMode
}
