import {
  BASE64_GROUP_CHARS,
  BYTE_BITS,
  HEADER_SCAN_CHARS,
  JPEG_MARKER_PREFIX,
  JPEG_SEGMENT_START,
  JPEG_SIGNATURE,
  JPEG_SOF_HEADER_BYTES,
  JPEG_SOF_HEIGHT_OFFSET,
  JPEG_SOF_MARKERS,
  JPEG_SOF_WIDTH_OFFSET,
  PNG_HEIGHT_OFFSET,
  PNG_SIGNATURE,
  PNG_WIDTH_OFFSET,
  UINT16_BITS,
  UINT16_BYTES,
} from './constants'

export interface ImageSize {
  width: number
  height: number
}

const startsWith = (bytes: Uint8Array, signature: number[]): boolean => signature.every((value, index) => bytes[index] === value)
const readUint16 = (bytes: Uint8Array, at: number): number => (bytes[at] << BYTE_BITS) | bytes[at + 1]
const readUint32 = (bytes: Uint8Array, at: number): number => readUint16(bytes, at) * (1 << UINT16_BITS) + readUint16(bytes, at + UINT16_BYTES)

const decodeHeaderBytes = (dataUrl: string): Uint8Array | null => {
  const comma = dataUrl.indexOf(',')
  if (comma < 0) return null
  const base64 = dataUrl.slice(comma + 1, comma + 1 + HEADER_SCAN_CHARS)
  try {
    return Uint8Array.from(atob(base64.slice(0, base64.length - (base64.length % BASE64_GROUP_CHARS))), (char) => char.charCodeAt(0))
  } catch {
    return null
  }
}

const pngSize = (bytes: Uint8Array): ImageSize => ({ width: readUint32(bytes, PNG_WIDTH_OFFSET), height: readUint32(bytes, PNG_HEIGHT_OFFSET) })

const jpegSize = (bytes: Uint8Array): ImageSize | null => {
  let at = JPEG_SEGMENT_START
  while (at + JPEG_SOF_HEADER_BYTES < bytes.length && bytes[at] === JPEG_MARKER_PREFIX) {
    if (JPEG_SOF_MARKERS.has(bytes[at + 1])) {
      return { width: readUint16(bytes, at + JPEG_SOF_WIDTH_OFFSET), height: readUint16(bytes, at + JPEG_SOF_HEIGHT_OFFSET) }
    }
    at += UINT16_BYTES + readUint16(bytes, at + UINT16_BYTES)
  }
  return null
}

export const readImageSize = (dataUrl: string): ImageSize | null => {
  const bytes = decodeHeaderBytes(dataUrl)
  if (!bytes) return null
  if (startsWith(bytes, PNG_SIGNATURE)) return pngSize(bytes)
  if (startsWith(bytes, JPEG_SIGNATURE)) return jpegSize(bytes)
  return null
}
