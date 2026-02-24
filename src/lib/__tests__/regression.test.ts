import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parseFxTweetResponse } from '../fxTweetParser'
import { buildArticlePdfDefinition, type PdfExportOptions } from '../pdfExport'

const loadFixture = (name: string): unknown => {
  const currentDir = dirname(fileURLToPath(import.meta.url))
  const fixturePath = resolve(currentDir, 'fixtures', name)
  const raw = readFileSync(fixturePath, 'utf-8')
  return JSON.parse(raw)
}

const baseOpts: PdfExportOptions = {
  paperSize: 'A4',
  marginPreset: 'default',
  themeMode: 'color',
  coverPageMode: 'always',
  coverMetaStyle: 'full',
}

describe('status regression parsing', () => {
  it('parses a real status fixture into printable article blocks', () => {
    const payload = loadFixture('elvissun-status.json')
    const article = parseFxTweetResponse(payload, 'https://x.com/elvissun/status/2025920521871716562?s=20')

    expect(article.title).toContain('OpenClaw')
    expect(article.authorHandle).toBe('elvissun')
    expect(article.metrics.likes).toBe(6574)
    expect(article.blocks.some((block) => block.type === 'heading')).toBe(true)
    expect(article.blocks.some((block) => block.type === 'list')).toBe(true)
    expect(article.blocks.some((block) => block.type === 'quote')).toBe(true)
    expect(article.blocks.some((block) => block.type === 'code')).toBe(true)
  })
})

describe('pdf definition regression', () => {
  it('puts the cover page first when enabled', async () => {
    const payload = loadFixture('elvissun-status.json')
    const article = parseFxTweetResponse(payload, 'https://x.com/elvissun/status/2025920521871716562?s=20')

    const doc = await buildArticlePdfDefinition(article, baseOpts, async () => null)
    expect(Array.isArray(doc.content)).toBe(true)

    const first = (doc.content as Array<{ pageBreak?: string }>)[0]
    expect(first.pageBreak).toBe('after')
  })

  it('skips the cover page when disabled', async () => {
    const payload = loadFixture('elvissun-status.json')
    const article = parseFxTweetResponse(payload, 'https://x.com/elvissun/status/2025920521871716562?s=20')

    const doc = await buildArticlePdfDefinition(
      article,
      {
        ...baseOpts,
        coverPageMode: 'off',
      },
      async () => null,
    )

    const first = (doc.content as Array<{ pageBreak?: string; text?: string }>)[0]
    expect(first.pageBreak).toBeUndefined()
    expect(first.text).toBe(article.title)
  })
})
