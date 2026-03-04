import type { Lesson } from '../../types/curriculum.ts'

const lesson: Lesson = {
  moduleId: 2,
  sections: [
    {
      kind: 'text',
      content: `APIs & JSON

API stands for Application Programming Interface. Strip the jargon: an API is just a contract. It says "send me a request in THIS shape, and I'll send you a response in THAT shape."

A restaurant menu is a decent analogy. The menu (API docs) tells you what you can order (endpoints), what you must specify (parameters), and what you'll get back (response).

REST (Representational State Transfer) is the most common style of API. It uses HTTP methods and URLs to represent actions on "resources" (things like articles, users, images).`,
    },
    {
      kind: 'text',
      content: `JSON — The Universal Language

JSON (JavaScript Object Notation) became the default data format for APIs because:
1. It's human-readable — you can open it in a text editor and understand it
2. Every language can parse it — Python, Go, Rust, TypeScript, all support it natively
3. It maps naturally to how data is structured in most languages

Explore the actual shape of the response this app gets from the worker:`,
    },
    { kind: 'visual', content: '', visualKey: 'JsonExplorer' },
    {
      kind: 'text',
      content: `The "kind" Field — Discriminated Responses

Notice the response has a "kind" field. This is a common API pattern: the shape of the response depends on what kind it is.

If kind is "status" → the tweet had an embedded article, parsed from X's API.
If kind is "article-html" → the server fetched raw HTML, returned for the client to parse.

The frontend uses this discriminator to decide which parser to call.`,
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
