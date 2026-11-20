import { describe, expect, it } from 'vitest'

import { parseMarkdownBlocks } from '../markdown/blocks'
import { parseInline } from '../markdown/inline'

describe('parseInline', () => {
  it('turns markdown spans into marks', () => {
    expect(parseInline('**b** ~~s~~ *i* `c` [l](https://x.com)')).toEqual({
      text: 'b s i c l',
      marks: [
        { offset: 0, length: 1, type: 'bold' },
        { offset: 2, length: 1, type: 'strikethrough' },
        { offset: 4, length: 1, type: 'italic' },
        { offset: 6, length: 1, type: 'code' },
        { offset: 8, length: 1, type: 'link', url: 'https://x.com' },
      ],
    })
  })

  it('leaves snake_case, code contents and non-http links alone', () => {
    expect(parseInline('agent_forge `**x**` [a](javascript:alert)')).toEqual({ text: 'agent_forge **x** [a](javascript:alert)', marks: [{ offset: 12, length: 5, type: 'code' }] })
  })
})

describe('parseMarkdownBlocks', () => {
  it('splits mixed markdown into real blocks', () => {
    const blocks = parseMarkdownBlocks(['## Title', '', '- [x] done', '- [ ] open', '1. first', '> **bold** quote', 'Intro', '| A | B |', '| --- | --- |', '| 1 | 2 |', '```bash', 'npm i', '```', 'Then', '```bash', 'npm test', '```'].join('\n'))
    expect(blocks.map((block) => block.type)).toEqual(['heading', 'list', 'list', 'quote', 'paragraph', 'table', 'code', 'paragraph', 'code'])
    expect(blocks[1]).toEqual({ type: 'list', ordered: false, items: [{ text: '[x] done' }, { text: '[ ] open' }] })
    expect(blocks[2]).toMatchObject({ ordered: true, items: [{ text: 'first' }] })
    expect(blocks[6]).toEqual({ type: 'code', code: 'npm i', language: 'bash' })
  })

  it('keeps broken table rows as text', () => {
    expect(parseMarkdownBlocks('| not | a table |')).toEqual([{ type: 'paragraph', text: '| not | a table |' }])
  })
})
