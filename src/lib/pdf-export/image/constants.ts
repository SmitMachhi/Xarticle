export const BYTE_BITS = 8
export const UINT16_BITS = 16
export const UINT16_BYTES = 2

export const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47]
export const PNG_WIDTH_OFFSET = 16
export const PNG_HEIGHT_OFFSET = 20

export const JPEG_SIGNATURE = [0xff, 0xd8]
export const JPEG_MARKER_PREFIX = 0xff
export const JPEG_SEGMENT_START = 2
export const JPEG_SOF_HEIGHT_OFFSET = 5
export const JPEG_SOF_WIDTH_OFFSET = 7
export const JPEG_SOF_HEADER_BYTES = 9
export const JPEG_SOF_MARKERS = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf])

export const BASE64_GROUP_CHARS = 4
export const HEADER_SCAN_CHARS = 1_048_576
