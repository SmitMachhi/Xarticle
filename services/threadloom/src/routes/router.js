import { jsonResponse, optionsResponse } from '../core/http'
import { handleStatus } from './status'

const statusIdFromPath = pathname => {
  const match = pathname.match(/^\/i\/status\/(\d+)$/)
  return match?.[1] || null
}

const healthResponse = () => jsonResponse({ ok: true })

const runStatusRoute = async statusId => {
  try {
    return await handleStatus(statusId)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error.'
    return jsonResponse({ error: message }, 502)
  }
}

export const routeRequest = async request => {
  if (request.method === 'OPTIONS') return optionsResponse()
  const url = new URL(request.url)
  if (request.method === 'GET' && url.pathname === '/health') return healthResponse()
  const statusId = request.method === 'GET' ? statusIdFromPath(url.pathname) : null
  if (statusId) return await runStatusRoute(statusId)
  return jsonResponse({ error: 'Not found.' }, 404)
}
