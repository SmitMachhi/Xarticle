import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import pandaFaceIcon from './assets/panda-face-nobg.png'
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

const APP_NAME = 'Xarticle.co'
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
    question: 'Do you store my links or exports?',
    answer: 'No. Extraction and file generation run in your browser session.',
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
  const [manualMascotIndex, setManualMascotIndex] = useState<number | null>(null)
  const [markdownNotice, setMarkdownNotice] = useState<string | null>(null)
  const [markdownNoticeLeaving, setMarkdownNoticeLeaving] = useState(false)
  const [edgeNudge, setEdgeNudge] = useState(0)
  const edgeNudgeResetTimerRef = useRef<number | null>(null)
  const markdownNoticeHideTimerRef = useRef<number | null>(null)
  const markdownNoticeClearTimerRef = useRef<number | null>(null)

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

  const showMarkdownNotice = (message: string) => {
    setMarkdownNotice(message)
    setMarkdownNoticeLeaving(false)
    if (markdownNoticeHideTimerRef.current !== null) {
      window.clearTimeout(markdownNoticeHideTimerRef.current)
    }
    if (markdownNoticeClearTimerRef.current !== null) {
      window.clearTimeout(markdownNoticeClearTimerRef.current)
    }
    markdownNoticeHideTimerRef.current = window.setTimeout(() => {
      setMarkdownNoticeLeaving(true)
      markdownNoticeHideTimerRef.current = null
    }, 3900)
    markdownNoticeClearTimerRef.current = window.setTimeout(() => {
      setMarkdownNotice(null)
      setMarkdownNoticeLeaving(false)
      markdownNoticeClearTimerRef.current = null
    }, 4300)
  }

  const mascotVariants = [pandaWave, pandaWrench, pandaSeriousGear, pandaWinkHeart] as const
  const defaultMascotIndex = useMemo(() => {
    if (loading) {
      return 1
    }
    if (error) {
      return 2
    }
    if (article) {
      return 3
    }
    return 0
  }, [article, error, loading])

  const mascotIndex = manualMascotIndex ?? defaultMascotIndex
  const mascotSrc = mascotVariants[mascotIndex]

  const cycleMascot = () => {
    setManualMascotIndex((prev) => ((prev ?? defaultMascotIndex) + 1) % mascotVariants.length)
  }

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setManualMascotIndex((prev) => ((prev ?? defaultMascotIndex) + 1) % mascotVariants.length)
    }, 1700)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [defaultMascotIndex, mascotVariants.length])

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return
      }

      const deltaY = event.deltaY
      if (deltaY === 0) {
        return
      }

      const maxScrollY = document.documentElement.scrollHeight - window.innerHeight
      const atTopEdge = window.scrollY <= 0 && deltaY < 0
      const atBottomEdge = window.scrollY >= maxScrollY - 1 && deltaY > 0

      if (!atTopEdge && !atBottomEdge) {
        return
      }

      event.preventDefault()

      const nudgeStrength = Math.min(14, Math.max(3, Math.abs(deltaY) * 0.045))
      setEdgeNudge(atBottomEdge ? -nudgeStrength : nudgeStrength)

      if (edgeNudgeResetTimerRef.current !== null) {
        window.clearTimeout(edgeNudgeResetTimerRef.current)
      }

      edgeNudgeResetTimerRef.current = window.setTimeout(() => {
        setEdgeNudge(0)
        edgeNudgeResetTimerRef.current = null
      }, 150)
    }

    window.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      window.removeEventListener('wheel', handleWheel)
      if (edgeNudgeResetTimerRef.current !== null) {
        window.clearTimeout(edgeNudgeResetTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    return () => {
      if (markdownNoticeHideTimerRef.current !== null) {
        window.clearTimeout(markdownNoticeHideTimerRef.current)
      }
      if (markdownNoticeClearTimerRef.current !== null) {
        window.clearTimeout(markdownNoticeClearTimerRef.current)
      }
    }
  }, [])

  const shellStyle = { '--edge-nudge': `${edgeNudge}px` } as CSSProperties

  const loadArticle = async () => {
    const requestUrl = (urlClassification.normalizedUrl || urlInput).trim()
    if (!requestUrl) {
      return
    }

    setLoading(true)
    setError(null)
    setArticle(null)

    try {
      const result = await extractArticleFromUrl(requestUrl)
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

  const downloadMarkdown = async () => {
    if (!article) {
      return
    }

    setDownloadState('markdown')
    try {
      const result = await downloadArticleMarkdown(article)
      if (result.format === 'zip') {
        const assetSummary = result.assetsIncluded > 0 ? `${result.assetsIncluded} image file(s)` : 'no downloadable image files'
        const failureSummary =
          result.assetsFailed > 0 ? ` ${result.assetsFailed} media file(s) could not be bundled and remain linked online.` : ''
        showMarkdownNotice(`Downloaded offline Markdown ZIP with article.md and ${assetSummary} in assets/.${failureSummary}`)
      }
      triggerCelebrate()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Markdown generation failed.'
      setError(message)
    } finally {
      setDownloadState('idle')
    }
  }

  const pasteFromClipboard = async () => {
    try {
      if (!navigator.clipboard?.readText) {
        throw new Error('Clipboard access is not available in this browser.')
      }
      const text = (await navigator.clipboard.readText()).trim()
      if (!text) {
        throw new Error('Clipboard is empty.')
      }
      setUrlInput(text)
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not read clipboard.'
      setError(message)
    }
  }

  return (
    <div className="site-shell" style={shellStyle}>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <header className="site-header">
        <div className="brand-block">
          <img className="brand-icon" src={pandaFaceIcon} alt="" aria-hidden="true" />
          <div>
            <p className="brand-name">{APP_NAME}</p>
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
          <div className="hero-layout">
            <div className="hero-copy-block">
              <p className="hero-kicker">No login required.</p>
              <h1 className="hero-title">Paste link. Download Article.</h1>
              <p className="hero-copy">Paste one public X link, and get a clean PDF for humans or Markdown for LLMs in seconds.</p>
            </div>

            <div className="hero-mascot-wrap">
              <button
                type="button"
                className={`panda-guide ${loading ? 'is-loading' : ''} ${canDownload ? 'is-ready' : ''} ${celebratePanda ? 'is-celebrating' : ''}`}
                aria-live="polite"
                aria-label="Cycle panda mascot"
                onClick={cycleMascot}
              >
                <span className="sparkle sparkle-a" aria-hidden="true">
                  ✦
                </span>
                <span className="sparkle sparkle-b" aria-hidden="true">
                  ✦
                </span>
                <img className="panda-hero" src={mascotSrc} alt="Panda mascot" />
                <span className="orbit orbit-a" aria-hidden="true" />
                <span className="orbit orbit-b" aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>

        <section className="workbench">
          <section className="controls-panel app-card">
            <section className="section-block">
              <h2 className="section-title">Paste URL</h2>
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
              <div className="mini-action-row">
                <button className="btn-muted btn-clipboard" onClick={pasteFromClipboard}>
                  Paste from Clipboard
                </button>
              </div>
              {urlClassification.kind !== 'empty' ? (
                <p className={`url-status url-status-${urlClassification.kind}`} aria-live="polite">
                  {urlClassification.reason}
                </p>
              ) : null}
            </section>
          </section>

          <aside className="app-card helper-card export-panel">
            <section className="section-block">
              <h2 className="section-title">PDF Export Settings</h2>
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
              <div className="button-row">
                <button className="btn-primary" onClick={downloadPdf} disabled={!canDownload}>
                  {downloadState === 'pdf' ? 'Generating...' : 'Download for Humans (PDF)'}
                </button>
              </div>
            </section>

            <section className="section-block">
              <h2 className="section-title">Markdown Export</h2>
              <div className="button-row">
                <button className="btn-muted" onClick={downloadMarkdown} disabled={!canDownload}>
                  {downloadState === 'markdown' ? 'Generating...' : 'Download for LLMs (Markdown)'}
                </button>
                {markdownNotice ? (
                  <p
                    className={`markdown-notice ${markdownNoticeLeaving ? 'is-leaving' : 'is-entering'}`}
                    role="status"
                    aria-live="polite"
                  >
                    {markdownNotice}
                  </p>
                ) : null}
              </div>
            </section>
          </aside>
        </section>

        <section className="preview-band">
          {error ? <section className="error-box app-card">{error}</section> : null}
          <div className="preview-content app-card">
            <h2>Preview</h2>
            {loading ? (
              <section className="preview-skeleton" aria-label="Loading preview">
                <div className="preview-skeleton-cover" />
                <div className="preview-skeleton-title" />
                <div className="preview-skeleton-meta" />
                <div className="preview-skeleton-metrics" />
                <div className="preview-skeleton-lines" />
              </section>
            ) : article ? (
              <section className="preview-wrap">
                <ArticlePreview
                  article={article}
                  themeMode="color"
                  coverPageMode="always"
                  coverMetaStyle="full"
                />
              </section>
            ) : (
              <section className="empty-state">
                <p>Paste one public X link, then click Load Article.</p>
              </section>
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
        <div className="site-footer-inner">
          <p className="site-footer-brand">
            <img className="site-footer-icon" src={pandaFaceIcon} alt="" aria-hidden="true" />
            <span>{APP_NAME}</span>
          </p>
          <p className="site-footer-credit">
            made with{' '}
            <span role="img" aria-label="heart">
              ❤️
            </span>{' '}
            by{' '}
            <a href="https://x.com/thesmitmachhi" target="_blank" rel="noreferrer">
              Smit
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
