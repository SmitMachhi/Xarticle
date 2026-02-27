import type { MarginPreset } from '../../types/article'

export const COVER_IMAGE_CAPTION = 'cover image'
export const IMAGE_FIT_WIDTH = 500
export const COVER_IMAGE_FIT_HEIGHT = 250
export const BODY_IMAGE_FIT_HEIGHT = 260

export const STATUS_ID_PATTERN = /\/status\/(\d+)/
export const FILENAME_SEGMENT_LIMIT = 42

export const MARGIN_INLINE_NONE = 0
export const MARGIN_SMALL = 4
export const MARGIN_MEDIUM = 8
export const MARGIN_LARGE = 12
export const MARGIN_XLARGE = 14
export const MARGIN_XXLARGE = 16
export const MARGIN_CODE_BLOCK = 10

export const PAGE_MARGIN_LEFT = 24
export const PAGE_MARGIN_BOTTOM = 12
export const FOOTER_FONT_SIZE = 8

export const marginMap: Record<MarginPreset, [number, number, number, number]> = {
  default: [42, 44, 42, 44],
  minimum: [24, 24, 24, 24],
}
