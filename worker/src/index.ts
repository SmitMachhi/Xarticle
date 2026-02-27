import { CORS_HEADERS, HTTP_NOT_FOUND } from './core/constants'
import { jsonResponse } from './core/http'
import { handleExtract } from './routes/extract'

const notFound = (): Response => jsonResponse({ error: 'Not found.' }, HTTP_NOT_FOUND)

const routeRequest = async (request: Request): Promise<Response> => {
  const url = new URL(request.url)
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }
  if (request.method === 'GET' && url.pathname === '/health') {
    return jsonResponse({ ok: true })
  }
  if (request.method === 'POST' && url.pathname === '/api/extract') {
    return await handleExtract(request)
  }
  return notFound()
}

export default {
  fetch: async (request: Request): Promise<Response> => await routeRequest(request),
}
