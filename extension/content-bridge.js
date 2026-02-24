const REQUEST_TYPE = 'XAP_COMPANION_REQUEST'
const RESPONSE_TYPE = 'XAP_COMPANION_RESPONSE'

window.addEventListener('message', (event) => {
  if (event.source !== window) {
    return
  }

  const data = event.data
  if (!data || data.type !== REQUEST_TYPE || !data.requestId) {
    return
  }

  if (data.payload?.type !== 'extract-article' || typeof data.payload.url !== 'string') {
    window.postMessage(
      {
        type: RESPONSE_TYPE,
        requestId: data.requestId,
        ok: false,
        error: 'Invalid companion payload.',
      },
      window.location.origin,
    )
    return
  }

  chrome.runtime.sendMessage({ type: 'XAP_EXTRACT_ARTICLE', url: data.payload.url }, (response) => {
    const runtimeError = chrome.runtime.lastError
    if (runtimeError) {
      window.postMessage(
        {
          type: RESPONSE_TYPE,
          requestId: data.requestId,
          ok: false,
          error: runtimeError.message || 'Companion extension is unavailable.',
        },
        window.location.origin,
      )
      return
    }

    if (!response || !response.ok) {
      window.postMessage(
        {
          type: RESPONSE_TYPE,
          requestId: data.requestId,
          ok: false,
          error: response?.error || 'Companion extraction failed.',
        },
        window.location.origin,
      )
      return
    }

    window.postMessage(
      {
        type: RESPONSE_TYPE,
        requestId: data.requestId,
        ok: true,
        payload: {
          html: response.html,
          finalUrl: response.finalUrl,
          statusCode: response.statusCode,
        },
      },
      window.location.origin,
    )
  })
})
