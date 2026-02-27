export type MetricKey = 'likes' | 'replies' | 'reposts' | 'views' | 'bookmarks'

export type ArticleBlock =
  | {
      type: 'heading'
      text: string
      level: 1 | 2 | 3
    }
  | {
      type: 'paragraph'
      text: string
    }
  | {
      type: 'quote'
      text: string
    }
  | {
      type: 'code'
      code: string
      language?: string
    }
  | {
      type: 'list'
      items: string[]
    }
  | {
      type: 'media'
      mediaType: 'image' | 'video-thumbnail'
      url: string
      caption?: string
    }
  | {
      type: 'embed'
      text: string
      url?: string
    }

export type ExtractionMode = 'companion' | 'fallback'
export type ExtractionProvider = 'threadloom' | 'companion' | 'jina'

export interface ProviderAttempt {
  provider: ExtractionProvider
  ok: boolean
  message: string
}

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

export interface ExtractRequestResult {
  article: ExtractedArticle
}

export type PaperSize = 'A4' | 'LETTER'
export type MarginPreset = 'default' | 'minimum'
export type ThemeMode = 'color' | 'bw'
export type CoverPageMode = 'always' | 'off'
export type CoverMetaStyle = 'full' | 'minimal'
