import type { Lesson } from '../../types/curriculum.ts'

const lesson: Lesson = {
  moduleId: 3,
  sections: [
    {
      kind: 'text',
      content: `Client-Server Architecture

When you open this app, two computers are involved: yours and Cloudflare's.

Yours is the CLIENT — it runs the React UI in your browser. It shows you buttons, accepts input, renders the article preview.

Cloudflare's machine is the SERVER — it does the heavy lifting that your browser can't: talking to X's private API, bypassing CORS, caching responses.

Neither side could do the job alone. The split exists because each environment has different capabilities and trust levels.`,
    },
    { kind: 'visual', content: '', visualKey: 'ClientServerSplit' },
    {
      kind: 'text',
      content: `Why Can't The Browser Just Call X's API Directly?

Two reasons:

1. CORS — X's API does not allow browser JavaScript to call it directly. The browser would block it. The worker calls it server-to-server where CORS doesn't apply. (We'll cover CORS properly in Module 7.)

2. Secrets — To talk to X's API, you need auth tokens (like a guest token + bearer token). If those tokens lived in the browser's JavaScript bundle, anyone could open DevTools and steal them. On the server, secrets stay hidden.`,
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
      content: `The Frontend is "Thick" on Purpose

Look at how the app distributes work:

SERVER does: talk to X's API, cache the raw data, return structured JSON.
CLIENT does: parse that JSON into blocks, render them, generate the export files.

PDF generation happens 100% in your browser via pdfmake. This is called a "thick client" architecture — it shifts compute to the user's machine to save server costs.`,
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
