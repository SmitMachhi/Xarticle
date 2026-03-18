import type { MarginPreset, PaperSize } from '../../../types/article'
import { MARGIN_PRESET_OPTIONS, PAPER_SIZE_OPTIONS } from '../constants/uiContent'

interface ExportSectionProps {
  canDownload: boolean
  downloadState: 'idle' | 'pdf' | 'print' | 'markdown'
  marginPreset: MarginPreset
  onMarginPresetChange: (value: MarginPreset) => void
  onMarkdown: () => void
  onPdf: () => void
  onPaperSizeChange: (value: PaperSize) => void
  onPrint: () => void
  paperSize: PaperSize
}

const renderOptions = <T extends string>(items: ReadonlyArray<{ label: string; value: T }>, current: T) => {
  return items.map((item) => <option key={item.value} value={item.value}>{item.label}{item.value === current ? ' (selected)' : ''}</option>)
}

export const ExportSection = ({
  canDownload,
  downloadState,
  marginPreset,
  onMarginPresetChange,
  onMarkdown,
  onPdf,
  onPaperSizeChange,
  onPrint,
  paperSize,
}: ExportSectionProps) => {
  return (
    <section className="section-block">
      <h2 className="section-title">Export</h2>
      <label>Paper Size<select onChange={(event) => onPaperSizeChange(event.target.value as PaperSize)} value={paperSize}>{renderOptions(PAPER_SIZE_OPTIONS, paperSize)}</select></label>
      <label>Margin<select onChange={(event) => onMarginPresetChange(event.target.value as MarginPreset)} value={marginPreset}>{renderOptions(MARGIN_PRESET_OPTIONS, marginPreset)}</select></label>
      <div className="button-row button-row-split">
        <button className={`btn-primary${downloadState === 'pdf' ? ' is-generating' : ''}`} disabled={!canDownload} onClick={onPdf}>{downloadState === 'pdf' ? 'Generating...' : 'Download PDF'}</button>
        <button className={`btn-secondary${downloadState === 'print' ? ' is-generating' : ''}`} disabled={!canDownload} onClick={onPrint}>{downloadState === 'print' ? 'Preparing...' : 'Print PDF'}</button>
      </div>
      <div className="button-row">
        <button className={`btn-muted${downloadState === 'markdown' ? ' is-generating' : ''}`} disabled={!canDownload} onClick={onMarkdown}>{downloadState === 'markdown' ? 'Generating...' : 'Download for LLMs (Markdown)'}</button>
      </div>
    </section>
  )
}
