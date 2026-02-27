import type { ExtractionProvider } from './extraction'

export interface ProviderAttempt {
  provider: ExtractionProvider
  ok: boolean
  message: string
}
