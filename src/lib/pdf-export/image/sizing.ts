import { type ImageSize, readImageSize } from './dimensions'

export interface ImageLimits {
  area: number
  maxWidth: number
  maxHeight: number
}

export const fitImage = (dataUrl: string, limits: ImageLimits): [number, number] => {
  const size: ImageSize | null = readImageSize(dataUrl)
  if (!size || size.width <= 0 || size.height <= 0) return [limits.maxWidth, limits.maxHeight]
  const scale = Math.min(Math.sqrt(limits.area / (size.width * size.height)), limits.maxWidth / size.width, limits.maxHeight / size.height, 1)
  return [size.width * scale, size.height * scale]
}
