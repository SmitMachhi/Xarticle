import pdfMake from 'pdfmake/build/pdfmake'
import courier from 'pdfmake/build/standard-fonts/Courier'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import type { TDocumentDefinitions } from 'pdfmake/interfaces'

// pdfmake reads fonts from one global virtual file system. Loading them on every call just overwrites
// the same entries, so callers need no setup step and nothing runs at import time.
// Courier is the monospace font for code; it covers Latin-1 only (see codeSafeText).
export const createPdfDocument = (definition: TDocumentDefinitions) => {
  pdfMake.addVirtualFileSystem(pdfFonts)
  pdfMake.addFontContainer(courier)
  return pdfMake.createPdf(definition)
}
