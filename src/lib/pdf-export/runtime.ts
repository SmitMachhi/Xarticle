import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'

let initialized = false

export const ensurePdfRuntime = (): void => {
  if (initialized) {
    return
  }
  pdfMake.addVirtualFileSystem(pdfFonts)
  initialized = true
}

export { pdfMake }
