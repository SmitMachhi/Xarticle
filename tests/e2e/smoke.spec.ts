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

  const pdfButton = page.getByRole('button', { name: 'Download for Humans (PDF)' })
  const markdownButton = page.getByRole('button', { name: /Download for LLMs/i })

  await expect(pdfButton).toBeEnabled()
  await expect(markdownButton).toBeEnabled()

  await pdfButton.click()
  await markdownButton.click({ modifiers: ['Shift'] })

  const requestedDownloads = await page.evaluate(() => (window as unknown as { __xapDownloads: string[] }).__xapDownloads)
  expect(requestedDownloads.some((name) => name.endsWith('.pdf'))).toBe(true)
})
