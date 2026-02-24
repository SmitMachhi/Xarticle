import { useEffect, useMemo, useState } from 'react'
import { ArticlePreview } from './components/ArticlePreview'
import { extractArticleFromUrl } from './lib/extractArticle'
import { downloadArticleMarkdown } from './lib/markdownExport'
import { downloadArticlePdf } from './lib/pdfExport'
import { classifyInputUrl } from './lib/xUrl'
import type { CoverMetaStyle, CoverPageMode, ExtractedArticle, MarginPreset, PaperSize, ThemeMode } from './types/article'

const APP_NAME = 'X Article Printer'
const HOW_IT_WORKS = [
  'Paste one public X status URL or long-form article URL.',
  'Load and preview the extracted content in your browser.',
  'Export Color PDF, B/W PDF, or Markdown instantly.',
]

const FAQ_ITEMS = [
  {
    question: 'Does this support private or locked X accounts?',
    answer: 'No. This app is designed for public X/Twitter pages only.',
  },
  {
    question: 'Can I use this without creating an account?',
    answer: 'Yes. No login is required and extraction runs client-side.',
  },
  {
    question: 'Why is there a companion extension option?',
    answer: 'Some X pages block cross-origin fetches. The extension improves reliability by fetching page HTML from browser context.',
  },
  {
    question: 'What export formats are available?',
    answer: 'You can export Color PDF, B/W PDF, and Markdown.',
  },
  {
    question: 'Will this work for long X article URLs too?',
    answer: 'Yes. Both status links and /i/articles links are supported.',
  },
]

function App() {
  const [urlInput, setUrlInput] = useState('')
  const [paperSize, setPaperSize] = useState<PaperSize>('A4')
  const [marginPreset, setMarginPreset] = useState<MarginPreset>('default')
  const [previewTheme, setPreviewTheme] = useState<ThemeMode>('color')
  const [coverPageMode, setCoverPageMode] = useState<CoverPageMode>('always')
  const [coverMetaStyle, setCoverMetaStyle] = useState<CoverMetaStyle>('full')
  const [article, setArticle] = useState<ExtractedArticle | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloadState, setDownloadState] = useState<'idle' | 'color' | 'bw' | 'markdown'>('idle')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const fromQuery = params.get('url')
    if (fromQuery) {
      setUrlInput(fromQuery)
    }
  }, [])

  const canDownload = useMemo(() => Boolean(article) && downloadState === 'idle', [article, downloadState])
  const urlClassification = useMemo(() => classifyInputUrl(urlInput), [urlInput])
  const canLoad = !loading && (urlClassification.kind === 'status' || urlClassification.kind === 'article')

  const loadArticle = async () => {
    setLoading(true)
    setError(null)
    setArticle(null)

    try {
      const result = await extractArticleFromUrl(urlClassification.normalizedUrl || urlInput)
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
        coverPageMode,
        coverMetaStyle,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'PDF generation failed.'
      setError(message)
    } finally {
      setDownloadState('idle')
    }
  }

  const downloadMarkdown = () => {
    if (!article) {
      return
    }

    setDownloadState('markdown')
    try {
      downloadArticleMarkdown(article)
    } finally {
      setDownloadState('idle')
    }
  }

  return (
    <div className="site-shell">
      <div className="announcement-bar">
        <p>
          Free + open source. Export X/Twitter content into printable docs in under a minute.
        </p>
      </div>

      <header className="site-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            *
          </span>
          <div>
            <strong>{APP_NAME}</strong>
            <small>for public X links</small>
          </div>
        </div>
        <nav className="site-nav" aria-label="primary">
          <a href="#how-it-works">How it works</a>
          <a href="#faq">FAQ</a>
          <a href="#faq">Support</a>
        </nav>
      </header>

      <main>
        <section className="hero">
          <p className="hero-badge">we&apos;re open source / no backend required</p>
          <h1>Export X posts and articles to print-ready PDFs</h1>
          <p className="hero-subtitle">
            Paste one public link, preview the result, then download clean documents in the format you need.
          </p>

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
              <button onClick={loadArticle} disabled={!canLoad}>
                {loading ? 'Loading...' : 'Load Article'}
              </button>
            </div>
            <p className={`url-status url-status-${urlClassification.kind}`}>{urlClassification.reason}</p>

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

              <label>
                Cover Page
                <select value={coverPageMode} onChange={(event) => setCoverPageMode(event.target.value as CoverPageMode)}>
                  <option value="always">Always On</option>
                  <option value="off">Off</option>
                </select>
              </label>

              <label>
                Cover Meta
                <select
                  value={coverMetaStyle}
                  onChange={(event) => setCoverMetaStyle(event.target.value as CoverMetaStyle)}
                >
                  <option value="full">Full</option>
                  <option value="minimal">Minimal</option>
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
              <button onClick={downloadMarkdown} disabled={!canDownload}>
                {downloadState === 'markdown' ? 'Generating...' : 'Download Markdown'}
              </button>
            </div>

            <p className="helper-line">
              Supports X status and long-form article links. For best reliability across browsers, install the companion
              extension.
            </p>
          </section>
        </section>

        <section className="stage-band">
          <div className="stage-content">
            {error ? <section className="error-box">{error}</section> : null}
            {article ? (
              <section className="preview-wrap">
                <ArticlePreview article={article} themeMode={previewTheme} />
              </section>
            ) : (
              <section className="empty-state">Paste a link and click &quot;Load Article&quot; to preview.</section>
            )}
          </div>
        </section>

        <section id="how-it-works" className="how-section">
          <h2>How it works</h2>
          <ul className="how-list">
            {HOW_IT_WORKS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
          <p className="simple-line">It&apos;s that simple.</p>
          <div className="mascot-block" aria-hidden="true">
            <div className="mascot-face">
              <span />
              <span />
            </div>
          </div>
        </section>

        <section id="faq" className="faq-section">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-list">
            {FAQ_ITEMS.map((item) => (
              <details key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div>
          <strong>{APP_NAME}</strong>
          <p>Open-source utility for printing public X content.</p>
        </div>
        <p>Built for fast exports and clean documents.</p>
      </footer>
    </div>
  )
}

export default App
