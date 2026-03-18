import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { buildArticlePdfDefinition, type PdfExportOptions } from '../pdfExport'
import { parseThreadloomStatusResponse } from '../threadloomParser'
import type { ExtractedArticle } from '../../types/article'

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

  it('preserves inline formatting, code blocks, and page numbers in exported pdfs', async () => {
    const article: ExtractedArticle = {
      sourceUrl: 'https://x.com/example/status/1',
      canonicalUrl: 'https://x.com/example/status/1',
      title: 'PDF formatting regression',
      authorName: 'Example Author',
      authorHandle: 'example',
      publishedAt: '2026-03-18T09:08:53.000Z',
      metrics: { likes: 1, replies: 2, reposts: 3, views: 4, bookmarks: 5 },
      blocks: [
        {
          type: 'paragraph',
          text: 'Read docs and run code',
          marks: [
            { offset: 5, length: 4, type: 'link', url: 'https://docs.example.com' },
            { offset: 18, length: 4, type: 'code' },
          ],
        },
        {
          type: 'list',
          items: [{ text: 'Important step', marks: [{ offset: 0, length: 9, type: 'bold' }] }],
        },
        { type: 'code', code: 'const answer = 42', language: 'ts' },
      ],
      warnings: [],
      extractedAt: '2026-03-18T09:08:53.000Z',
      mode: 'fallback',
      providerUsed: 'threadloom',
      providerAttempts: [],
    }

    const doc = await buildArticlePdfDefinition(
      article,
      {
        ...baseOpts,
        coverPageMode: 'off',
      },
      async () => null,
    )

    const content = doc.content as Array<{ text?: unknown; style?: string; ul?: unknown[] }>
    const paragraph = content.find((item) => Array.isArray(item.text))
    expect(paragraph).toBeDefined()
    expect(paragraph?.text).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ text: 'docs', link: 'https://docs.example.com' }),
        expect.objectContaining({ text: 'code', style: 'inlineCode' }),
      ]),
    )

    const list = content.find((item) => Array.isArray(item.ul))
    expect(list?.ul).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: expect.arrayContaining([expect.objectContaining({ text: 'Important', bold: true })]),
        }),
      ]),
    )

    const codeBlock = content.find((item) => item.style === 'codeBlock')
    expect(codeBlock).toBeDefined()
    expect(codeBlock?.text).toBe('const answer = 42')

    const footerText = typeof doc.footer === 'function' ? collectTexts(doc.footer(2, 4, {} as never)) : []
    expect(footerText).toContain('Xarticle.co')
    expect(footerText).toContain('2 / 4')
  })
})
