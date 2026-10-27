import type { MarginPreset, PaperSize } from '../../../types/article'

export const APP_NAME = 'Xarticle.co'
export const HERO_TITLE = 'Turn one URL into clean exports.'
export const URL_PLACEHOLDER = 'Paste an X post or article link'
export const FOOTER_CREDIT_LABEL = 'Made with ❤️ by'
export const FOOTER_CREDIT_NAME = '@thesmitmachhi'
export const FOOTER_CREDIT_URL = 'https://x.com/thesmitmachhi'

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
  { value: 'default', label: 'Normal margins' },
  { value: 'minimum', label: 'Narrow margins' },
]
