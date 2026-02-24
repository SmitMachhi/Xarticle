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

test('status url renders preview and downloads both pdfs', async ({ page }) => {
  await page.addInitScript(() => {
    ;(window as unknown as { __xapDownloads: string[] }).__xapDownloads = []
  })

  await page.route('https://api.fxtwitter.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(fixtureForE2E),
    })
  })

  await page.goto('/')

  await page.getByRole('textbox', { name: 'X Article URL' }).fill('https://x.com/elvissun/status/2025920521871716562?s=20')
  await page.getByRole('button', { name: 'Load Article' }).click()

  await expect(page.getByRole('heading', { name: /openclaw/i })).toBeVisible()

  const colorButton = page.getByRole('button', { name: 'Download Color PDF' })
  const bwButton = page.getByRole('button', { name: 'Download B/W PDF' })

  await expect(colorButton).toBeEnabled()
  await expect(bwButton).toBeEnabled()

  await colorButton.click()
  await bwButton.click()

  const requestedDownloads = await page.evaluate(() => (window as unknown as { __xapDownloads: string[] }).__xapDownloads)
  expect(requestedDownloads.some((name) => name.includes('-color.pdf'))).toBe(true)
  expect(requestedDownloads.some((name) => name.includes('-bw.pdf'))).toBe(true)
})
