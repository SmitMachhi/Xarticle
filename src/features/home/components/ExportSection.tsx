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
    <section aria-label="Export" className="export-bar card">
      <div className="export-actions">
        <button className="btn-primary" disabled={!canDownload} onClick={props.onPdf}>{downloadState === 'pdf' ? 'Generating…' : 'Download PDF'}</button>
        <button className="btn-quiet" disabled={!canDownload} onClick={props.onPrint}>{downloadState === 'print' ? 'Preparing…' : 'Print'}</button>
        <button className="btn-quiet" disabled={!canDownload} onClick={props.onMarkdown} title="Markdown file, ready to paste into an LLM">{downloadState === 'markdown' ? 'Generating…' : 'Markdown'}</button>
        <CopyTextButton payload={props.copyPayload} />
      </div>
      {props.error ? <p className="form-message is-error" role="alert">{props.error}</p> : null}
    </section>
  )
}
