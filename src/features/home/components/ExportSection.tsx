import { FLOATING_SURFACE, GHOST_BUTTON, PRIMARY_BUTTON } from '../constants/styles'
import { CopyTextButton } from './CopyTextButton'

interface ExportSectionProps {
  canDownload: boolean
  copyPayload: string
  downloadState: 'idle' | 'pdf' | 'print' | 'markdown'
  error: string | null
  onMarkdown: () => void
  onPdf: () => void
  onPrint: () => void
}

export const ExportSection = (props: ExportSectionProps) => {
  const { canDownload, downloadState } = props
  return (
    <section aria-label="Export" className={`z-10 grid grid-cols-2 gap-1 rounded-[1.75rem] p-1.5 sm:sticky sm:top-4 sm:flex sm:self-center print:hidden ${FLOATING_SURFACE}`}>
      <button className={PRIMARY_BUTTON} disabled={!canDownload} onClick={props.onPdf}>{downloadState === 'pdf' ? 'Generating…' : 'Download PDF'}</button>
      <button className={GHOST_BUTTON} disabled={!canDownload} onClick={props.onPrint}>{downloadState === 'print' ? 'Preparing…' : 'Print'}</button>
      <button className={GHOST_BUTTON} disabled={!canDownload} onClick={props.onMarkdown} title="Markdown file, ready to paste into an LLM">{downloadState === 'markdown' ? 'Generating…' : 'Markdown'}</button>
      <CopyTextButton payload={props.copyPayload} />
      {props.error ? <p className="col-span-2 basis-full px-3 pb-1 text-center text-sm text-red-600" role="alert">{props.error}</p> : null}
    </section>
  )
}
