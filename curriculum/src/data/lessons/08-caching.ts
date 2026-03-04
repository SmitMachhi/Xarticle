import type { Lesson } from '../../types/curriculum.ts'

const lesson: Lesson = {
  moduleId: 8,
  sections: [
    {
      kind: 'text',
      content: `## The Second Request Is Free

First time someone requests a particular article: **1,400 milliseconds**.
Wait. Fetch from X. Parse. Return.

Second time someone requests the same article: **38 milliseconds**.
Same article. Same data. 37× faster.

The difference is a cache.

## What Caching Actually Is

A cache is the simplest optimization in engineering.
Do expensive work once. Store the result. Serve the stored result next time.
No re-fetching. No re-processing. Just reading from memory.

In this app: the worker fetches an article from X's API — slow, rate-limited, expensive.
It stores the result in a Cloudflare Durable Object.
The next request for the same URL skips X's API entirely.

100 people request the same article in a minute?
**One real fetch. 99 cache hits.**
X's API sees 1 request, not 100.`,
    },
    { kind: 'visual', content: '', visualKey: 'CacheSimulator' },
    {
      kind: 'text',
      content: `## Why Workers Can't Cache on Their Own

Workers are stateless.
Every request runs in a fresh context. No shared memory. No global variables that persist.
An object you create in one request simply doesn't exist in the next.

So where does the cached data live?

**Cloudflare Durable Objects** — a separate primitive for stateful, persistent storage at the edge.
Each Durable Object is a tiny database with consistent identity across requests.
This app uses one as the article cache.

The worker asks: "Do you have data for this URL?"
Cache hit → return it instantly.
Cache miss → fetch from X, store it, then return it.`,
    },
    {
      kind: 'code',
      language: 'typescript',
      filename: 'worker/src/core/cacheStore.ts',
      content: `// A Durable Object class — Cloudflare instantiates and manages it.
// It has persistent storage that survives between requests.
export class CacheStore {
  private state: DurableObjectState

  constructor(state: DurableObjectState) {
    this.state = state
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === 'GET') {
      const key = url.searchParams.get('key') ?? ''
      const value = await this.state.storage.get<string>(key)
      if (!value) return new Response(null, { status: 404 })
      return new Response(value, { status: 200 })
    }

    if (request.method === 'PUT') {
      const key = url.searchParams.get('key') ?? ''
      const body = await request.text()
      await this.state.storage.put(key, body)
      return new Response(null, { status: 204 })
    }

    return new Response('Method not allowed', { status: 405 })
  }
}`,
    },
    {
      kind: 'text',
      content: `## Every Cache Entry Has an Expiry

Cached data goes stale.
An article cached 3 days ago has the same text — but different like counts, different views.
The metadata has drifted.

**TTL (Time To Live)** solves this. Every cache entry has a maximum age.
After that age, it's treated as if it doesn't exist — the next request fetches fresh.

This app's TTL choices:
Article data: 5 minutes — fresh enough for metrics, long enough to absorb traffic bursts
Guest tokens: 2 hours — matches X's actual token expiry
Query IDs: 6 hours — X rarely changes these, longer TTL is safe

TTL is always a tradeoff: too short and you lose the performance benefit,
too long and you serve stale data.`,
    },
    {
      kind: 'code',
      language: 'typescript',
      filename: 'worker/src/core/extractCache.ts',
      content: `const CACHE_TTL_MS = 5 * 60 * 1000  // 5 minutes

interface CacheEntry {
  data: unknown
  cachedAt: number  // timestamp
}

export async function readExtractCache(key: string, store: DurableObjectStub): Promise<unknown | null> {
  const raw = await store.fetch(\`/cache?key=\${encodeURIComponent(key)}\`)
  if (!raw.ok) return null

  const entry: CacheEntry = await raw.json()
  const age = Date.now() - entry.cachedAt

  // Expired? Treat as cache miss.
  if (age > CACHE_TTL_MS) return null

  return entry.data
}

export async function writeExtractCache(key: string, data: unknown, store: DurableObjectStub) {
  const entry: CacheEntry = { data, cachedAt: Date.now() }
  await store.fetch(\`/cache?key=\${encodeURIComponent(key)}\`, {
    method: 'PUT',
    body: JSON.stringify(entry),
  })
}`,
    },
  ],
  quiz: [
    {
      question: 'What problem does caching solve for this app?',
      options: [
        'It prevents users from submitting duplicate forms',
        'It avoids re-fetching the same article from X\'s API on repeated requests, saving latency and API calls',
        'It stores the user\'s session data between page reloads',
        'It compresses API responses to save bandwidth',
      ],
      correctIndex: 1,
      explanation: 'Caching stores expensive API results (1-3s to fetch) and serves them instantly on subsequent requests for the same URL.',
    },
    {
      question: 'Why do Cloudflare Workers need Durable Objects for caching, instead of just storing data in a JavaScript variable?',
      options: [
        'JavaScript variables are too slow for caching',
        'Workers are stateless — global variables don\'t persist between requests. Durable Objects provide persistent storage.',
        'Cloudflare doesn\'t allow global variables in Workers',
        'JavaScript variables are lost when the browser closes',
      ],
      correctIndex: 1,
      explanation: 'Workers run in isolated V8 contexts — no shared global state between requests. Durable Objects are the solution for persistent, stateful storage in the edge.',
    },
    {
      question: 'What does TTL stand for, and what does it control?',
      options: [
        'Total Transfer Load — the maximum response size',
        'Time To Live — how long a cached entry is considered valid before it must be re-fetched',
        'Token Transfer Limit — how many times an auth token can be used',
        'Type Transfer Layer — how JSON types are serialized',
      ],
      correctIndex: 1,
      explanation: 'TTL (Time To Live) is the maximum age of a cache entry. After TTL expires, the next request fetches fresh data instead of serving the stale cache.',
    },
    {
      question: 'Why does the extraction cache use a 5-minute TTL rather than a much longer one (e.g., 24 hours)?',
      options: [
        'Cloudflare limits Durable Object storage to 5 minutes',
        'Article metrics (likes, views) change frequently — a 5-minute window keeps data reasonably fresh while still reducing API load',
        'The bearer token expires every 5 minutes',
        'Browser caches also expire after 5 minutes',
      ],
      correctIndex: 1,
      explanation: 'A short TTL balances freshness (metrics update frequently) with efficiency (reduces duplicate API calls during traffic bursts).',
    },
    {
      question: 'What does a "cache miss" mean?',
      options: [
        'The cache server is offline',
        'The requested data was not found in the cache — the system must fetch it from the original source',
        'The cached data was corrupted',
        'The cache returned the wrong result',
      ],
      correctIndex: 1,
      explanation: 'A cache miss means the key wasn\'t in the cache (or was expired). The system falls back to the original source (X\'s API) and re-populates the cache.',
    },
  ],
}

export default lesson
