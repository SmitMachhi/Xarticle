import { useMemo, useState } from 'react'

import { extractArticleFromUrl, type ExtractionProgressStage } from '../../../lib/extractArticle'
import { classifyInputUrl } from '../../../lib/xUrl'
import type { ExtractedArticle } from '../../../types/article'

type LoadingStage = ExtractionProgressStage | 'idle' | 'validating'

interface ExtractionState {
  article: ExtractedArticle | null
  canLoad: boolean
  error: string | null
  loading: boolean
  loadingMessage: string | null
  setError: (value: string | null) => void
  setUrlInput: (value: string) => void
  urlClassification: ReturnType<typeof classifyInputUrl>
  urlInput: string
  loadArticle: () => Promise<void>
}

const resolveRequestUrl = (value: string, normalizedUrl?: string): string => (normalizedUrl || value).trim()
const LOADING_MESSAGE_BY_STAGE: Record<LoadingStage, string | null> = {
  idle: null,
  validating: 'Validating URL...',
  fetching: 'Fetching article data...',
  parsing: 'Building article preview...',
}

export const useExtractionState = (): ExtractionState => {
  const [article, setArticle] = useState<ExtractedArticle | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadingStage, setLoadingStage] = useState<LoadingStage>('idle')
  const [urlInput, setUrlInput] = useState('')
  const urlClassification = useMemo(() => classifyInputUrl(urlInput), [urlInput])
  const loading = loadingStage !== 'idle'
  const loadingMessage = LOADING_MESSAGE_BY_STAGE[loadingStage]
  const canLoad = !loading && (urlClassification.kind === 'status' || urlClassification.kind === 'article')

  const loadArticle = async (): Promise<void> => {
    setLoadingStage('validating')
    setError(null)
    setArticle(null)
    const requestUrl = resolveRequestUrl(urlInput, urlClassification.normalizedUrl)
    if (!requestUrl) {
      setLoadingStage('idle')
      return
    }
    try {
      const result = await extractArticleFromUrl(requestUrl, {
        onStage: (stage: ExtractionProgressStage) => setLoadingStage(stage),
      })
      setArticle(result.article)
    } catch (errorValue) {
      const message = errorValue instanceof Error ? errorValue.message : 'Unknown extraction error.'
      setError(message)
    } finally {
      setLoadingStage('idle')
    }
  }

  return { article, canLoad, error, loading, loadingMessage, setError, setUrlInput, urlClassification, urlInput, loadArticle }
}
