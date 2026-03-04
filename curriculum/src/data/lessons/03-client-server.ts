import type { Lesson } from '../../types/curriculum.ts'

const lesson: Lesson = {
  moduleId: 3,
  sections: [
    {
      kind: 'text',
      content: `## Two Computers Are Running This App Right Now

When you loaded this page, two machines woke up.
Yours — running React in your browser.
Cloudflare's — sitting in a datacenter close to you.

Neither can do the other's job.
That's not a limitation. It's a design decision.

## What the Browser Cannot Do Safely

Your browser runs code you can see.
Open DevTools → Sources, and every line of JavaScript is readable.
This means: **any secret in your browser is a public secret**.

API keys, auth tokens, bearer credentials — if they live in browser code,
anyone can open DevTools and steal them.
The browser is not a safe place for secrets.

The server exists precisely for this: to hold secrets and make privileged requests
that browsers cannot safely make themselves.`,
    },
    { kind: 'visual', content: '', visualKey: 'ClientServerSplit' },
    {
      kind: 'text',
      content: `## Why Not Call X's API From the Browser?

Two hard stops.

First: **CORS**. X's API doesn't allow browser JavaScript to call it directly.
The browser enforces this — the request gets blocked before your code reads the response.
(Module 7 covers CORS in full depth.)

Second: **secrets**. Calling X's API requires auth tokens.
Those tokens can't live in the browser — they'd be readable to anyone.
Something else needs to hold them and make the call.
That something is the Cloudflare Worker.`,
    },
    {
      kind: 'code',
      language: 'typescript',
      filename: 'worker/src/core/xClient.ts',
      content: `// This runs on the SERVER — the bearer token never reaches the browser.
// If this were in the frontend bundle, it would be visible to anyone.
const BEARER_TOKEN = env.BEARER_TOKEN  // injected as a Cloudflare secret

const headers = {
  Authorization: \`Bearer \${BEARER_TOKEN}\`,
  'x-guest-token': guestToken,
}

// Fetch directly from X's API — no CORS issues here because
// server-to-server requests don't go through the browser's origin policy.
const response = await fetch('https://api.x.com/graphql/...', { headers })`,
    },
    {
      kind: 'text',
      content: `## The Frontend Does More Than You'd Expect

Here's something interesting about how work gets split in this app.

The server handles: calling X's API, caching the result, returning structured JSON.
Your browser handles: parsing that JSON, building the article, generating the PDF.

**PDF generation runs 100% in your browser.** Not on the server. Not on a separate service.
In your browser, using a library called pdfmake.

This is called a "thick client." The idea is simple:
if the user's machine is doing the work, the server isn't paying for it.
Shift compute to the client wherever it's safe to do so.`,
    },
  ],
  quiz: [
    {
      question: 'Why can\'t the browser directly call X\'s API instead of routing through the Cloudflare Worker?',
      options: ['The browser is too slow to handle API responses', 'CORS policy blocks cross-origin browser requests, and secrets cannot be hidden in the browser', 'Cloudflare Workers are faster than browsers', 'X\'s API only accepts requests from Cloudflare IPs'],
      correctIndex: 1,
      explanation: 'Two reasons: (1) CORS blocks browser-to-X requests; (2) secrets like bearer tokens cannot safely live in client-side JS.',
    },
    {
      question: 'Where does PDF generation happen in this app?',
      options: ['On the Cloudflare Worker server', 'On X\'s servers', 'In the user\'s browser via pdfmake', 'On a separate PDF microservice'],
      correctIndex: 2,
      explanation: 'PDF generation is 100% client-side using pdfmake. This is a thick-client approach — shifting compute to the user\'s machine.',
    },
    {
      question: 'What is a "secret" in the context of backend engineering?',
      options: ['An encrypted database column', 'A config value like an API key that must not be visible in the frontend bundle', 'A hash of the user\'s password', 'A private Git repository'],
      correctIndex: 1,
      explanation: 'Secrets are credentials (API keys, tokens, passwords) that must stay server-side. If embedded in client JS, anyone can read them with DevTools.',
    },
    {
      question: 'What is the main role of the Cloudflare Worker in this app?',
      options: ['Render the React UI on the server', 'Generate PDF files', 'Act as a secure proxy: call X\'s API, cache results, bypass CORS', 'Store articles in a database'],
      correctIndex: 2,
      explanation: 'The worker is a backend proxy: it handles privileged operations (secret auth, CORS bypass, caching) that the browser cannot safely do.',
    },
    {
      question: 'What does "thick client" mean?',
      options: ['The browser downloads a large bundle', 'The client performs significant computation rather than offloading everything to the server', 'The server sends back HTML-rendered pages', 'The client is a desktop application'],
      correctIndex: 1,
      explanation: 'A thick client does substantial work locally (PDF generation, markdown building, ZIP packaging) rather than asking the server for everything.',
    },
  ],
}

export default lesson
