import type { MarginPreset, PaperSize } from '../../../types/article'

export const APP_NAME = 'Xarticle.co'
export const HERO_TITLE = 'Turn one URL into clean exports.'
export const HERO_IDLE_LABEL = 'Drop Link'
export const HERO_IDLE_COPY = 'Paste a public X status or article URL to start.'
export const HERO_WORKING_LABEL = 'Working'
export const HERO_WORKING_COPY = 'Fetching and parsing the article now...'
export const FOOTER_CREDIT_LABEL = 'Made with ❤️ by'
export const FOOTER_CREDIT_NAME = '@thesmitmachhi'
export const FOOTER_CREDIT_URL = 'https://x.com/thesmitmachhi'

export const HOW_IT_WORKS = [
  'Paste one public X Article link.',
  'Preview extracted content in your browser.',
  'Download PDF for humans or Markdown for LLMs.',
] as const

export const FAQ_ITEMS = [
  {
    question: 'Does this support private or locked X accounts?',
    answer: 'No. This app works only for public X/Twitter pages.',
  },
  {
    question: 'Can I use this without creating an account?',
    answer: 'Yes. No login is required.',
  },
] as const

export const PAPER_SIZE_OPTIONS: ReadonlyArray<{ value: PaperSize; label: string }> = [
  { value: 'A4', label: 'A4' },
  { value: 'LETTER', label: 'Letter' },
]

export const MARGIN_PRESET_OPTIONS: ReadonlyArray<{ value: MarginPreset; label: string }> = [
  { value: 'default', label: 'Default' },
  { value: 'minimum', label: 'Minimum' },
]
