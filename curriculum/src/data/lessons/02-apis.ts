import type { Lesson } from '../../types/curriculum.ts'

const lesson: Lesson = {
  moduleId: 2,
  sections: [
    {
      kind: 'text',
      content: `## A Contract, Not a Mystery

Every API you'll ever use is the same thing underneath.
A contract: "Send me data in this shape. I'll send you data in that shape."

The complexity people associate with APIs isn't in the concept.
It's in the specifics — what shape, what format, what endpoint.
Learn those specifics, and there's nothing left to understand.

## The Restaurant Menu — But Actually Useful

Imagine you walk into a restaurant.
You don't go into the kitchen and start cooking.
You read the menu, pick something, and the kitchen handles the rest.

APIs work exactly like this.
The menu is the API documentation.
The dishes are the endpoints.
You order in their format. They serve in theirs.

This app orders from X's API: "Give me tweet 1234567."
X serves back: a blob of JSON with the article content inside.`,
    },
    {
      kind: 'text',
      content: `## Why JSON Won

JSON isn't technically the best format.
It's just the one everyone agreed on — and that agreement is worth more than technical superiority.

Three reasons it stuck:
1. You can read it. Open DevTools, look at the response, understand it.
2. Every language parses it — Python, Go, Rust, TypeScript, all native.
3. It maps naturally to objects and arrays, which is how programmers think.

The response this app gets from the worker is JSON.
Explore it below — you'll see the exact shape the data arrives in.`,
    },
    { kind: 'visual', content: '', visualKey: 'JsonExplorer' },
    {
      kind: 'text',
      content: `## The "kind" Field — One Endpoint, Multiple Shapes

Look at the response. It has a "kind" field.
This is one of the most useful patterns in API design.

The same endpoint can return fundamentally different data structures.
The "kind" field is the key that tells you which one arrived.

kind: "status" → full article data from X's GraphQL API
kind: "article-html" → raw HTML for the client to parse itself

Without this discriminator, you'd have to guess what shape you received.
With it, you branch cleanly: if kind is X, parse like this.`,
    },
    {
      kind: 'code',
      language: 'typescript',
      filename: 'worker/src/routes/extract.ts',
      content: `// The worker reads the request body as JSON
const body = await request.json() as { url?: unknown }
const { url } = body

// Validates the input before doing anything with it
if (typeof url !== 'string' || !url.trim()) {
  return new Response(JSON.stringify({ error: 'url is required' }), {
    status: 400,
    headers: { 'content-type': 'application/json' },
  })
}`,
    },
  ],
  quiz: [
    {
      question: 'What does API stand for, and what does it really mean in practice?',
      options: ['Advanced Programming Interface — special compiler features', 'Application Programming Interface — a contract defining how to send/receive data', 'Automated Process Integration — scripts that run on a schedule', 'Application Protocol Interface — a network routing standard'],
      correctIndex: 1,
      explanation: 'An API is a contract: "send me data in this shape, I will send you data back in that shape." REST APIs use HTTP for this.',
    },
    {
      question: 'Why does the /api/extract endpoint use POST instead of GET?',
      options: ['POST is faster than GET', 'POST requests can have a body — we need to send a URL payload to the server', 'GET requests are not supported by Cloudflare Workers', 'POST skips browser caching automatically'],
      correctIndex: 1,
      explanation: 'GET requests have no body. Since we need to send a URL string to the server, POST is the right method.',
    },
    {
      question: 'What does the "kind" field in the API response tell the frontend?',
      options: ['Which HTTP method to use next', 'The status code of the response', 'What shape the rest of the response data will be in', 'How long to cache the response'],
      correctIndex: 2,
      explanation: 'The "kind" field is a discriminator — it tells the frontend which parser to use (threadloom vs HTML parser).',
    },
    {
      question: 'Why does the server validate that "url" is a string before processing it?',
      options: ['TypeScript requires it at compile time', 'JSON can contain any type — the server must check at runtime to avoid crashes', 'The X API requires URL validation', 'Cloudflare Workers block non-string inputs automatically'],
      correctIndex: 1,
      explanation: 'At API boundaries, data comes from the outside world as untyped JSON. You must validate at runtime, not just trust TypeScript types.',
    },
    {
      question: 'What makes JSON the dominant API data format?',
      options: ['It compresses better than XML', 'It was invented by the HTTP working group', 'It is human-readable and natively supported by virtually every programming language', 'It supports binary data natively'],
      correctIndex: 2,
      explanation: 'JSON won because it is readable, language-agnostic, and maps naturally to objects/arrays in most languages.',
    },
  ],
}

export default lesson
