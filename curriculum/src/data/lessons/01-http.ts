import type { Lesson } from '../../types/curriculum.ts'

const lesson: Lesson = {
  moduleId: 1,
  sections: [
    {
      kind: 'text',
      content: `The Internet & HTTP

Every time you load a website, your computer sends a message to another computer and waits for a reply. That's literally the internet — a global network of machines passing messages back and forth.

The language those messages are written in is called HTTP (HyperText Transfer Protocol). It's a simple convention everyone agreed to follow, like how postal mail has a "To:" and a "From:" address.`,
    },
    {
      kind: 'diagram',
      content: `
  Your Browser (Client)           Server (e.g. Cloudflare Worker)
  ┌─────────────────────┐         ┌────────────────────────────┐
  │                     │         │                            │
  │  "Hey, give me      │────────▶│  receives request          │
  │   /api/extract"     │  HTTP   │  runs some code            │
  │                     │◀────────│  sends back JSON           │
  │  receives JSON      │ Response│                            │
  └─────────────────────┘         └────────────────────────────┘

  This is called the Request-Response cycle.
  Every network interaction in the app follows this pattern.`,
      filename: 'Request-Response Cycle',
    },
    {
      kind: 'text',
      content: `HTTP Methods

Every HTTP request has a METHOD — a verb that says what you want to do:

GET    — "Give me this resource." (reading data)
POST   — "Here's some data, do something with it." (creating / triggering)
PUT    — "Replace this resource entirely." (updating)
DELETE — "Remove this resource." (deleting)

In this app, we only use two:
• GET for fetching images via /api/image
• POST for triggering article extraction via /api/extract`,
    },
    {
      kind: 'code',
      language: 'typescript',
      filename: 'src/lib/extractArticle.ts',
      content: `// This is the actual fetch call in the app.
// Notice: method: 'POST' because we're SENDING a URL for the server to process.
const response = await fetch('/api/extract', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ url: sourceUrl }),  // the payload
  cache: 'no-store',
  signal: timeout.signal,                    // 25s timeout
})`,
    },
    {
      kind: 'text',
      content: `Status Codes

The server's reply always includes a status code — a 3-digit number that tells you what happened:

2xx — Success
  200 OK            Everything worked fine.
  201 Created       New resource was created.

4xx — Your fault (client error)
  400 Bad Request   You sent something malformed.
  401 Unauthorized  You need to authenticate first.
  404 Not Found     That resource doesn't exist.

5xx — Their fault (server error)
  500 Internal Server Error   The server crashed.
  503 Service Unavailable     The server is overwhelmed.

When the app gets back a non-200, it throws an error to show the user something went wrong.`,
    },
    {
      kind: 'code',
      language: 'typescript',
      filename: 'src/lib/extractArticle.ts',
      content: `// After every fetch, we check the status code first
if (!response.ok) {
  // response.ok is true when status is 200-299
  const text = await response.text()
  throw new Error(\`Extract failed [\${response.status}]: \${text}\`)
}

// Only parse JSON when we know it succeeded
const data = await response.json()`,
    },
  ],
  quiz: [
    {
      question: 'What HTTP method does this app use when asking the server to extract an article?',
      options: ['GET', 'POST', 'PUT', 'DELETE'],
      correctIndex: 1,
      explanation: 'POST is used when sending data to trigger an action — here, we send the URL for the server to process.',
    },
    {
      question: 'What does a 404 status code mean?',
      options: [
        'The server crashed',
        'You need to log in',
        'The requested resource was not found',
        'The request was malformed',
      ],
      correctIndex: 2,
      explanation: '404 Not Found means the server received the request fine, but couldn\'t find what was asked for.',
    },
    {
      question: 'What is the Request-Response cycle?',
      options: [
        'A browser refreshing the page automatically',
        'The client sends a request; the server processes it and replies',
        'Two servers communicating with each other',
        'A caching mechanism that stores responses',
      ],
      correctIndex: 1,
      explanation: 'Every HTTP interaction follows this pattern: client sends a request, server does work, server sends back a response.',
    },
    {
      question: 'Which property on the fetch response tells you if the status was in the 200-299 range?',
      options: ['response.status === 200', 'response.ok', 'response.success', 'response.statusText'],
      correctIndex: 1,
      explanation: '`response.ok` is a boolean that is `true` whenever the status code is between 200 and 299 (inclusive).',
    },
    {
      question: 'What does the `cache: "no-store"` option do in the fetch call?',
      options: [
        'Saves the response to localStorage',
        'Tells the server not to cache anything',
        'Tells the browser not to use or save a cached response',
        'Enables service worker caching',
      ],
      correctIndex: 2,
      explanation: '`cache: "no-store"` instructs the browser to always make a real network request, ignoring and not storing any cached copy.',
    },
  ],
}

export default lesson
