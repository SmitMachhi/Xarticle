import type { Lesson } from '../../types/curriculum.ts'

const lesson: Lesson = {
  moduleId: 5,
  sections: [
    {
      kind: 'text',
      content: `## One Worker. Hundreds of Different Requests.

Every request that hits this app goes to the same worker function.
The homepage. The API. The image proxy. All of it.

One function. How does it know what to do?

That's routing — the logic that reads each incoming request
and decides which code runs.`,
    },
    { kind: 'visual', content: '', visualKey: 'RouteMatcher' },
    {
      kind: 'code',
      language: 'typescript',
      filename: 'worker/src/index.ts',
      content: `export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    // Route 1: health check
    if (url.pathname === '/health') {
      return Response.json({ ok: true })
    }

    // Route 2: article extraction — method matters too!
    if (url.pathname === '/api/extract' && request.method === 'POST') {
      return handleExtract(request, env)
    }

    // Route 3: image proxy
    if (url.pathname === '/api/image') {
      return handleImage(request)
    }

    // Catch-all: serve the React SPA
    return env.ASSETS.fetch(request)
  },
}`,
    },
    { kind: 'visual', content: '', visualKey: 'UrlAnatomy' },
    {
      kind: 'text',
      content: `## A URL Is an Address With Extra Information

https://xarticle.pages.dev/api/extract?debug=true

Break it apart:
**Protocol** (https) — the transport layer. Always HTTPS in production.
**Hostname** (xarticle.pages.dev) — which server to talk to.
**Path** (/api/extract) — which specific resource or action.
**Query string** (?debug=true) — optional parameters alongside the request.

The worker uses url.pathname to match routes.
The image handler uses url.searchParams.get('url') to read the image URL to proxy.`,
    },
    {
      kind: 'code',
      language: 'typescript',
      filename: 'worker/src/routes/image.ts',
      content: `export async function handleImage(request: Request): Promise<Response> {
  const url = new URL(request.url)

  // Read from query string: GET /api/image?url=https://pbs.twimg.com/...
  const imageUrl = url.searchParams.get('url')

  if (!imageUrl) {
    return new Response('Missing url param', { status: 400 })
  }

  // Validate: only allow whitelisted hosts to prevent open proxy abuse
  const parsed = new URL(imageUrl)
  const ALLOWED_HOSTS = ['pbs.twimg.com', 'abs.twimg.com', 'ton.twimg.com']

  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    return new Response('Host not allowed', { status: 403 })
  }

  const imageResponse = await fetch(imageUrl)
  // ... add CORS headers and return
}`,
    },
    {
      kind: 'text',
      content: `## A Route Needs Both Method AND Path

Here's a subtlety that trips people up.

GET /api/extract and POST /api/extract are **different routes**.
Same path. Different behavior. Different handler.

The worker checks both conditions:
url.pathname === '/api/extract' && request.method === 'POST'

One condition failing means a completely different outcome.
A GET to /api/extract falls through to the React app — not an API error.`,
    },
  ],
  quiz: [
    {
      question: 'What two things together uniquely identify a route?',
      options: [
        'The hostname and port number',
        'The HTTP method and the URL path',
        'The request body and the Accept header',
        'The query string and the status code',
      ],
      correctIndex: 1,
      explanation: 'A route is the combination of an HTTP method (GET, POST, etc.) and a URL path (/api/extract). Both must match for the right handler to run.',
    },
    {
      question: 'In the worker, what happens when a request doesn\'t match any defined route?',
      options: [
        'The worker throws an error and returns 500',
        'The request is dropped silently',
        'It falls through to serve the React SPA from the assets folder',
        'Cloudflare automatically returns a 404',
      ],
      correctIndex: 2,
      explanation: 'The catch-all `env.ASSETS.fetch(request)` serves the React app\'s built files. This is how SPA routing works — all non-API paths serve index.html.',
    },
    {
      question: 'How does the image handler receive the image URL to proxy?',
      options: [
        'In the request body as JSON',
        'In a custom HTTP header called X-Image-URL',
        'As a query string parameter: ?url=...',
        'In the URL path segment: /api/image/pbs.twimg.com/...',
      ],
      correctIndex: 2,
      explanation: 'The image route reads `url.searchParams.get("url")` — the image URL is passed as a query parameter: GET /api/image?url=https://...',
    },
    {
      question: 'Why does the image handler only allow specific hostnames (whitelist)?',
      options: [
        'To improve performance by limiting network calls',
        'To prevent the worker from being used as an open proxy for arbitrary URLs',
        'Because Cloudflare Workers can only reach those specific domains',
        'To comply with X\'s terms of service',
      ],
      correctIndex: 1,
      explanation: 'Without a whitelist, anyone could use /api/image to proxy ANY URL — a classic open redirect/proxy security vulnerability.',
    },
    {
      question: 'What JavaScript class does the worker use to extract the path from a request URL?',
      options: ['URLParser', 'new URL(request.url)', 'request.path', 'fetch.getURL()'],
      correctIndex: 1,
      explanation: '`new URL(request.url)` is the standard Web API for parsing URLs. It gives you `.pathname`, `.searchParams`, `.hostname`, etc.',
    },
  ],
}

export default lesson
