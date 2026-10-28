import { useState } from 'react'

import type { PdfExportOptions } from '../../../lib/pdf-export/options'
import { downloadArticlePdf, printArticlePdf } from '../../../lib/pdfExport'
import type { ExtractedArticle } from '../../../types/article'

type DownloadState = 'idle' | 'pdf' | 'print'

// One print-friendly layout: US Letter, narrow margins.
const PDF_OPTIONS: PdfExportOptions = { paperSize: 'LETTER', marginPreset: 'minimum', themeMode: 'color', coverMetaStyle: 'full', coverPageMode: 'always' }

interface ExportState {
  canDownload: boolean
  downloadState: DownloadState
  downloadPdf: () => Promise<void>
  printPdf: () => Promise<void>
}

export const useExportState = (
  article: ExtractedArticle | null,
  onError: (message: string) => void,
): ExportState => {
  const [downloadState, setDownloadState] = useState<DownloadState>('idle')
  const canDownload = Boolean(article) && downloadState === 'idle'

  const downloadPdf = async (): Promise<void> => {
    if (!article) {
      return
    }
    setDownloadState('pdf')
    try {
      await downloadArticlePdf(article, PDF_OPTIONS)
    } catch (error) {
      onError(error instanceof Error ? error.message : 'PDF generation failed.')
    } finally {
      setDownloadState('idle')
    }
  }

  const printPdf = async (): Promise<void> => {
    if (!article) {
      return
    }
    setDownloadState('print')
    try {
      await printArticlePdf(article, PDF_OPTIONS)
    } catch (error) {
      onError(error instanceof Error ? error.message : 'PDF print failed.')
    } finally {
      setDownloadState('idle')
    }
  }

  return { canDownload, downloadState, downloadPdf, printPdf }
}
