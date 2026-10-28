import { LoaderCircle, Printer } from 'lucide-react'

import { FLOATING_SURFACE, ICON_BUTTON, ICON_SIZE, PRIMARY_BUTTON } from '../constants/styles'
import { CopyTextButton } from './CopyTextButton'

interface ExportSectionProps {
  canDownload: boolean
  copyPayload: string
  downloadState: 'idle' | 'pdf' | 'print'
  error: string | null
  onPdf: () => void
  onPrint: () => void
}

export const ExportSection = (props: ExportSectionProps) => {
  const { canDownload, downloadState } = props
  const PrintIcon = downloadState === 'print' ? LoaderCircle : Printer
  return (
    <section aria-label="Export" className={`z-10 flex flex-wrap items-center justify-center gap-1 self-center rounded-[1.75rem] p-1.5 sm:sticky sm:top-4 print:hidden ${FLOATING_SURFACE}`}>
      <button className={PRIMARY_BUTTON} disabled={!canDownload} onClick={props.onPdf}>{downloadState === 'pdf' ? 'Generating…' : 'Download PDF'}</button>
      <button aria-label="Print" className={ICON_BUTTON} disabled={!canDownload} onClick={props.onPrint} title="Print"><PrintIcon className={downloadState === 'print' ? 'animate-spin' : undefined} size={ICON_SIZE} /></button>
      <CopyTextButton payload={props.copyPayload} />
      {props.error ? <p className="basis-full px-3 pb-1 text-center text-sm text-red-600" role="alert">{props.error}</p> : null}
    </section>
  )
}
