import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { expect, test } from '@playwright/test'

const fixture = JSON.parse(
  readFileSync(resolve(process.cwd(), 'src/lib/__tests__/fixtures/elvissun-status.json'), 'utf-8'),
)
const fixtureForE2E = {
  ...fixture,
  tweet: {
    ...fixture.tweet,
    author: {
      ...fixture.tweet.author,
      avatar_url: undefined,
    },
    media_entities: [],
    article: {
      ...fixture.tweet.article,
      cover_media: undefined,
      content: {
        ...fixture.tweet.article.content,
        blocks: fixture.tweet.article.content.blocks.map((block: { text?: string; type: string }) => {
          if (block.type !== 'unstyled' || !block.text?.startsWith('```bash')) return block
          return {
            ...block,
            text: `\`\`\`bash\n${'codex'.repeat(220)}\n\`\`\``,
          }
        }),
      },
    },
  },
}

test('status url renders preview and downloads pdf and markdown', async ({ page }) => {
  await page.addInitScript(() => {
    ;(window as unknown as { __xapDownloads: string[] }).__xapDownloads = []
  })

  await page.route('**/api/extract', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        kind: 'status',
        payloads: [fixtureForE2E],
        warnings: [],
      }),
    })
  })

  await page.goto('/')

  await page.getByRole('textbox', { name: 'X URL' }).fill('https://x.com/elvissun/status/2025920521871716562?s=20')
  await page.getByRole('button', { name: 'Load Article' }).click()

  await expect(page.getByRole('heading', { name: /openclaw/i })).toBeVisible()

  const previewCard = page.locator('.preview-content')
  const article = page.locator('#preview-section-article')
  const previewBounds = await previewCard.boundingBox()
  const articleBounds = await article.boundingBox()
  expect(previewBounds).not.toBeNull()
  expect(articleBounds).not.toBeNull()
  expect(articleBounds!.x).toBeGreaterThanOrEqual(previewBounds!.x)
  expect(articleBounds!.x + articleBounds!.width).toBeLessThanOrEqual(previewBounds!.x + previewBounds!.width)

  const codeBlock = page.locator('.article-body pre.code-block')
  await expect(codeBlock).toHaveCount(1)

  const pdfButton = page.getByRole('button', { name: 'Download PDF' })
  const markdownButton = page.getByRole('button', { name: /Download for LLMs/i })

  await expect(pdfButton).toBeEnabled()
  await expect(markdownButton).toBeEnabled()

  await pdfButton.click()
  await markdownButton.click({ modifiers: ['Shift'] })

  const requestedDownloads = await page.evaluate(() => (window as unknown as { __xapDownloads: string[] }).__xapDownloads)
  expect(requestedDownloads.some((name) => name.endsWith('.pdf'))).toBe(true)
})
