import type { Lesson } from '../../types/curriculum.ts'

const lesson: Lesson = {
  moduleId: 6,
  sections: [
    {
      kind: 'text',
      content: `## Every HTTP Message Carries an Envelope

HTTP messages have two parts.
The **body** — the actual content. JSON, HTML, image bytes.
The **headers** — metadata about the body. Like an envelope around a letter.

The envelope tells the post office how to handle the letter.
Headers tell the server and browser how to handle the body.

Content-Type: application/json → "this body is JSON, parse it as such"
Authorization: Bearer abc123 → "here's my credential"
Cache-Control: max-age=3600 → "you can cache this for an hour"

Before your code reads a single byte of the response body,
headers have already told both sides what to expect.`,
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
      content: `## How Tokens Replace Passwords

Imagine if every time you walked into a concert venue,
you had to prove your identity from scratch at every single door.
Show your ID. Verify your ticket. Wait in line. Every time.

That's passwords on every request. Nobody does this.

Instead: prove yourself once. Get a **wristband**.
The wristband says "this person belongs here."
Every door you walk through — just show the wristband.

HTTP uses the same idea. Authenticate once, receive a token,
then pass that token in the Authorization header on every subsequent request.
The server reads the token and knows who you are instantly.`,
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
      content: `## Two Tokens, Two Jobs

This app deals with two kinds of tokens from X's API.

**Bearer Token** — your app's master credential. Long-lived. Never expires unless revoked.
Lives in a Cloudflare secret. Never touches your browser.

**Guest Token** — an anonymous session token. X issues one per session.
Expires after ~2 hours. The worker fetches one, caches it, and refreshes when needed.

Every API call uses both: the bearer token identifies your app,
the guest token identifies the session.

## Secrets Never Belong in Code

If it's in the code, it's in git.
If it's in git, it's in git history — **forever**, even after you delete the file.
Anyone with repo access has your token.

Store secrets as environment variables managed by your deployment platform.
At runtime: env.BEARER_TOKEN. The value never appears anywhere readable.`,
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
