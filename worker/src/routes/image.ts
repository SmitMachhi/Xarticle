import { SEC_CH_UA, USER_AGENT } from '../core/constants'

const ALLOWED_HOSTS = new Set([
  'pbs.twimg.com',
  'abs.twimg.com',
  'ton.twimg.com',
  'video.twimg.com',
])

const IMAGE_CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,OPTIONS',
}

const IMAGE_CACHE_SECONDS = 86_400

const UPSTREAM_HEADERS: Record<string, string> = {
  'accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
  'accept-language': 'en-US,en;q=0.9',
  'referer': 'https://x.com/',
  'sec-ch-ua': SEC_CH_UA,
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'image',
  'sec-fetch-mode': 'no-cors',
  'sec-fetch-site': 'cross-site',
  'user-agent': USER_AGENT,
}

export const handleImage = async (request: Request): Promise<Response> => {
  const { searchParams } = new URL(request.url)
  const rawUrl = searchParams.get('url')
  if (!rawUrl) return new Response('Missing url', { status: 400 })

  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    return new Response('Invalid url', { status: 400 })
  }

  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    return new Response('Forbidden', { status: 403 })
  }

  const upstream = await fetch(parsed.toString(), { headers: UPSTREAM_HEADERS })

  if (!upstream.ok) return new Response('Upstream error', { status: upstream.status })

  return new Response(upstream.body, {
    status: 200,
    headers: {
      ...IMAGE_CORS_HEADERS,
      'cache-control': `public, max-age=${IMAGE_CACHE_SECONDS}`,
      'content-type': upstream.headers.get('content-type') ?? 'image/jpeg',
    },
  })
}
