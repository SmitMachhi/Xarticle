import { useState } from 'react'

import { downloadArticleMarkdownWithMode } from '../../../lib/markdownExport'
import { downloadArticlePdf, printArticlePdf } from '../../../lib/pdfExport'
import type { ExtractedArticle, MarginPreset, PaperSize } from '../../../types/article'

type DownloadState = 'idle' | 'pdf' | 'print' | 'markdown'

interface ExportState {
  canDownload: boolean
  downloadState: DownloadState
  marginPreset: MarginPreset
  paperSize: PaperSize
  setMarginPreset: (value: MarginPreset) => void
  setPaperSize: (value: PaperSize) => void
  downloadPdf: () => Promise<void>
  printPdf: () => Promise<void>
  downloadMarkdown: () => Promise<void>
}

export const useExportState = (
  article: ExtractedArticle | null,
  onError: (message: string) => void,
): ExportState => {
  const [downloadState, setDownloadState] = useState<DownloadState>('idle')
  const [marginPreset, setMarginPreset] = useState<MarginPreset>('default')
  const [paperSize, setPaperSize] = useState<PaperSize>('A4')
  const canDownload = Boolean(article) && downloadState === 'idle'

  const downloadPdf = async (): Promise<void> => {
    if (!article) {
      return
    }
    setDownloadState('pdf')
    try {
      await downloadArticlePdf(article, { paperSize, marginPreset, themeMode: 'color', coverMetaStyle: 'full', coverPageMode: 'always' })
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
      await printArticlePdf(article, { paperSize, marginPreset, themeMode: 'color', coverMetaStyle: 'full', coverPageMode: 'always' })
    } catch (error) {
      onError(error instanceof Error ? error.message : 'PDF print failed.')
    } finally {
      setDownloadState('idle')
    }
  }

  const downloadMarkdown = async (): Promise<void> => {
    if (!article) {
      return
    }
    setDownloadState('markdown')
    try {
      await downloadArticleMarkdownWithMode(article, 'auto')
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Markdown generation failed.')
    } finally {
      setDownloadState('idle')
    }
  }

  return { canDownload, downloadState, marginPreset, paperSize, setMarginPreset, setPaperSize, downloadPdf, printPdf, downloadMarkdown }
}
