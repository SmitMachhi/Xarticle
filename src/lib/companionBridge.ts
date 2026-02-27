interface BridgeRequestPayload {
  type: 'extract-article'
  url: string
}

interface BridgeRequestMessage {
  payload: BridgeRequestPayload
  requestId: string
  type: 'XAP_COMPANION_REQUEST'
}

interface BridgeResponseMessage {
  error?: string
  ok: boolean
  payload?: {
    finalUrl: string
    html: string
    statusCode?: number
  }
  requestId: string
  type: 'XAP_COMPANION_RESPONSE'
}

const BRIDGE_TIMEOUT_MS = 8_000
const RANDOM_BASE = 36
const RANDOM_SLICE_INDEX = 2

const randomId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `xap-${Date.now()}-${Math.random().toString(RANDOM_BASE).slice(RANDOM_SLICE_INDEX)}`
}

export const requestCompanionHtml = async (url: string): Promise<{ finalUrl: string; html: string }> => {
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
