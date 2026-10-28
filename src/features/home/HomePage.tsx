import { useMemo } from 'react'

import { toPlainTextPayload } from '../article-preview/utils/text'
import { CreditFooter } from './components/CreditFooter'
import { ExportSection } from './components/ExportSection'
import { HeroSection } from './components/HeroSection'
import { PreviewSection } from './components/PreviewSection'
import { TopBar } from './components/TopBar'
import { UrlSection } from './components/UrlSection'
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
    <div className="relative flex min-h-dvh flex-col">
      <main className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 pb-12 sm:px-6" id="main-content">
        <TopBar />
        <HeroSection centered={!article && !loading}>
          <UrlSection canLoad={extraction.canLoad} error={article ? null : error} loading={loading} loadingLabel={extraction.loadingMessage} notice={clipboard.notice} onLoad={() => void extraction.loadArticle()} onPaste={() => void clipboard.pasteFromClipboard(extraction.setUrlInput, (value) => extraction.setError(value))} onUrlChange={(value) => extraction.setUrlInput(value)} urlInput={extraction.urlInput} urlInputRef={clipboard.inputRef} urlProblem={urlProblem} />
        </HeroSection>
        {article ? <ExportSection canDownload={exportState.canDownload} copyPayload={copyPayload} downloadState={exportState.downloadState} error={error} onPdf={() => void exportState.downloadPdf()} onPrint={() => void exportState.printPdf()} /> : null}
        <PreviewSection article={article} loading={loading} />
      </main>
      <CreditFooter />
    </div>
  )
}
