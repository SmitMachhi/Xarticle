import type { ArticleBlock } from './articleBlock'
import type { ExtractionMode, ExtractionProvider } from './extraction'
import type { MetricKey } from './metricKey'
import type { ProviderAttempt } from './providerAttempt'

export interface ExtractedArticle {
  sourceUrl: string
  canonicalUrl: string
  title: string
  authorName: string
  authorHandle: string
  authorAvatarUrl?: string
  publishedAt?: string
  metrics: Record<MetricKey, number | null>
  metricNotes?: Partial<Record<MetricKey, string>>
  blocks: ArticleBlock[]
  warnings: string[]
  extractedAt: string
  mode: ExtractionMode
  providerUsed: ExtractionProvider
  providerAttempts: ProviderAttempt[]
}
