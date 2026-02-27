import { useMemo, useState } from 'react'

import { extractArticleFromUrl } from '../../../lib/extractArticle'
import { classifyInputUrl } from '../../../lib/xUrl'
import type { ExtractedArticle } from '../../../types/article'

interface ExtractionState {
  article: ExtractedArticle | null
  canLoad: boolean
  error: string | null
  loading: boolean
  setError: (value: string | null) => void
  setUrlInput: (value: string) => void
  urlClassification: ReturnType<typeof classifyInputUrl>
  urlInput: string
  loadArticle: () => Promise<void>
}

const resolveRequestUrl = (value: string, normalizedUrl?: string): string => (normalizedUrl || value).trim()

export const useExtractionState = (): ExtractionState => {
  const [article, setArticle] = useState<ExtractedArticle | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const urlClassification = useMemo(() => classifyInputUrl(urlInput), [urlInput])
  const canLoad = !loading && (urlClassification.kind === 'status' || urlClassification.kind === 'article')

  const loadArticle = async (): Promise<void> => {
    const requestUrl = resolveRequestUrl(urlInput, urlClassification.normalizedUrl)
    if (!requestUrl) {
      return
    }
    setLoading(true)
    setError(null)
    setArticle(null)
    try {
      const result = await extractArticleFromUrl(requestUrl)
      setArticle(result.article)
    } catch (errorValue) {
      const message = errorValue instanceof Error ? errorValue.message : 'Unknown extraction error.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return { article, canLoad, error, loading, setError, setUrlInput, urlClassification, urlInput, loadArticle }
}
