import type { TDocumentDefinitions } from 'pdfmake/interfaces'

import type { ExtractedArticle } from '../types/article'
import { recordPlannedDownload } from './downloadTelemetry'
import { proxyImageUrl } from './imageProxy'
import { buildPdfDefinition } from './pdf-export/definition'
import { fileNameForPdf } from './pdf-export/naming'
import type { PdfExportOptions } from './pdf-export/options'
import { ensurePdfRuntime, pdfMake } from './pdf-export/runtime'

const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Failed to read image data.'))
    reader.readAsDataURL(blob)
  })
}

const loadImageDataUrl = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(proxyImageUrl(url))
    if (!response.ok) {
      return null
    }
    return await blobToDataUrl(await response.blob())
  } catch {
    return null
  }
}

export const buildArticlePdfDefinition = async (
  article: ExtractedArticle,
  opts: PdfExportOptions,
  imageResolver: (url: string) => Promise<string | null> = loadImageDataUrl,
): Promise<TDocumentDefinitions> => {
  ensurePdfRuntime()
  return await buildPdfDefinition(article, opts, imageResolver)
}

export const downloadArticlePdf = async (article: ExtractedArticle, opts: PdfExportOptions): Promise<void> => {
  const definition = await buildArticlePdfDefinition(article, opts)
  const filename = fileNameForPdf(article.title, article.authorHandle, article.canonicalUrl, opts.themeMode === 'bw')
  recordPlannedDownload(filename)
  void pdfMake.createPdf(definition).download(filename)
}

export type { PdfExportOptions }
