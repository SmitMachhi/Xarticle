import type { Lesson } from '../../types/curriculum.ts'

const lesson: Lesson = {
  moduleId: 1,
  sections: [
    {
      kind: 'text',
      content: `## The Web Is Just Messages

Right now, your browser sent a message.
Somewhere in a data center, a server read it and replied.

That exchange — request and reply — is literally everything the internet does.

Not fiber optics. Not data centers. Just messages going back and forth.

## The Language Those Messages Speak

Messages only work if both sides agree on format.
HTTP is that agreement — made in 1991, still running every website you've ever visited.

Think of it like postal mail. Every letter has a "To:" and a "From:" address.
HTTP adds one more thing: a **verb**. A verb tells the server what you want done.`,
    },
    { kind: 'visual', content: '', visualKey: 'RequestResponseFlow' },
    {
      kind: 'text',
      content: `## The Four Verbs That Run the Web

GET — "Give me this." You're asking for data.
POST — "Do something with what I'm sending." You're triggering an action.
PUT — "Replace this with what I'm sending." You're overwriting.
DELETE — "Remove this." You're destroying.

This app uses two.
GET /api/image — fetch a Twitter image to embed in the PDF.
POST /api/extract — send a tweet URL, get a parsed article back.

Notice POST for /api/extract. You're not fetching something that already exists.
You're sending raw material for the server to process. That's why POST.`,
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
      content: `## What the Server Says Back

Every response starts with a 3-digit number.
That number tells you what happened **before you read a single byte**.

200 — "Here's what you asked for."
404 — "I looked. It's not here."
500 — "Something broke on my end."

You've seen 404 before. You've felt 500 too — that's the blank error screen.
Now you know what they mean in code.`,
    },
    { kind: 'visual', content: '', visualKey: 'StatusCodeGrid' },
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
      options: ['The server crashed', 'You need to log in', 'The requested resource was not found', 'The request was malformed'],
      correctIndex: 2,
      explanation: '404 Not Found means the server received the request fine, but could not find what was asked for.',
    },
    {
      question: 'What is the Request-Response cycle?',
      options: ['A browser refreshing the page automatically', 'The client sends a request; the server processes it and replies', 'Two servers communicating with each other', 'A caching mechanism that stores responses'],
      correctIndex: 1,
      explanation: 'Every HTTP interaction follows this pattern: client sends a request, server does work, server sends back a response.',
    },
    {
      question: 'Which property on the fetch response tells you if the status was in the 200-299 range?',
      options: ['response.status === 200', 'response.ok', 'response.success', 'response.statusText'],
      correctIndex: 1,
      explanation: 'response.ok is a boolean that is true whenever the status code is between 200 and 299 (inclusive).',
    },
    {
      question: 'What does the cache: "no-store" option do in the fetch call?',
      options: ['Saves the response to localStorage', 'Tells the server not to cache anything', 'Tells the browser not to use or save a cached response', 'Enables service worker caching'],
      correctIndex: 2,
      explanation: 'cache: "no-store" instructs the browser to always make a real network request, ignoring and not storing any cached copy.',
    },
  ],
}

export default lesson
