import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parseThreadloomStatusResponse } from '../threadloomParser'
import { buildArticlePdfDefinition, type PdfExportOptions } from '../pdfExport'

const loadFixture = (name: string): unknown => {
  const currentDir = dirname(fileURLToPath(import.meta.url))
  const fixturePath = resolve(currentDir, 'fixtures', name)
  const raw = readFileSync(fixturePath, 'utf-8')
  return JSON.parse(raw)
}

const collectTexts = (value: unknown): string[] => {
  if (typeof value === 'string') {
    return [value]
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectTexts(item))
  }

  if (value && typeof value === 'object') {
    return Object.values(value).flatMap((item) => collectTexts(item))
  }

  return []
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
    const article = parseThreadloomStatusResponse(payload, 'https://x.com/elvissun/status/2025920521871716562?s=20')

    expect(article.title).toContain('OpenClaw')
    expect(article.authorHandle).toBe('elvissun')
    expect(article.metrics.likes).toBe(6574)
    expect(article.blocks.some((block) => block.type === 'heading')).toBe(true)
    expect(article.blocks.some((block) => block.type === 'list')).toBe(true)
    expect(article.blocks.some((block) => block.type === 'quote')).toBe(true)
    expect(article.blocks.some((block) => block.type === 'code')).toBe(true)
    const duplicateIntro = article.blocks.filter(
      (block) => block.type === 'paragraph' && block.text === "I don't use Codex or Claude Code directly anymore.",
    )
    expect(duplicateIntro).toHaveLength(1)
  })
})

describe('pdf definition regression', () => {
  it('puts the cover page first when enabled', async () => {
    const payload = loadFixture('elvissun-status.json')
    const article = parseThreadloomStatusResponse(payload, 'https://x.com/elvissun/status/2025920521871716562?s=20')

    const doc = await buildArticlePdfDefinition(article, baseOpts, async () => null)
    expect(Array.isArray(doc.content)).toBe(true)

    const first = (doc.content as Array<{ pageBreak?: string }>)[0]
    expect(first.pageBreak).toBeUndefined()
    const titleCount = collectTexts(doc.content).filter((text) => text === article.title).length
    expect(titleCount).toBe(1)
    expect(collectTexts(doc.content)).not.toContain('source: public status parser')
    expect(collectTexts(doc.content)).not.toContain('Extraction Notes')
    expect(collectTexts(doc.content)).not.toContain('Extracted via public status parser.')

    const footerText = typeof doc.footer === 'function' ? collectTexts(doc.footer(1, 2, {} as never)) : []
    expect(footerText).toContain('Xarticle.co')
  })

  it('promotes the cover image to the cover page top when enabled', async () => {
    const payload = loadFixture('elvissun-status.json')
    const article = parseThreadloomStatusResponse(payload, 'https://x.com/elvissun/status/2025920521871716562?s=20')

    const doc = await buildArticlePdfDefinition(article, baseOpts, async (url) => {
      if (url.includes('HB0Qm-HWMAAoBAz')) {
        return 'data:image/png;base64,cover'
      }
      return null
    })

    const firstPage = (doc.content as Array<{ stack?: Array<{ image?: string }>; pageBreak?: string }>)[0]
    expect(firstPage.pageBreak).toBeUndefined()
    expect(firstPage.stack?.[0]?.image).toBe('data:image/png;base64,cover')
  })

  it('skips the cover page when disabled', async () => {
    const payload = loadFixture('elvissun-status.json')
    const article = parseThreadloomStatusResponse(payload, 'https://x.com/elvissun/status/2025920521871716562?s=20')

    const doc = await buildArticlePdfDefinition(
      article,
      {
        ...baseOpts,
        coverPageMode: 'off',
      },
      async () => null,
    )

    const first = (doc.content as Array<{ pageBreak?: string }>)[0]
    expect(first.pageBreak).toBeUndefined()
    const titleCount = collectTexts(doc.content).filter((text) => text === article.title).length
    expect(titleCount).toBe(1)
  })
})
