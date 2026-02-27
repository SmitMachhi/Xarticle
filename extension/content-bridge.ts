const REQUEST_TYPE = 'XAP_COMPANION_REQUEST'
const RESPONSE_TYPE = 'XAP_COMPANION_RESPONSE'

interface CompanionMessage {
  payload?: { type?: string; url?: string }
  requestId?: string
  type?: string
}

const postFailure = (requestId: string, error: string): void => {
  window.postMessage({ type: RESPONSE_TYPE, requestId, ok: false, error }, window.location.origin)
}

const postSuccess = (requestId: string, payload: { finalUrl?: string; html?: string; statusCode?: number }): void => {
  window.postMessage({ type: RESPONSE_TYPE, requestId, ok: true, payload }, window.location.origin)
}

const isValidExtractPayload = (message: CompanionMessage): boolean => {
  return message.payload?.type === 'extract-article' && typeof message.payload.url === 'string'
}

const handleRuntimeResponse = (requestId: string, response: { error?: string; finalUrl?: string; html?: string; ok?: boolean; statusCode?: number } | undefined): void => {
  const runtimeError = chrome.runtime.lastError
  if (runtimeError) {
    postFailure(requestId, runtimeError.message || 'Companion extension is unavailable.')
    return
  }
  if (!response?.ok) {
    postFailure(requestId, response?.error || 'Companion extraction failed.')
    return
  }
  postSuccess(requestId, { html: response.html, finalUrl: response.finalUrl, statusCode: response.statusCode })
}

const onWindowMessage = (event: MessageEvent): void => {
  if (event.source !== window) return
  const message = event.data as CompanionMessage
  if (!message || message.type !== REQUEST_TYPE || typeof message.requestId !== 'string') return
  if (!isValidExtractPayload(message)) {
    postFailure(message.requestId, 'Invalid companion payload.')
    return
  }
  chrome.runtime.sendMessage({ type: 'XAP_EXTRACT_ARTICLE', url: message.payload?.url }, (response) => {
    handleRuntimeResponse(message.requestId!, response)
  })
}

window.addEventListener('message', onWindowMessage)
