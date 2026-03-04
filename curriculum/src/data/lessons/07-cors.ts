import type { Lesson } from '../../types/curriculum.ts'

const lesson: Lesson = {
  moduleId: 7,
  sections: [
    {
      kind: 'text',
      content: `CORS — Cross-Origin Resource Sharing

CORS is a security policy that browsers enforce. It says: JavaScript running on page A cannot read responses from server B, unless server B explicitly says "page A is allowed."

"Origin" = protocol + hostname + port.
  https://myapp.com and https://api.x.com are different origins.

Without CORS, a malicious webpage could make requests to your bank's API using your existing session cookies — and read the response. CORS prevents that.`,
    },
    {
      kind: 'diagram',
      content: `
  Without CORS protection (dangerous):
  ─────────────────────────────────────
  evil.com script ──GET──▶ your-bank.com/account-balance
                  ◀──200── { balance: $10,000 }  ← evil.com reads this!

  With CORS (what browsers actually do):
  ──────────────────────────────────────
  evil.com script ──GET──▶ your-bank.com/account-balance
                  ◀──200── { balance: $10,000 }
                            ↑ No CORS header — browser BLOCKS the read
                            evil.com sees nothing`,
      filename: 'Why CORS Exists',
    },
    {
      kind: 'text',
      content: `The Image Proxy Problem

This app loads Twitter images (from pbs.twimg.com) into PDF exports. But X's image servers don't send CORS headers — they don't allow arbitrary websites to read the images via JavaScript fetch().

So when the app tries to fetch an image to embed in the PDF:
  fetch('https://pbs.twimg.com/media/...')  // ← CORS block!

The browser blocks it. The solution: proxy the request through our own server, which does allow the app's origin.`,
    },
    {
      kind: 'diagram',
      content: `
  Browser                 Our Worker (/api/image)      pbs.twimg.com
  ───────                 ───────────────────────      ─────────────
     │                             │                         │
     │  fetch('/api/image?url=...') │                         │
     │────────────────────────────▶│                         │
     │ (same origin — allowed!)    │  fetch(pbs.twimg.com/…) │
     │                             │────────────────────────▶│
     │                             │  image bytes            │
     │                             │◀────────────────────────│
     │  image bytes                │                         │
     │  + CORS header: * ←─────── │                         │
     │◀────────────────────────────│                         │
     │ browser allows read!        │                         │`,
      filename: 'Image Proxy — CORS Solution',
    },
    {
      kind: 'code',
      language: 'typescript',
      filename: 'worker/src/routes/image.ts',
      content: `export async function handleImage(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const imageUrl = url.searchParams.get('url') ?? ''

  // Security: only proxy allowed Twitter image hosts
  const ALLOWED_HOSTS = ['pbs.twimg.com', 'abs.twimg.com', 'ton.twimg.com']
  const parsed = new URL(imageUrl)

  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    return new Response('Host not allowed', { status: 403 })
  }

  const upstream = await fetch(imageUrl)
  const blob = await upstream.blob()

  return new Response(blob, {
    headers: {
      'content-type': upstream.headers.get('content-type') ?? 'image/jpeg',
      // This header tells the browser: "any origin can read this response"
      'access-control-allow-origin': '*',
      // Cache the image at the CDN edge for 24 hours
      'cache-control': 'public, max-age=86400',
    },
  })
}`,
    },
    {
      kind: 'text',
      content: `The CORS Header

The magic header is:
  Access-Control-Allow-Origin: *

This tells the browser: "I, the server, allow any website to read my response."

"*" means any origin. You can also be specific:
  Access-Control-Allow-Origin: https://myapp.com

Server-to-server requests (like the worker calling pbs.twimg.com) are NOT subject to CORS — CORS is purely a browser security mechanism. That's why the worker can fetch the image even though a browser can't.`,
    },
  ],
  quiz: [
    {
      question: 'What does CORS stand for, and what does it protect against?',
      options: [
        'Cross-Origin Resource Sharing — it prevents servers from being overloaded',
        'Cross-Origin Resource Sharing — it prevents malicious websites from reading responses from other origins using your credentials',
        'Cross-Origin Routing System — it handles load balancing across servers',
        'Content-Origin Response Sync — it ensures API responses arrive in order',
      ],
      correctIndex: 1,
      explanation: 'CORS prevents cross-site attacks where a malicious page could make requests to other sites (e.g., your bank) on your behalf and read the responses.',
    },
    {
      question: 'Why can the Cloudflare Worker fetch images from pbs.twimg.com, but the browser cannot?',
      options: [
        'The worker has a special Cloudflare SSL certificate that bypasses CORS',
        'CORS is a browser security mechanism — server-to-server requests are not subject to it',
        'The worker uses a different HTTP version (HTTP/3) that bypasses CORS',
        'pbs.twimg.com allows Cloudflare IPs specifically',
      ],
      correctIndex: 1,
      explanation: 'CORS only applies to browser JavaScript. Server-to-server requests (worker → pbs.twimg.com) go through without any CORS restrictions.',
    },
    {
      question: 'What HTTP header does the image proxy add to allow browsers to read the response?',
      options: [
        'Allow-Cross-Origin: true',
        'X-CORS-Bypass: enabled',
        'Access-Control-Allow-Origin: *',
        'Cross-Origin-Resource-Policy: same-origin',
      ],
      correctIndex: 2,
      explanation: '`Access-Control-Allow-Origin: *` tells the browser that any origin is permitted to read this response. The `*` means "all origins."',
    },
    {
      question: 'Why does the image proxy whitelist only specific hostnames (pbs.twimg.com, etc.)?',
      options: [
        'To prevent large images from being proxied',
        'Cloudflare Workers can only reach certain domains',
        'To prevent the proxy from being abused to forward requests to arbitrary URLs (open proxy vulnerability)',
        'To cache only Twitter images and skip others',
      ],
      correctIndex: 2,
      explanation: 'Without a whitelist, anyone could use /api/image to proxy any URL — an open proxy that could be used for attacks. Whitelisting prevents this.',
    },
    {
      question: 'What is an "origin" in the context of CORS?',
      options: [
        'The IP address of the server',
        'The protocol + hostname + port combination (e.g., https://myapp.com:443)',
        'The path portion of a URL',
        'The country where the server is located',
      ],
      correctIndex: 1,
      explanation: 'An origin is protocol + hostname + port. https://myapp.com and http://myapp.com are different origins; so are https://myapp.com and https://api.myapp.com.',
    },
  ],
}

export default lesson
