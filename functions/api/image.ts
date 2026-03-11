import { handleImage } from '../../worker/src/routes/image'

export const onRequestOptions = (): Response =>
  new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, OPTIONS',
      'access-control-allow-headers': 'content-type',
    },
  })

export const onRequestGet: PagesFunction = async ({ request }) => handleImage(request)
