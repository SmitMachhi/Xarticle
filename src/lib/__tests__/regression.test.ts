import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parseFxTweetResponse, parseFxTweetThreadResponse } from '../fxTweetParser'
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
    const article = parseFxTweetResponse(payload, 'https://x.com/elvissun/status/2025920521871716562?s=20')

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

describe('thread regression parsing', () => {
  it('merges same-author parent chain into a single thread article with root metrics', () => {
    const payloads = [
      {
        code: 200,
        message: 'OK',
        tweet: {
          id: '1003',
          url: 'https://x.com/panda/status/1003',
          text: 'Post three in thread',
          raw_text: { text: 'Post three in thread' },
          author: { name: 'Panda', screen_name: 'panda' },
          likes: 12,
          replies: 3,
          retweets: 2,
          views: 330,
          bookmarks: 1,
          created_at: 'Mon Feb 23 10:00:03 +0000 2026',
          created_timestamp: 1771840803,
          replying_to_status: '1002',
        },
      },
      {
        code: 200,
        message: 'OK',
        tweet: {
          id: '1002',
          url: 'https://x.com/panda/status/1002',
          text: 'Post two in thread',
          raw_text: { text: 'Post two in thread' },
          author: { name: 'Panda', screen_name: 'panda' },
          likes: 10,
          replies: 2,
          retweets: 1,
          views: 220,
          bookmarks: 1,
          created_at: 'Mon Feb 23 10:00:02 +0000 2026',
          created_timestamp: 1771840802,
          replying_to_status: '1001',
          media: {
            photos: [{ url: 'https://pbs.twimg.com/media/thread-image-1002.jpg?name=orig' }],
          },
        },
      },
      {
        code: 200,
        message: 'OK',
        tweet: {
          id: '1001',
          url: 'https://x.com/panda/status/1001',
          text: 'Post one in thread',
          raw_text: { text: 'Post one in thread' },
          author: { name: 'Panda', screen_name: 'panda' },
          likes: 99,
          replies: 9,
          retweets: 7,
          views: 1900,
          bookmarks: 5,
          created_at: 'Mon Feb 23 10:00:01 +0000 2026',
          created_timestamp: 1771840801,
          replying_to_status: null,
        },
      },
    ]

    const article = parseFxTweetThreadResponse(payloads, 'https://x.com/panda/status/1003')

    expect(article.isThread).toBe(true)
    expect(article.threadTweetCount).toBe(3)
    expect(article.canonicalUrl).toBe('https://x.com/panda/status/1001')
    expect(article.metrics.likes).toBe(99)
    expect(article.metrics.replies).toBe(9)
    expect(article.metrics.reposts).toBe(7)
    expect(article.blocks.filter((block) => block.type === 'heading' && block.text.startsWith('Post '))).toHaveLength(3)
    expect(article.blocks.some((block) => block.type === 'media' && block.url.includes('thread-image-1002'))).toBe(true)
    expect(article.warnings.some((warning) => warning.includes('Auto-detected thread: 3 posts merged'))).toBe(true)
  })
})

describe('pdf definition regression', () => {
  it('puts the cover page first when enabled', async () => {
    const payload = loadFixture('elvissun-status.json')
    const article = parseFxTweetResponse(payload, 'https://x.com/elvissun/status/2025920521871716562?s=20')

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
    const article = parseFxTweetResponse(payload, 'https://x.com/elvissun/status/2025920521871716562?s=20')

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
    const article = parseFxTweetResponse(payload, 'https://x.com/elvissun/status/2025920521871716562?s=20')

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
