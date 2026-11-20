// pdfmake ships its standard fonts without types; Courier exports one font container.
declare module 'pdfmake/build/standard-fonts/Courier' {
  import type { TFontContainer } from 'pdfmake/interfaces'

  const courier: TFontContainer
  export = courier
}
