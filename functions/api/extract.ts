import { createXSession } from '../../worker/src/core/session'
import { handleExtract } from '../../worker/src/routes/extract'

const session = createXSession()

export const onRequestOptions = (): Response =>
  new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'content-type',
    },
  })

export const onRequestPost: PagesFunction = async ({ request }) => handleExtract(request, session)
