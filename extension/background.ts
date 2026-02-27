const CONTEXT_MENU_ID = 'open-x-article-printer'
const WEBAPP_BASE_URL = 'http://localhost:5173'

const X_URL_PATTERNS = ['https://x.com/*', 'https://twitter.com/*', 'https://www.x.com/*', 'https://www.twitter.com/*']

const onInstalled = (): void => {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: 'Open in X Article Printer',
    contexts: ['link', 'page'],
    targetUrlPatterns: X_URL_PATTERNS,
    documentUrlPatterns: X_URL_PATTERNS,
  })
}

const onContextClick = (info: chrome.contextMenus.OnClickData): void => {
  if (info.menuItemId !== CONTEXT_MENU_ID) return
  const targetUrl = info.linkUrl || info.pageUrl
  if (!targetUrl) return
  chrome.tabs.create({ url: `${WEBAPP_BASE_URL}?url=${encodeURIComponent(targetUrl)}` })
}

const fetchCompanionHtml = async (url: string): Promise<{ finalUrl: string; html: string; ok: boolean; statusCode: number }> => {
  const response = await fetch(url, { method: 'GET', redirect: 'follow' })
  const html = await response.text()
  return { ok: response.ok, html, statusCode: response.status, finalUrl: response.url || url }
}

const onMessage = (
  message: { type?: string; url?: string } | undefined,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
): boolean => {
  if (!message || message.type !== 'XAP_EXTRACT_ARTICLE') return false
  if (typeof message.url !== 'string' || !message.url) {
    sendResponse({ ok: false, error: 'Invalid URL.' })
    return false
  }
  void fetchCompanionHtml(message.url)
    .then((result) => {
      if (!result.ok) {
        sendResponse({ ok: false, error: `HTTP ${result.statusCode} while fetching page.`, ...result })
        return
      }
      sendResponse({ ok: true, ...result })
    })
    .catch((error: unknown) => {
      sendResponse({ ok: false, error: error instanceof Error ? error.message : 'Unknown extension fetch error.' })
    })
  return true
}

chrome.runtime.onInstalled.addListener(onInstalled)
chrome.contextMenus.onClicked.addListener(onContextClick)
chrome.runtime.onMessage.addListener(onMessage)
