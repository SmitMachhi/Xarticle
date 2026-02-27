import pandaFaceIcon from '../../assets/panda-face-nobg.png'
import { ExportSection } from './components/ExportSection'
import { HeroSection } from './components/HeroSection'
import { InfoSection } from './components/InfoSection'
import { PreviewSection } from './components/PreviewSection'
import { UrlSection } from './components/UrlSection'
import { APP_NAME } from './constants/uiContent'
import { useClipboardPaste } from './hooks/useClipboardPaste'
import { useExportState } from './hooks/useExportState'
import { useExtractionState } from './hooks/useExtractionState'

export const HomePage = () => {
  const extraction = useExtractionState()
  const clipboard = useClipboardPaste()
  const exportState = useExportState(extraction.article, (value) => extraction.setError(value))
  const notice = clipboard.notice || extraction.loadingMessage

  return (
    <div className="site-shell">
      <header className="site-header"><div className="brand-block"><img alt="" aria-hidden="true" className="brand-icon" src={pandaFaceIcon} /><p className="brand-name">{APP_NAME}</p></div></header>
      <main className="content-wrap" id="main-content">
        <HeroSection hasArticle={Boolean(extraction.article)} hasError={Boolean(extraction.error)} loading={extraction.loading} />
        <section className="workbench">
          <section className="controls-panel app-card"><UrlSection canLoad={extraction.canLoad} loadButtonLabel={extraction.loadingMessage || 'Loading...'} loading={extraction.loading} notice={notice} onLoad={() => void extraction.loadArticle()} onPaste={() => void clipboard.pasteFromClipboard(extraction.setUrlInput, (value) => extraction.setError(value))} onUrlChange={(value) => extraction.setUrlInput(value)} urlClassificationReason={extraction.urlClassification.reason} urlInput={extraction.urlInput} urlInputRef={clipboard.inputRef} /></section>
          <aside className="app-card helper-card export-panel"><ExportSection canDownload={exportState.canDownload} downloadState={exportState.downloadState} marginPreset={exportState.marginPreset} onMarginPresetChange={exportState.setMarginPreset} onMarkdown={() => void exportState.downloadMarkdown()} onPaperSizeChange={exportState.setPaperSize} onPdf={() => void exportState.downloadPdf()} paperSize={exportState.paperSize} /></aside>
        </section>
        <PreviewSection article={extraction.article} error={extraction.error} loading={extraction.loading} />
        <InfoSection />
      </main>
    </div>
  )
}
