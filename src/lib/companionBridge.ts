interface BridgeRequestPayload {
  type: 'extract-article'
  url: string
}

interface BridgeRequestMessage {
  type: 'XAP_COMPANION_REQUEST'
  requestId: string
  payload: BridgeRequestPayload
}

interface BridgeResponseMessage {
  type: 'XAP_COMPANION_RESPONSE'
  requestId: string
  ok: boolean
  payload?: {
    html: string
    finalUrl: string
    statusCode?: number
  }
  error?: string
}

const BRIDGE_TIMEOUT_MS = 8000

const randomId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `xap-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export const requestCompanionHtml = async (url: string): Promise<{ html: string; finalUrl: string }> => {
  const requestId = randomId()

  const response = await new Promise<BridgeResponseMessage>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup()
      reject(new Error('Companion extension timed out.'))
    }, BRIDGE_TIMEOUT_MS)

    const onMessage = (event: MessageEvent) => {
      const data = event.data as BridgeResponseMessage | undefined
      if (!data || data.type !== 'XAP_COMPANION_RESPONSE' || data.requestId !== requestId) {
        return
      }
      cleanup()
      resolve(data)
    }

    const cleanup = () => {
      window.clearTimeout(timer)
      window.removeEventListener('message', onMessage)
    }

    window.addEventListener('message', onMessage)

    const message: BridgeRequestMessage = {
      type: 'XAP_COMPANION_REQUEST',
      requestId,
      payload: {
        type: 'extract-article',
        url,
      },
    }

    window.postMessage(message, window.location.origin)
  })

  if (!response.ok || !response.payload) {
    throw new Error(response.error || 'Companion extension failed to fetch article.')
  }

  return {
    html: response.payload.html,
    finalUrl: response.payload.finalUrl,
  }
}
