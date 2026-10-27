import type { MarginPreset, PaperSize } from '../../../types/article'
import { MARGIN_PRESET_OPTIONS, PAPER_SIZE_OPTIONS } from '../constants/uiContent'
import { CopyTextButton } from './CopyTextButton'

interface ExportSectionProps {
  canDownload: boolean
  copyPayload: string
  downloadState: 'idle' | 'pdf' | 'print' | 'markdown'
  error: string | null
  marginPreset: MarginPreset
  onMarginPresetChange: (value: MarginPreset) => void
  onMarkdown: () => void
  onPdf: () => void
  onPaperSizeChange: (value: PaperSize) => void
  onPrint: () => void
  paperSize: PaperSize
}

const renderOptions = <T extends string>(items: ReadonlyArray<{ label: string; value: T }>) => items.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)

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
      <div className="export-settings">
        <select aria-label="Paper size" onChange={(event) => props.onPaperSizeChange(event.target.value as PaperSize)} value={props.paperSize}>{renderOptions(PAPER_SIZE_OPTIONS)}</select>
        <select aria-label="Margins" onChange={(event) => props.onMarginPresetChange(event.target.value as MarginPreset)} value={props.marginPreset}>{renderOptions(MARGIN_PRESET_OPTIONS)}</select>
      </div>
      {props.error ? <p className="form-message is-error" role="alert">{props.error}</p> : null}
    </section>
  )
}
