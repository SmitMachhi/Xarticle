import type { MarginPreset } from '../../types/article'
import type { ImageLimits } from './image/sizing'

export const COVER_IMAGE_CAPTION = 'cover image'
// Compact print layout: every image (cover included) targets the area of a ~280x210pt 4:3 image.
export const IMAGE_LIMITS: ImageLimits = { area: 60_000, maxWidth: 460, maxHeight: 240 }

export const HEADER_THUMB = { width: 190, height: 107 }
export const HEADER_COLUMN_GAP = 12
export const URL_PROTOCOL_PATTERN = /^https?:\/\//
export const STATUS_ID_PATTERN = /\/status\/(\d+)/
export const FILENAME_SEGMENT_LIMIT = 42

export const MARGIN_INLINE_NONE = 0
export const MARGIN_SMALL = 4
export const MARGIN_MEDIUM = 8
export const MARGIN_LARGE = 12
export const MARGIN_CODE_BLOCK = 10
export const MARGIN_BLOCK = 5
export const MARGIN_HEADING_TOP = 10
export const MARGIN_HEADING_BOTTOM = 6

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
  default: [32, 30, 32, 36],
  minimum: [24, 24, 24, 24],
}
