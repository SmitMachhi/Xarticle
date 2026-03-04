import type { Lesson } from '../../types/curriculum.ts'

const lesson: Lesson = {
  moduleId: 6,
  sections: [
    {
      kind: 'text',
      content: `HTTP Headers

Every HTTP request and response carries metadata in headers — key-value pairs sent alongside the actual data. Headers are like the envelope of a letter: separate from the letter content, but essential for delivery.

Common request headers:
• Content-Type: application/json — "my body is JSON"
• Authorization: Bearer <token> — "here's my credential"
• Accept: application/json — "I want JSON back"

Common response headers:
• Content-Type: application/json — "my body is JSON"
• Cache-Control: max-age=3600 — "cache this for 1 hour"
• Access-Control-Allow-Origin: * — "any origin can read this" (CORS)`,
    },
    {
      kind: 'code',
      language: 'typescript',
      filename: 'src/lib/extractArticle.ts',
      content: `// Every request to the worker includes this header
// so the server knows how to parse the body.
const response = await fetch('/api/extract', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',   // ← tells server: body is JSON
  },
  body: JSON.stringify({ url: sourceUrl }),
})`,
    },
    {
      kind: 'text',
      content: `Authentication with Tokens

Authentication answers the question: "Who are you?"

Token-based auth works like a concert wristband:
1. You prove your identity once (buy the ticket)
2. You get a token (wristband)
3. Every subsequent request just shows the token
4. The server verifies the token — no need to re-authenticate

Two kinds of tokens this app deals with:

Bearer Token — a long-lived app-level credential from X. Like a master key. Lives in the worker as a secret.

Guest Token — a short-lived (2-hour) token that X issues to identify anonymous sessions. The worker fetches one, caches it, and attaches it to every X API call.`,
    },
    { kind: 'visual', content: '', visualKey: 'TokenTimeline' },
    {
      kind: 'code',
      language: 'typescript',
      filename: 'worker/src/core/xHeaders.ts',
      content: `// Builds the exact headers X's API expects for authentication.
// Note: this runs SERVER-SIDE only — the bearer token is never sent to browsers.
export function buildXHeaders(guestToken: string, bearerToken: string): HeadersInit {
  return {
    Authorization: \`Bearer \${bearerToken}\`,
    'x-guest-token': guestToken,
    'x-twitter-active-user': 'yes',
    'x-twitter-client-language': 'en',
    'user-agent': 'Mozilla/5.0 ...',
    'content-type': 'application/json',
  }
}`,
    },
    {
      kind: 'text',
      content: `Environment Variables (Secrets)

The bearer token can't be hardcoded in the source file — that would expose it in the git repository forever. Instead it's stored as a Cloudflare secret (environment variable):

  wrangler secret put BEARER_TOKEN

At runtime, the worker accesses it via env.BEARER_TOKEN. The value never appears in the code or the git history.

This pattern applies everywhere: database passwords, API keys, OAuth secrets — never in code, always in environment variables managed by your deployment platform.`,
    },
  ],
  quiz: [
    {
      question: 'What are HTTP headers?',
      options: [
        'The first lines of the response body',
        'Key-value metadata pairs sent alongside requests and responses',
        'URL parameters that start with #',
        'The HTML <head> tags sent by the server',
      ],
      correctIndex: 1,
      explanation: 'Headers are key-value metadata that travel with every HTTP request and response. They describe the message (content type, auth, caching, etc.).',
    },
    {
      question: 'What does the `Authorization: Bearer <token>` header communicate to the server?',
      options: [
        'That the request body is binary',
        'The user\'s identity credential — "here\'s my access token"',
        'That the response should be cached for the given duration',
        'The version of the HTTP protocol being used',
      ],
      correctIndex: 1,
      explanation: 'The Authorization header carries authentication credentials. Bearer tokens are a common format — the server checks this token to verify the caller\'s identity.',
    },
    {
      question: 'Why does the worker use a "guest token" in addition to the bearer token?',
      options: [
        'The bearer token expires after each request',
        'X\'s API requires both: the bearer identifies the app, and the guest token identifies the session',
        'Guest tokens are faster than bearer tokens',
        'The bearer token is for read operations; guest tokens are for writes',
      ],
      correctIndex: 1,
      explanation: 'X\'s API authentication requires both: the bearer token identifies your app (app-level auth), and the guest token identifies an anonymous user session.',
    },
    {
      question: 'How does the worker access the BEARER_TOKEN secret at runtime?',
      options: [
        'It reads it from the wrangler.toml file',
        'It fetches it from an external secrets manager API',
        'Via `env.BEARER_TOKEN` — injected by Cloudflare at deploy time',
        'Via `process.env.BEARER_TOKEN` like a Node.js app',
      ],
      correctIndex: 2,
      explanation: 'Cloudflare Workers receive secrets via the `env` parameter in the fetch handler. This is NOT `process.env` — Workers don\'t use Node.js.',
    },
    {
      question: 'Why should you never commit API keys or bearer tokens to git?',
      options: [
        'Git compresses secrets incorrectly',
        'Once in git history, they can be accessed by anyone with repo access — forever, even after deletion',
        'Secrets over 32 characters break git',
        'CI/CD pipelines don\'t have access to git secrets',
      ],
      correctIndex: 1,
      explanation: 'Git history is permanent and often public or shared. Even if you delete the file, the commit history retains the secret. Always use environment variables.',
    },
  ],
}

export default lesson
