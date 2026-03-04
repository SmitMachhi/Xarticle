import type { Lesson } from '../../types/curriculum.ts'

const lesson: Lesson = {
  moduleId: 4,
  sections: [
    {
      kind: 'text',
      content: `Serverless & Edge Computing

"Serverless" is a marketing term that sounds paradoxical — obviously there's a server somewhere. What it really means: you write a function, a cloud provider runs it when needed, and you don't manage any machines.

Traditional model: you rent a virtual machine, install Node.js, keep it running 24/7, pay for idle time, patch the OS, manage deployments.

Serverless model: you write a function. The provider handles everything else. You only pay when code actually runs.`,
    },
    {
      kind: 'diagram',
      content: `
  Traditional Server                    Serverless (Cloudflare Workers)
  ═══════════════════════               ═════════════════════════════════
  ┌────────────────────┐                ┌─────────────────────────────┐
  │  Always running    │                │  Sleeps until request comes │
  │  1 location        │                │  Wakes in < 1ms             │
  │  You manage OS     │                │  Runs in 300+ edge locations│
  │  You patch Node    │                │  Provider manages runtime   │
  │  Pay 24/7          │                │  Pay per request            │
  └────────────────────┘                └─────────────────────────────┘`,
      filename: 'Traditional vs Serverless',
    },
    {
      kind: 'text',
      content: `Cloudflare Workers — Edge Computing

Cloudflare Workers run at the "edge" — meaning they execute in the Cloudflare datacenter closest to the user. London user? London datacenter. Tokyo user? Tokyo datacenter.

This matters because network latency (the time for a packet to travel) is proportional to physical distance. By running code close to the user, the worker reduces round-trip time dramatically.

Workers use a V8 isolate model (same JavaScript engine as Chrome) rather than traditional Node.js. Each request gets its own isolated execution context. No shared state between requests.`,
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
      content: `Limitations of Serverless

Workers are powerful but have constraints you must design around:

• No persistent file system — can't write files to disk
• Short execution time — Cloudflare Workers have a 30-second CPU limit
• Cold starts are near-zero for Workers (unlike AWS Lambda which can take 100ms+)
• No shared memory between requests — you can't store state in a global variable and expect it to persist

These constraints pushed this app to use Durable Objects for caching and to keep the worker stateless per-request.`,
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
