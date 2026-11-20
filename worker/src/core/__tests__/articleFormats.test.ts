import { describe, expect, it } from 'vitest'

import { parseThreadloomStatusResponse } from '../../../../src/lib/threadloomParser'
import { toTweetPayload } from '../tweetMapper'

type RawBlock = { type: string; text: string; inlineStyleRanges: unknown[]; entityRanges: unknown[] }

const text = (type: string, value: string, inlineStyleRanges: unknown[] = []): RawBlock => ({ type, text: value, inlineStyleRanges, entityRanges: [] })
const atomic = (key: number, value = ' '): RawBlock => ({ type: 'atomic', text: value, inlineStyleRanges: [], entityRanges: [{ key, offset: 0, length: value.length }] })

const ENTITIES = [
  { type: 'MEDIA', data: { mediaItems: [{ mediaId: 'm1' }, { mediaId: 'm2' }], caption: 'gallery' } },
  { type: 'TWEET', data: { tweetId: '20' } },
  { type: 'LATEX', data: {} },
  { type: 'MARKDOWN', data: { markdown: '```ts\nconst x = 1\n```' } },
  { type: 'MARKDOWN', data: { markdown: '| A | B |\n| --- | --- |\n| 1 | 2 |' } },
  { type: 'TWEET', data: { tweetId: '20/../evil' } },
]

const BLOCKS = [
  text('unstyled', 'keep struck', [{ style: 'Strikethrough', offset: 5, length: 6 }]),
  text('code-block', '  if x:'),
  text('code', '    run()'),
  atomic(0), atomic(1), atomic(2, 'E = \\frac{m}{c^2}'), atomic(3), atomic(4), atomic(5),
]

const parse = () => {
  const raw = {
    title: 'Formats',
    content_state: { blocks: BLOCKS, entityMap: ENTITIES.map((value, key) => ({ key: String(key), value })) },
    media_entities: ['m1', 'm2'].map((id) => ({ media_id: id, media_info: { original_img_url: `https://pbs.twimg.com/media/${id}.jpg` } })),
  }
  const node = { rest_id: '10', legacy: { full_text: '' }, core: { user_results: { result: { legacy: { screen_name: 'a', name: 'A' } } } }, article: { article_results: { result: raw } } }
  return parseThreadloomStatusResponse({ code: 200, message: 'OK', tweet: toTweetPayload(node, '10') }, 'https://x.com/a/status/10').blocks
}

describe('X article formats', () => {
  const blocks = parse()

  it('keeps strikethrough and joins code lines with their indentation', () => {
    expect(blocks[0]).toMatchObject({ type: 'paragraph', marks: [{ offset: 5, length: 6, type: 'strikethrough' }] })
    expect(blocks[1]).toEqual({ type: 'code', code: '  if x:\n    run()', language: undefined })
  })

  it('keeps every gallery image, posts, latex and separate markdown panels', () => {
    expect(blocks.slice(2).map((block) => block.type)).toEqual(['media', 'media', 'embed', 'math', 'code', 'table'])
    expect(blocks[3]).toMatchObject({ url: expect.stringContaining('m2'), caption: 'gallery' })
    expect(blocks[4]).toEqual({ type: 'embed', text: 'https://x.com/i/status/20', url: 'https://x.com/i/status/20' })
    expect(blocks[5]).toEqual({ type: 'math', text: 'E = \\frac{m}{c^2}' })
    expect(blocks[6]).toEqual({ type: 'code', code: 'const x = 1', language: 'ts' })
  })
})
