import pdfMake from 'pdfmake/build/pdfmake'
import courier from 'pdfmake/build/standard-fonts/Courier'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import type { TDocumentDefinitions } from 'pdfmake/interfaces'

export const createPdfDocument = (definition: TDocumentDefinitions) => {
  pdfMake.addVirtualFileSystem(pdfFonts)
  pdfMake.addFontContainer(courier)
  return pdfMake.createPdf(definition)
}
