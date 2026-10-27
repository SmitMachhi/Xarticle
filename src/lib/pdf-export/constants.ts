import type { MarginPreset } from '../../types/article'
import type { ImageLimits } from './image/sizing'

export const COVER_IMAGE_CAPTION = 'cover image'
// Target area ~ a 380x285pt (4:3) image; caps keep wide shots inside the column and tall phone shots off a full page.
export const BODY_IMAGE_LIMITS: ImageLimits = { area: 108_300, maxWidth: 460, maxHeight: 380 }
export const COVER_IMAGE_LIMITS: ImageLimits = { area: 140_000, maxWidth: 500, maxHeight: 300 }

export const STATUS_ID_PATTERN = /\/status\/(\d+)/
export const FILENAME_SEGMENT_LIMIT = 42

export const MARGIN_INLINE_NONE = 0
export const MARGIN_SMALL = 4
export const MARGIN_MEDIUM = 8
export const MARGIN_LARGE = 12
export const MARGIN_XLARGE = 14
export const MARGIN_XXLARGE = 16
export const MARGIN_CODE_BLOCK = 10

export const QUOTE_BAR_WIDTH = 2.5
export const QUOTE_PADDING_LEFT = 10
export const DIVIDER_LINE_WIDTH = 0.75
export const VIDEO_LINK_LABEL = 'Watch video'
export const DATE_FORMAT: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }
export const DATE_LOCALE = 'en-US'

export const PAGE_MARGIN_LEFT = 24
export const PAGE_MARGIN_BOTTOM = 12
export const FOOTER_FONT_SIZE = 8

export const marginMap: Record<MarginPreset, [number, number, number, number]> = {
  default: [42, 44, 42, 44],
  minimum: [24, 24, 24, 24],
}
