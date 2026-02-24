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

const APP_NAME = 'X Article Printer'
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
        label: 'WORKING ON IT',
        copy: 'Pulling text blocks and metadata from the link.',
      }
    }
    if (error) {
      return {
        src: pandaSeriousGear,
        label: 'NEED A FIX',
        copy: 'Try a different public URL or use companion extension mode.',
      }
    }
    if (article) {
      return {
        src: pandaWinkHeart,
        label: 'READY TO EXPORT',
        copy: 'Preview looks good. Pick format and download.',
      }
    }
    return {
      src: pandaWave,
      label: 'DROP A LINK',
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
      <div className="pixel-noise" aria-hidden="true" />

      <header className="top-dialog pixel-frame">
        <p className="pixel-title">YOU SEEM A BIT LOST. WANNA EXPORT?</p>
        <div className="dialog-options">
          <span className="dialog-option-active">&gt; YES PLEASE</span>
          <span>NO</span>
        </div>
      </header>

      <main className="content-wrap">
        <section className="hero-shell pixel-frame">
          <h1 className="pixel-heading">{APP_NAME}</h1>
          <p className="hero-copy">Convert public X posts and long-form articles into printable docs, fast.</p>

          <div className="hero-grid">
            <section className="controls-panel">
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
                  <select value={coverMetaStyle} onChange={(event) => setCoverMetaStyle(event.target.value as CoverMetaStyle)}>
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

              <p className="helper-line">Public links only. Companion extension improves reliability across browsers.</p>
            </section>

            <aside className="mascot-panel pixel-frame">
              <img src={mascotState.src} alt="Robot panda mascot" />
              <p className="pixel-subtitle">{mascotState.label}</p>
              <p>{mascotState.copy}</p>
            </aside>
          </div>
        </section>

        <section className="preview-band">
          <div className="preview-content">
            {error ? <section className="error-box pixel-frame">{error}</section> : null}
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
              <section className="empty-state pixel-frame">Paste a link and click &quot;Load Article&quot; to preview.</section>
            )}
          </div>
        </section>

        <section className="info-grid">
          <article className="info-card pixel-frame" id="how-it-works">
            <h2 className="pixel-subtitle">HOW IT WORKS</h2>
            <ul className="how-list">
              {HOW_IT_WORKS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </article>

          <article className="info-card pixel-frame" id="faq">
            <h2 className="pixel-subtitle">FAQ</h2>
            <div className="faq-list">
              {FAQ_ITEMS.map((item) => (
                <details key={item.question}>
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </article>
        </section>
      </main>

      <footer className="grass-footer">
        <p>{APP_NAME} | Pixel mode</p>
      </footer>
    </div>
  )
}

export default App
