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
import type { ExtractedArticle, MarginPreset, PaperSize } from './types/article'

const APP_NAME = 'Xarticle.app'
const APP_TAGLINE = 'Fast exports for public X articles and statuses.'
const HOW_IT_WORKS = [
  'Paste one public X status URL or long-form article URL.',
  'Preview the extracted content in your browser.',
  'Download PDF for people or Markdown for LLM workflows.',
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
    answer: 'PDF and Markdown are supported.',
  },
]

function App() {
  const [urlInput, setUrlInput] = useState('')
  const [paperSize, setPaperSize] = useState<PaperSize>('A4')
  const [marginPreset, setMarginPreset] = useState<MarginPreset>('default')
  const [article, setArticle] = useState<ExtractedArticle | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloadState, setDownloadState] = useState<'idle' | 'pdf' | 'markdown'>('idle')
  const [celebratePanda, setCelebratePanda] = useState(false)

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

  const triggerCelebrate = () => {
    setCelebratePanda(true)
    window.setTimeout(() => setCelebratePanda(false), 900)
  }

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

  const downloadPdf = async () => {
    if (!article) {
      return
    }

    setDownloadState('pdf')
    try {
      await downloadArticlePdf(article, {
        paperSize,
        marginPreset,
        themeMode: 'color',
        coverPageMode: 'always',
        coverMetaStyle: 'full',
      })
      triggerCelebrate()
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
      triggerCelebrate()
    } finally {
      setDownloadState('idle')
    }
  }

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
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
        </div>
      </header>

      <main className="content-wrap" id="main-content">
        <section className="hero-shell">
          <p className="hero-kicker">No login required.</p>
          <h1 className="hero-title">Paste one X link. Export instantly.</h1>
          <p className="hero-copy">
            Built for speed and clarity. Works with public X posts and long-form article URLs in modern browsers.
          </p>
        </section>

        <section className="workbench">
          <section className="controls-panel app-card">
            <section className="section-block">
              <h2 className="section-title">Paste URL</h2>
              <p className="section-subtitle">Works with public status links and long-form article links.</p>
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
              <p className={`url-status url-status-${urlClassification.kind}`} aria-live="polite">
                {urlClassification.reason}
              </p>
            </section>
          </section>

          <aside className="app-card helper-card export-panel">
            <div
              className={`panda-guide ${loading ? 'is-loading' : ''} ${canDownload ? 'is-ready' : ''} ${celebratePanda ? 'is-celebrating' : ''}`}
              aria-live="polite"
            >
              <span className="sparkle sparkle-a" aria-hidden="true">
                ✦
              </span>
              <span className="sparkle sparkle-b" aria-hidden="true">
                ✦
              </span>
              <div className="panda-avatar-wrap">
                <img src={mascotState.src} alt="Panda assistant" />
              </div>
              <div>
                <p className="panda-guide-title">Panda assistant</p>
                <p key={mascotState.label} className="panda-guide-status text-swap">
                  {mascotState.label}
                </p>
                <p key={mascotState.copy} className="panda-guide-copy text-swap">
                  {mascotState.copy}
                </p>
              </div>
            </div>

            <section className="section-block">
              <h2 className="section-title">Export Settings</h2>
              <div className="option-grid">
                <label>
                  Paper Size
                  <span className="select-shell">
                    <select value={paperSize} onChange={(event) => setPaperSize(event.target.value as PaperSize)}>
                      <option value="A4">A4</option>
                      <option value="LETTER">Letter</option>
                    </select>
                  </span>
                </label>

                <label>
                  Margin
                  <span className="select-shell">
                    <select value={marginPreset} onChange={(event) => setMarginPreset(event.target.value as MarginPreset)}>
                      <option value="default">Default</option>
                      <option value="minimum">Minimum</option>
                    </select>
                  </span>
                </label>
              </div>
            </section>

            <section className="section-block">
              <h2 className="section-title section-title-with-dot">
                Download
                <span className={`live-dot ${canDownload ? 'is-ready' : ''}`} aria-hidden="true" />
              </h2>
              <div className="button-row">
                <button className="btn-primary" onClick={downloadPdf} disabled={!canDownload}>
                  {downloadState === 'pdf' ? 'Generating...' : 'Download for Humans (PDF)'}
                </button>
                <button className="btn-muted" onClick={downloadMarkdown} disabled={!canDownload}>
                  {downloadState === 'markdown' ? 'Generating...' : 'Download for LLMs (Markdown)'}
                </button>
              </div>
            </section>
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
                  themeMode="color"
                  coverPageMode="always"
                  coverMetaStyle="full"
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

          <article className="app-card info-card" id="how-it-works">
            <h2>How it works</h2>
            <ul className="how-list">
              {HOW_IT_WORKS.map((step) => (
                <li key={step}>{step}</li>
              ))}
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
