import type { Lesson } from '../../types/curriculum.ts'

const lesson: Lesson = {
  moduleId: 4,
  sections: [
    {
      kind: 'text',
      content: `## "Serverless" Is a Lie — But a Useful One

There's obviously a server somewhere.
What "serverless" actually means: it's not your server to manage.

Traditional model: rent a virtual machine. Install Node.js. Keep it running 24/7.
Pay whether it handles 1 request or 1 million. Patch the OS. Manage the runtime.

Serverless model: write a function. Upload it. Done.
The provider wakes it up when a request arrives, runs it, bills you for milliseconds.
If no requests come? You pay nothing.`,
    },
    { kind: 'visual', content: '', visualKey: 'TraditionalVsServerless' },
    {
      kind: 'text',
      content: `## Edge Computing: Closer Than You Think

Cloudflare Workers run at the "edge."
Here's what that word actually means: when you make a request from London,
the code runs in London. From Tokyo — Tokyo. From São Paulo — São Paulo.

Cloudflare has 300+ datacenters worldwide.
Your request goes to the nearest one, not a central server in Virginia.

Why does this matter? **Physics.** Data travels at roughly the speed of light.
The shorter the distance, the less time it takes.
Edge computing is arbitrage on physics.`,
    },
    {
      kind: 'code',
      language: 'toml',
      filename: 'wrangler.toml',
      content: `# Cloudflare's config file (like package.json but for Workers)
name = "xarticle-extract-worker"
main = "worker/src/index.ts"          # entry point
compatibility_date = "2026-02-27"     # runtime version pin

[assets]
directory = "./dist"                  # serve built React app from here
not_found_handling = "single-page-application"  # all routes → index.html`,
    },
    {
      kind: 'code',
      language: 'typescript',
      filename: 'worker/src/index.ts',
      content: `// This is the entire worker entry point.
// Cloudflare calls the fetch() handler on every incoming HTTP request.
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/api/extract') {
      return handleExtract(request, env)
    }

    if (url.pathname === '/api/image') {
      return handleImage(request)
    }

    // Fall through to serving static assets (the React app)
    return env.ASSETS.fetch(request)
  },
}`,
    },
    {
      kind: 'text',
      content: `## What Workers Can't Do

Serverless has real constraints. They're not bugs — they're the tradeoffs you accept.

**No file system.** You can't write a file to disk between requests. There's no disk.
**No persistent memory.** A global variable set in one request won't exist in the next.
**CPU time limit.** Workers get 30 seconds max.

These constraints are why this app uses **Durable Objects** for caching —
a separate Cloudflare primitive built for stateful, persistent storage.
The worker itself stays stateless. The Durable Object holds the cache.`,
    },
  ],
  quiz: [
    {
      question: 'What does "serverless" actually mean in practice?',
      options: [
        'There is no server at all — everything runs in the browser',
        'You write a function; the cloud provider handles all infrastructure management',
        'The server runs without an operating system',
        'Requests are processed without any computation',
      ],
      correctIndex: 1,
      explanation: 'Serverless means you don\'t manage servers. The provider handles runtime, scaling, and infrastructure. You only write the function logic.',
    },
    {
      question: 'What is "edge computing" and why does it matter for latency?',
      options: [
        'Running code at the browser edge using WebAssembly',
        'Running code at the physical datacenter closest to the user, reducing round-trip travel time',
        'Running code at the edge of a local network (like a router)',
        'A CPU optimization technique for low-latency processing',
      ],
      correctIndex: 1,
      explanation: 'Edge computing runs your code in the datacenter closest to the user. Less physical distance = less network latency.',
    },
    {
      question: 'What file tells Cloudflare how to deploy the worker and serve assets?',
      options: ['package.json', 'vite.config.ts', 'wrangler.toml', 'tsconfig.json'],
      correctIndex: 2,
      explanation: 'wrangler.toml is Cloudflare\'s config file — it specifies the worker name, entry point, and where to serve static assets from.',
    },
    {
      question: 'Why can\'t you store data in a global variable in a Cloudflare Worker and expect it to persist between requests?',
      options: [
        'Global variables are not supported in TypeScript',
        'Each request runs in an isolated V8 context — there\'s no shared memory between requests',
        'Cloudflare clears variables after each response',
        'Workers do not have access to heap memory',
      ],
      correctIndex: 1,
      explanation: 'Workers use V8 isolates — each request gets its own isolated execution. State doesn\'t persist between requests (which is why this app uses Durable Objects for caching).',
    },
    {
      question: 'What does the worker do when it receives a request for a path it doesn\'t recognize (not /api/extract or /api/image)?',
      options: [
        'Returns a 404 error',
        'Redirects to the homepage',
        'Falls through to serve the React app\'s static assets',
        'Logs the error and returns 500',
      ],
      correctIndex: 2,
      explanation: 'The worker falls through to `env.ASSETS.fetch(request)` which serves the built React app. This is how the SPA gets served from the same worker.',
    },
  ],
}

export default lesson
