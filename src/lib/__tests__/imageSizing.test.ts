import { describe, expect, it } from 'vitest'

import { readImageSize } from '../pdf-export/image/dimensions'
import { fitImage } from '../pdf-export/image/sizing'

const toDataUrl = (bytes: number[], type: string): string => `data:${type};base64,${btoa(String.fromCharCode(...bytes))}`
const u16 = (value: number): number[] => [(value >> 8) & 0xff, value & 0xff]
const u32 = (value: number): number[] => [...u16(Math.floor(value / 65536)), ...u16(value % 65536)]

const png = (width: number, height: number): string =>
  toDataUrl([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52, ...u32(width), ...u32(height), 8, 6, 0, 0, 0], 'image/png')

// SOI, an APP0 segment to skip, then a progressive SOF2 frame header.
const jpeg = (width: number, height: number): string =>
  toDataUrl([0xff, 0xd8, 0xff, 0xe0, ...u16(16), ...Array<number>(14).fill(0), 0xff, 0xc2, ...u16(17), 8, ...u16(height), ...u16(width), 3, 0, 0, 0, 0], 'image/jpeg')

const LIMITS = { area: 108_300, maxWidth: 460, maxHeight: 380 }

describe('image sizing', () => {
  it('reads pixel sizes from png and jpeg headers', () => {
    expect(readImageSize(png(1200, 675))).toEqual({ width: 1200, height: 675 })
    expect(readImageSize(jpeg(720, 1280))).toEqual({ width: 720, height: 1280 })
    expect(readImageSize('data:image/png;base64,bm9wZQ==')).toBeNull()
  })

  it('gives landscape, square and portrait images a similar area within the caps', () => {
    const [wideW, wideH] = fitImage(png(1600, 900), LIMITS)
    const [squareW, squareH] = fitImage(png(1000, 1000), LIMITS)
    expect(wideW * wideH).toBeCloseTo(LIMITS.area, -2)
    expect(squareW * squareH).toBeCloseTo(LIMITS.area, -2)
    const [tallW, tallH] = fitImage(jpeg(720, 1280), LIMITS)
    expect(tallH).toBeCloseTo(LIMITS.maxHeight)
    expect(tallW).toBeCloseTo(LIMITS.maxHeight * (720 / 1280))
  })

  it('caps very wide images at the column width and never upscales small ones', () => {
    expect(fitImage(png(4000, 1000), LIMITS)[0]).toBeCloseTo(LIMITS.maxWidth)
    expect(fitImage(png(120, 80), LIMITS)).toEqual([120, 80])
    expect(fitImage('data:image/png;base64,cover', LIMITS)).toEqual([LIMITS.maxWidth, LIMITS.maxHeight])
  })
})
