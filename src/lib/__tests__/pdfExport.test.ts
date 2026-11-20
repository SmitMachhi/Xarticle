import type { ContentTable } from 'pdfmake/interfaces'
import { describe, expect, it } from 'vitest'

import { parseMarkdownBlocks } from '../markdownBlocks'
import { fileNameForPdf } from '../pdf-export/naming'
import { paletteForTheme } from '../pdf-export/styles'
import { tableContent } from '../pdf-export/table'

describe('tableContent', () => {
  it('gives wordier columns more room, sums to 100% and repeats the header', () => {
    const [table] = parseMarkdownBlocks('| A | Notes |\n| --- | --- |\n| 1 | a much longer explanation of the row |')
    if (table.type !== 'table') throw new Error('expected a table')
    const content = tableContent(table, paletteForTheme('color')) as ContentTable
    const widths = (content.table.widths as string[]).map(parseFloat)
    expect(widths[1]).toBeGreaterThan(widths[0])
    expect(widths.reduce((sum, width) => sum + width, 0)).toBeCloseTo(100, 1)
    expect(content.table.headerRows).toBe(1)
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
