import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import type { TDocumentDefinitions } from 'pdfmake/interfaces'

// pdfmake reads fonts from one global virtual file system. Loading them on every call just overwrites
// the same entries, so callers need no setup step and nothing runs at import time.
export const createPdfDocument = (definition: TDocumentDefinitions) => {
  pdfMake.addVirtualFileSystem(pdfFonts)
  return pdfMake.createPdf(definition)
}
