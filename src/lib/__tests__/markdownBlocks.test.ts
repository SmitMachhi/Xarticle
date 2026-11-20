import { describe, expect, it } from 'vitest'

import { parseMarkdownBlocks } from '../markdownBlocks'

const TABLE = ['| Component | File | Lesson |', '| --- | :---: | --- |', '| Loop | `agent/agent.py` | The loop is **a control system**. |', '| Pipe \\| cell | x |'].join('\n')

describe('parseMarkdownBlocks inline marks', () => {
  it('turns markdown spans into marks', () => {
    expect(parseMarkdownBlocks('**b** ~~s~~ *i* `c` [l](https://x.com)')).toEqual([{
      type: 'paragraph',
      text: 'b s i c l',
      marks: [
        { offset: 0, length: 1, type: 'bold' },
        { offset: 2, length: 1, type: 'strikethrough' },
        { offset: 4, length: 1, type: 'italic' },
        { offset: 6, length: 1, type: 'code' },
        { offset: 8, length: 1, type: 'link', url: 'https://x.com' },
      ],
    }])
  })

  it('leaves snake_case, code contents and non-http links alone', () => {
    expect(parseMarkdownBlocks('agent_forge `**x**` [a](javascript:alert)')).toEqual([{ type: 'paragraph', text: 'agent_forge **x** [a](javascript:alert)', marks: [{ offset: 12, length: 5, type: 'code' }] }])
  })
})

describe('parseMarkdownBlocks tables', () => {
  it('parses header, rows, inline marks, escaped pipes and short rows', () => {
    const [table] = parseMarkdownBlocks(TABLE)
    expect(table).toMatchObject({ type: 'table', header: [{ text: 'Component' }, { text: 'File' }, { text: 'Lesson' }] })
    expect(table.type === 'table' && table.rows).toEqual([
      [{ text: 'Loop' }, { text: 'agent/agent.py', marks: [{ offset: 0, length: 14, type: 'code' }] }, { text: 'The loop is a control system.', marks: [{ offset: 12, length: 16, type: 'bold' }] }],
      [{ text: 'Pipe | cell' }, { text: 'x' }, { text: '' }],
    ])
  })

  it('keeps fenced tables as code and broken rows as text, like X does', () => {
    expect(parseMarkdownBlocks('```\n| A | B |\n| --- | --- |\n```')).toEqual([{ type: 'code', code: '| A | B |\n| --- | --- |', language: undefined }])
    expect(parseMarkdownBlocks('| not | a table |')).toEqual([{ type: 'paragraph', text: '| not | a table |' }])
  })
})

describe('parseMarkdownBlocks structure', () => {
  it('splits mixed markdown into real blocks', () => {
    const blocks = parseMarkdownBlocks(['## Title', '', '- [x] done', '- [ ] open', '1. first', '> **bold** quote', 'Intro', '| A | B |', '| --- | --- |', '| 1 | 2 |', '```bash', 'npm i', '```', 'Then', '```bash', 'npm test', '```'].join('\n'))
    expect(blocks.map((block) => block.type)).toEqual(['heading', 'list', 'list', 'quote', 'paragraph', 'table', 'code', 'paragraph', 'code'])
    expect(blocks[1]).toEqual({ type: 'list', ordered: false, items: [{ text: '[x] done' }, { text: '[ ] open' }] })
    expect(blocks[2]).toMatchObject({ ordered: true, items: [{ text: 'first' }] })
    expect(blocks[6]).toEqual({ type: 'code', code: 'npm i', language: 'bash' })
  })
})
