import { describe, expect, it } from 'vitest'

import type { ExtractedArticle } from '../../types/article'
import { buildArticlePdfDefinition } from '../pdfExport'
import { normalizeRichText } from '../threadloom/normalize'
import { parseThreadloomStatusResponse } from '../threadloomParser'

const statusPayload = (blocks: unknown[]) => ({
  code: 200,
  tweet: { url: 'https://x.com/a/status/1', author: { name: 'A', screen_name: 'a' }, article: { title: 'T', content: { blocks } } },
})

const parseBlocks = (blocks: unknown[]) => parseThreadloomStatusResponse(statusPayload(blocks), 'https://x.com/a/status/1').blocks

describe('article text fidelity', () => {
  it('keeps paragraph breaks and shifts marks to match', () => {
    const result = normalizeRichText('  one  two\n\n\nthree', [{ offset: 13, length: 5, type: 'bold' }])
    expect(result.text).toBe('one two\n\nthree')
    expect(result.marks).toEqual([{ offset: 9, length: 5, type: 'bold' }])
  })

  it('keeps inline marks on paragraphs after dedupe', () => {
    const [block] = parseBlocks([{ type: 'unstyled', text: 'hello world', marks: [{ offset: 0, length: 5, type: 'bold' }] }])
    expect(block).toEqual({ type: 'paragraph', text: 'hello world', marks: [{ offset: 0, length: 5, type: 'bold' }] })
  })

  it('keeps ordered and bulleted lists apart, plus dividers and video posters', () => {
    const blocks = parseBlocks([
      { type: 'ordered-list-item', text: 'first' },
      { type: 'ordered-list-item', text: 'second' },
      { type: 'unordered-list-item', text: 'bullet' },
      { type: 'divider', text: '' },
      { type: 'atomic', text: '', url: 'https://pbs.twimg.com/poster.jpg', video: 'https://video.twimg.com/v.mp4', caption: 'clip' },
    ])
    expect(blocks).toEqual([
      { type: 'list', ordered: true, items: [{ text: 'first' }, { text: 'second' }] },
      { type: 'list', ordered: false, items: [{ text: 'bullet' }] },
      { type: 'divider' },
      { type: 'media', mediaType: 'video-thumbnail', url: 'https://pbs.twimg.com/poster.jpg', caption: 'clip', link: 'https://video.twimg.com/v.mp4' },
    ])
  })
})

describe('pdf rendering fidelity', () => {
  const article: ExtractedArticle = {
    sourceUrl: 'https://x.com/a/status/1',
    canonicalUrl: 'https://x.com/a/status/1',
    title: 'Glyphs 🚨 test',
    authorName: 'A',
    authorHandle: 'a',
    metrics: { likes: null, replies: null, reposts: null, views: null, bookmarks: null },
    blocks: [
      { type: 'heading', level: 2, text: 'Section' },
      { type: 'paragraph', text: '→ arrows and ❌ marks' },
      { type: 'list', ordered: true, items: [{ text: 'one' }] },
      { type: 'quote', text: 'quoted' },
      { type: 'divider' },
    ],
    warnings: [],
    extractedAt: '2026-01-01T00:00:00.000Z',
    mode: 'fallback',
    providerUsed: 'threadloom',
    providerAttempts: [],
  }

  it('maps unsupported glyphs, numbers ordered lists and keeps headings with their text', async () => {
    const doc = await buildArticlePdfDefinition(article, { paperSize: 'A4', marginPreset: 'default', themeMode: 'color', coverMetaStyle: 'full', coverPageMode: 'off' }, async () => null)
    const content = doc.content as unknown as Array<Record<string, unknown>>
    expect(content[0].text).toBe('Glyphs test')
    expect(content.find((item) => item.style === 'h2')?.headlineLevel).toBe(2)
    expect(content.find((item) => item.style === 'paragraph')?.text).toBe('-> arrows and × marks')
    expect(content.some((item) => Array.isArray(item.ol))).toBe(true)
    expect(content.filter((item) => item.table)).toHaveLength(2)
    expect(typeof doc.pageBreakBefore).toBe('function')
  })
})
