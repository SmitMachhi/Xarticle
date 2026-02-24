import { useEffect, useMemo, useState } from 'react'
import { ArticlePreview } from './components/ArticlePreview'
import { extractArticleFromUrl } from './lib/extractArticle'
import { downloadArticlePdf } from './lib/pdfExport'
import type { ExtractedArticle, MarginPreset, PaperSize, ThemeMode } from './types/article'

const APP_NAME = 'X Article Printer'

function App() {
  const [urlInput, setUrlInput] = useState('')
  const [paperSize, setPaperSize] = useState<PaperSize>('A4')
  const [marginPreset, setMarginPreset] = useState<MarginPreset>('default')
  const [previewTheme, setPreviewTheme] = useState<ThemeMode>('color')
  const [article, setArticle] = useState<ExtractedArticle | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloadState, setDownloadState] = useState<'idle' | 'color' | 'bw'>('idle')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const fromQuery = params.get('url')
    if (fromQuery) {
      setUrlInput(fromQuery)
    }
  }, [])

  const canDownload = useMemo(() => Boolean(article) && downloadState === 'idle', [article, downloadState])

  const loadArticle = async () => {
    setLoading(true)
    setError(null)
    setArticle(null)

    try {
      const result = await extractArticleFromUrl(urlInput)
      setArticle(result.article)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown extraction error.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const downloadPdf = async (themeMode: ThemeMode) => {
    if (!article) {
      return
    }

    setDownloadState(themeMode)
    try {
      await downloadArticlePdf(article, {
        paperSize,
        marginPreset,
        themeMode,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'PDF generation failed.'
      setError(message)
    } finally {
      setDownloadState('idle')
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>{APP_NAME}</h1>
          <p>No login. Paste a public X article link and export print-ready PDFs.</p>
        </div>
      </header>

      <section className="controls">
        <label htmlFor="url">X Article URL</label>
        <div className="row">
          <input
            id="url"
            type="text"
            placeholder="https://x.com/<handle>/status/... or /i/articles/..."
            value={urlInput}
            onChange={(event) => setUrlInput(event.target.value)}
          />
          <button onClick={loadArticle} disabled={loading || urlInput.trim().length === 0}>
            {loading ? 'Loading...' : 'Load Article'}
          </button>
        </div>

        <div className="option-grid">
          <label>
            Paper
            <select value={paperSize} onChange={(event) => setPaperSize(event.target.value as PaperSize)}>
              <option value="A4">A4</option>
              <option value="LETTER">Letter</option>
            </select>
          </label>

          <label>
            Margin
            <select value={marginPreset} onChange={(event) => setMarginPreset(event.target.value as MarginPreset)}>
              <option value="default">Default</option>
              <option value="minimum">Minimum</option>
            </select>
          </label>

          <label>
            Preview
            <select value={previewTheme} onChange={(event) => setPreviewTheme(event.target.value as ThemeMode)}>
              <option value="color">Color</option>
              <option value="bw">B/W</option>
            </select>
          </label>
        </div>

        <div className="button-row">
          <button onClick={() => downloadPdf('color')} disabled={!canDownload}>
            {downloadState === 'color' ? 'Generating...' : 'Download Color PDF'}
          </button>
          <button onClick={() => downloadPdf('bw')} disabled={!canDownload}>
            {downloadState === 'bw' ? 'Generating...' : 'Download B/W PDF'}
          </button>
        </div>

        <p className="helper-line">
          Supports X status and long-form article links. For best reliability across browsers, install the companion extension.
        </p>
      </section>

      {error ? <section className="error-box">{error}</section> : null}

      {article ? (
        <section className="preview-wrap">
          <ArticlePreview article={article} themeMode={previewTheme} />
        </section>
      ) : (
        <section className="empty-state">Paste a link and click "Load Article" to preview.</section>
      )}
    </div>
  )
}

export default App
