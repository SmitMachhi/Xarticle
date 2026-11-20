import { describe, expect, it } from 'vitest'

import { codeOrTableBlock, parseMarkdownTable } from '../markdown/table'
import { fileNameForPdf } from '../pdf-export/naming'
import { tableColumnWidths } from '../pdf-export/table'

const TABLE = ['| Component | File | Lesson |', '| --- | :---: | --- |', '| Loop | `agent/agent.py` | The loop is **a control system**. |', '| Pipe \\| cell | x |'].join('\n')

describe('parseMarkdownTable', () => {
  it('parses header, rows and inline marks', () => {
    const table = parseMarkdownTable(TABLE)
    expect(table?.header.map((cell) => cell.text)).toEqual(['Component', 'File', 'Lesson'])
    expect(table?.rows[0][1]).toEqual({ text: 'agent/agent.py', marks: [{ offset: 0, length: 14, type: 'code' }] })
    expect(table?.rows[0][2]).toEqual({ text: 'The loop is a control system.', marks: [{ offset: 12, length: 16, type: 'bold' }] })
  })

  it('keeps escaped pipes and pads short rows', () => {
    expect(parseMarkdownTable(TABLE)?.rows[1].map((cell) => cell.text)).toEqual(['Pipe | cell', 'x', ''])
  })

  it('leaves non-table code alone', () => {
    expect(parseMarkdownTable('a || b\nreturn x')).toBeNull()
    expect(codeOrTableBlock('x = 1 | 2', 'python')).toEqual({ type: 'code', code: 'x = 1 | 2', language: 'python' })
  })
})

describe('tableColumnWidths', () => {
  it('gives wordier columns more room and sums to 100%', () => {
    const table = parseMarkdownTable(TABLE)
    const widths = table ? tableColumnWidths(table).map(parseFloat) : []
    expect(widths[2]).toBeGreaterThan(widths[0])
    expect(widths.reduce((sum, width) => sum + width, 0)).toBeCloseTo(100, 1)
  })
})

describe('fileNameForPdf', () => {
  it('uses the article title as is', () => {
    expect(fileNameForPdf('I Built an Agentic Harness From Scratch. That Taught Me What Agents Actually Are')).toBe('I Built an Agentic Harness From Scratch. That Taught Me What Agents Actually Are.pdf')
  })

  it('strips characters file systems reject', () => {
    expect(fileNameForPdf('What/why: agents? "now"...')).toBe('What why agents now.pdf')
    expect(fileNameForPdf('  ')).toBe('X Article.pdf')
  })
})
