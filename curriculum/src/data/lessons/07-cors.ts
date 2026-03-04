import type { Lesson } from '../../types/curriculum.ts'

const lesson: Lesson = {
  moduleId: 7,
  sections: [
    {
      kind: 'text',
      content: `## Your Browser Is Protecting You Right Now

Every time your JavaScript makes a request to another website,
the browser checks something first: "Did that server say I'm allowed to read this?"

If the server didn't say yes — the browser blocks the response.
Your JavaScript gets nothing. Not even the status code.

This isn't a bug. This protection has quietly stopped countless attacks
you'll never hear about.

## The Attack CORS Prevents

Imagine: you're logged into your bank. Your session cookie is in the browser.
You visit a sketchy site. That site's JavaScript tries to fetch your-bank.com/balance —
using your existing session cookie, on your behalf, without your knowledge.

Without CORS, it would work. The bank sees your session, returns your balance.
The attacker reads it.

**CORS is why this doesn't happen.**
The bank's server doesn't send the CORS header allowing evil-site.com to read the response.
The browser receives the data — then blocks the JavaScript from touching it.

The data travels. The attacker gets nothing.`,
    },
    { kind: 'visual', content: '', visualKey: 'CorsBlockedVsProxied' },
    {
      kind: 'text',
      content: `## The Image Proxy Problem

This app embeds Twitter images in PDF exports.
Images that live on pbs.twimg.com.

Problem: X's image servers don't send CORS headers.
The browser fetches the image, receives it — then blocks your code from reading the bytes.
You can't embed what you can't read.

Solution: **don't fetch from the browser**.
Fetch from the worker, where CORS doesn't apply.

Browser → our worker → pbs.twimg.com → worker → browser.
Our worker adds the CORS header. The browser is satisfied. The PDF gets its image.

## The One Line That Unlocks It

Access-Control-Allow-Origin: *

One response header: "any site can read my response."
"*" means all origins. You can also be specific:
Access-Control-Allow-Origin: https://myapp.com

**CORS is a browser-only mechanism.** Server-to-server requests skip it entirely.
The browser is the enforcer. Remove the browser, and there's nothing to enforce.
That's why the worker fetches freely from X's API while your browser cannot.`,
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
      content: `## Why Whitelisting Matters

The image proxy doesn't forward any URL you give it.
It only allows pbs.twimg.com, abs.twimg.com, and ton.twimg.com.

Without that check, anyone could call /api/image?url=https://internal-network/secret
and use your worker as a tool to reach systems it shouldn't touch.

That's called an **open proxy vulnerability**.
One whitelist check. Closes the attack entirely.`,
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
