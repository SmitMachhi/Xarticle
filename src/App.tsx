import { useEffect, useMemo, useState } from 'react'
import pandaSeriousGear from './assets/panda_pose_serious_gear.png'
import pandaWave from './assets/panda_pose_wave.png'
import pandaWinkHeart from './assets/panda_pose_wink_heart.png'
import pandaWrench from './assets/panda_pose_wrench.png'
import { ArticlePreview } from './components/ArticlePreview'
import { extractArticleFromUrl } from './lib/extractArticle'
import { downloadArticleMarkdown } from './lib/markdownExport'
import { downloadArticlePdf } from './lib/pdfExport'
import { classifyInputUrl } from './lib/xUrl'
import type { CoverMetaStyle, CoverPageMode, ExtractedArticle, MarginPreset, PaperSize, ThemeMode } from './types/article'

const APP_NAME = 'Xarticle.app'
const APP_TAGLINE = 'Calm exports for public X articles and statuses.'
const HOW_IT_WORKS = [
  'Paste one public X status URL or long-form article URL.',
  'Preview the extracted content in your browser.',
  'Download Color PDF, B/W PDF, or Markdown instantly.',
]

const FAQ_ITEMS = [
  {
    question: 'Does this support private or locked X accounts?',
    answer: 'No. This app works only for public X/Twitter pages.',
  },
  {
    question: 'Can I use this without creating an account?',
    answer: 'Yes. No login is required.',
  },
  {
    question: 'Why is there a companion extension option?',
    answer: 'Some X pages block direct fetches. The extension improves extraction reliability.',
  },
  {
    question: 'What export formats are available?',
    answer: 'Color PDF, B/W PDF, and Markdown are supported.',
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

  const mascotState = useMemo(() => {
    if (loading) {
      return {
        src: pandaWrench,
        label: 'Working on it',
        copy: 'Pulling text blocks and metadata from the link.',
      }
    }
    if (error) {
      return {
        src: pandaSeriousGear,
        label: 'Need a fix',
        copy: 'Try a different public URL or use companion extension mode.',
      }
    }
    if (article) {
      return {
        src: pandaWinkHeart,
        label: 'Ready to export',
        copy: 'Preview looks good. Pick format and download.',
      }
    }
    return {
      src: pandaWave,
      label: 'Drop a link',
      copy: 'Paste any public X post or article to begin.',
    }
  }, [article, error, loading])

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
      <header className="site-header">
        <div className="brand-block">
          <span className="brand-dot" aria-hidden="true" />
          <div>
            <p className="brand-name">{APP_NAME}</p>
            <p className="brand-sub">{APP_TAGLINE}</p>
          </div>
        </div>
        <div className="header-actions">
          <nav className="top-nav">
            <a href="#how-it-works">How it works</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="panda-powered">
            <img src={pandaWave} alt="" />
            <span>Powered by Panda</span>
          </div>
        </div>
      </header>

      <main className="content-wrap">
        <section className="hero-shell">
          <p className="hero-kicker">No login. No backend. No clutter.</p>
          <h1 className="hero-title">Paste one X link. Export a clean, print-ready file.</h1>
          <p className="hero-copy">
            Built for speed and clarity. Works with public X posts and long-form article URLs in modern browsers, with a
            friendly panda helper guiding each step.
          </p>
        </section>

        <section className="workbench">
          <section className="controls-panel app-card">
            <section className="section-block">
              <h2 className="section-title">1. Paste URL</h2>
              <label htmlFor="url">X URL</label>
              <div className="row">
                <input
                  id="url"
                  type="text"
                  placeholder="https://x.com/<handle>/status/... or /i/articles/..."
                  value={urlInput}
                  onChange={(event) => setUrlInput(event.target.value)}
                />
                <button className="btn-primary" onClick={loadArticle} disabled={!canLoad}>
                  {loading ? 'Loading...' : 'Load Article'}
                </button>
              </div>
              <p className={`url-status url-status-${urlClassification.kind}`}>{urlClassification.reason}</p>
            </section>

            <section className="section-block">
              <h2 className="section-title">2. Export settings</h2>
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
                  <select value={coverMetaStyle} onChange={(event) => setCoverMetaStyle(event.target.value as CoverMetaStyle)}>
                    <option value="full">Full</option>
                    <option value="minimal">Minimal</option>
                  </select>
                </label>
              </div>
            </section>

            <section className="section-block">
              <h2 className="section-title">3. Download</h2>
              <div className="button-row">
                <button className="btn-primary" onClick={() => downloadPdf('color')} disabled={!canDownload}>
                  {downloadState === 'color' ? 'Generating...' : 'Download Color PDF'}
                </button>
                <button className="btn-muted" onClick={() => downloadPdf('bw')} disabled={!canDownload}>
                  {downloadState === 'bw' ? 'Generating...' : 'Download B/W PDF'}
                </button>
                <button className="btn-muted" onClick={downloadMarkdown} disabled={!canDownload}>
                  {downloadState === 'markdown' ? 'Generating...' : 'Download Markdown'}
                </button>
              </div>
              <p className="helper-line">Public links only. Companion extension mode improves extraction reliability.</p>
            </section>
          </section>

          <aside className="app-card helper-card" id="how-it-works">
            <div className="panda-guide" aria-live="polite">
              <img src={mascotState.src} alt="Panda assistant" />
              <div>
                <p className="panda-guide-title">Panda assistant</p>
                <p className="panda-guide-status">{mascotState.label}</p>
                <p className="panda-guide-copy">{mascotState.copy}</p>
              </div>
            </div>
            <h2>How it works</h2>
            <ul className="how-list">
              {HOW_IT_WORKS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </aside>
        </section>

        <section className="preview-band">
          {error ? <section className="error-box app-card">{error}</section> : null}
          <div className="preview-content app-card">
            <h2>Preview</h2>
            {article ? (
              <section className="preview-wrap">
                <ArticlePreview
                  article={article}
                  themeMode={previewTheme}
                  coverPageMode={coverPageMode}
                  coverMetaStyle={coverMetaStyle}
                />
              </section>
            ) : (
              <section className="empty-state">Paste a link and click &quot;Load Article&quot; to preview.</section>
            )}
          </div>
        </section>

        <section className="info-grid">
          <article className="app-card info-card" id="faq">
            <h2>FAQ</h2>
            <div className="faq-list">
              {FAQ_ITEMS.map((item) => (
                <details key={item.question}>
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </article>

          <article className="app-card info-card">
            <h2>Why people use this</h2>
            <ul className="how-list">
              <li>No account setup.</li>
              <li>Works fully client-side in browser.</li>
              <li>Keeps selectable text for print and LLM workflows.</li>
            </ul>
          </article>
        </section>
      </main>

      <footer className="site-footer">
        <p>{APP_NAME} • simple export utility</p>
      </footer>
    </div>
  )
}

export default App
