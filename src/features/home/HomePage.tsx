import { useMemo } from 'react'

import pandaFaceIcon from '../../assets/panda-face-nobg.png'
import { toPlainTextPayload } from '../article-preview/utils/text'
import { ExportSection } from './components/ExportSection'
import { FooterSection } from './components/FooterSection'
import { HeroSection } from './components/HeroSection'
import { InfoSection } from './components/InfoSection'
import { PreviewSection } from './components/PreviewSection'
import { UrlSection } from './components/UrlSection'
import { APP_NAME } from './constants/uiContent'
import { useClipboardPaste } from './hooks/useClipboardPaste'
import { useExportState } from './hooks/useExportState'
import { useExtractionState } from './hooks/useExtractionState'

const PROBLEM_KINDS = new Set(['invalid', 'unsupported'])

export const HomePage = () => {
  const extraction = useExtractionState()
  const clipboard = useClipboardPaste()
  const exportState = useExportState(extraction.article, (value) => extraction.setError(value))
  const { article, error, loading } = extraction
  const urlProblem = PROBLEM_KINDS.has(extraction.urlClassification.kind) ? extraction.urlClassification.reason : null
  const copyPayload = useMemo(() => (article ? toPlainTextPayload(article.blocks) : ''), [article])

  return (
    <div className="site-shell">
      <main className="page" id="main-content">
        <header className="brand"><img alt="" aria-hidden="true" src={pandaFaceIcon} />{APP_NAME}</header>
        <HeroSection hasArticle={Boolean(article)} hasError={Boolean(error)} loading={loading}>
          <UrlSection canLoad={extraction.canLoad} error={article ? null : error} loading={loading} loadingLabel={extraction.loadingMessage} notice={clipboard.notice} onLoad={() => void extraction.loadArticle()} onPaste={() => void clipboard.pasteFromClipboard(extraction.setUrlInput, (value) => extraction.setError(value))} onUrlChange={(value) => extraction.setUrlInput(value)} urlInput={extraction.urlInput} urlInputRef={clipboard.inputRef} urlProblem={urlProblem} />
        </HeroSection>
        {article ? <ExportSection canDownload={exportState.canDownload} copyPayload={copyPayload} downloadState={exportState.downloadState} error={error} marginPreset={exportState.marginPreset} onMarginPresetChange={exportState.setMarginPreset} onMarkdown={() => void exportState.downloadMarkdown()} onPaperSizeChange={exportState.setPaperSize} onPdf={() => void exportState.downloadPdf()} onPrint={() => void exportState.printPdf()} paperSize={exportState.paperSize} /> : null}
        <PreviewSection article={article} loading={loading} />
        <InfoSection />
      </main>
      <FooterSection />
    </div>
  )
}
