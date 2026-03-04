import { handleExtract } from '../../worker/src/routes/extract'

export const onRequestOptions = (): Response =>
  new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'content-type',
    },
  })

export const onRequestPost: PagesFunction = async ({ request }) => handleExtract(request)
