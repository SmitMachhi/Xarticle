const CONTEXT_MENU_ID = 'open-x-article-printer'
const WEBAPP_BASE_URL = 'http://localhost:5173'

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: 'Open in X Article Printer',
    contexts: ['link', 'page'],
    targetUrlPatterns: ['https://x.com/*', 'https://twitter.com/*', 'https://www.x.com/*', 'https://www.twitter.com/*'],
    documentUrlPatterns: ['https://x.com/*', 'https://twitter.com/*', 'https://www.x.com/*', 'https://www.twitter.com/*'],
  })
})

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId !== CONTEXT_MENU_ID) {
    return
  }

  const targetUrl = info.linkUrl || info.pageUrl
  if (!targetUrl) {
    return
  }

  const nextUrl = `${WEBAPP_BASE_URL}?url=${encodeURIComponent(targetUrl)}`
  chrome.tabs.create({ url: nextUrl })
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || message.type !== 'XAP_EXTRACT_ARTICLE') {
    return false
  }

  const url = message.url
  if (typeof url !== 'string' || !url) {
    sendResponse({ ok: false, error: 'Invalid URL.' })
    return false
  }

  ;(async () => {
    try {
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
      })

      const html = await response.text()
      if (!response.ok) {
        sendResponse({
          ok: false,
          error: `HTTP ${response.status} while fetching page.`,
          statusCode: response.status,
          html,
          finalUrl: response.url || url,
        })
        return
      }

      sendResponse({
        ok: true,
        html,
        finalUrl: response.url || url,
        statusCode: response.status,
      })
    } catch (error) {
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown extension fetch error.',
      })
    }
  })()

  return true
})
