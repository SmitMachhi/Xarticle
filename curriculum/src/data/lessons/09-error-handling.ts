import type { Lesson } from '../../types/curriculum.ts'

const lesson: Lesson = {
  moduleId: 9,
  sections: [
    {
      kind: 'text',
      content: `Error Handling & Reliability

In backend engineering, failure is not an edge case — it's a certainty. Networks are unreliable. APIs go down. Responses time out. Rate limits kick in. Data is malformed.

The question isn't "will things fail?" — it's "how does the system behave when they do?"

Good error handling makes your app reliable and your users less frustrated. Bad error handling causes silent corruption, confusing states, and cascading failures.`,
    },
    {
      kind: 'text',
      content: `Timeouts

Every network call needs a timeout — a maximum time you're willing to wait before giving up.

Without timeouts, a single slow dependency (X's API taking 60 seconds to respond) would freeze your app forever, and every user requesting that article would pile up waiting.

This app uses two timeout strategies:
• 25-second frontend timeout — if the whole extraction takes too long, abort and show an error
• 20-second worker timeout — separate limit on the X API call within the worker`,
    },
    {
      kind: 'code',
      language: 'typescript',
      filename: 'src/lib/extractArticle.ts',
      content: `// AbortController + setTimeout = timeout pattern
function withTimeoutSignal(ms: number) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  return {
    signal: controller.signal,
    cancel: () => clearTimeout(timer),
  }
}

// Usage: the fetch will be cancelled after 25 seconds
const timeout = withTimeoutSignal(25_000)
try {
  const response = await fetch('/api/extract', {
    signal: timeout.signal,  // tied to the AbortController
    method: 'POST',
    body: JSON.stringify({ url }),
  })
  // ...
} catch (err) {
  if (err instanceof DOMException && err.name === 'AbortError') {
    throw new Error('Request timed out after 25 seconds')
  }
  throw err
} finally {
  timeout.cancel()  // always clean up the timer
}`,
    },
    {
      kind: 'text',
      content: `Fallbacks — Multiple Extraction Providers

The app has two ways to extract an article:
1. Threadloom — calls X's GraphQL API to get structured article data (preferred)
2. Companion — fetches raw HTML and parses the DOM (fallback)

If Threadloom fails (X changes their API, rate limits, etc.), the app automatically tries Companion. If Companion also fails, only then does the app surface an error.

This is called a fallback chain. It makes the system resilient to single-point failures.`,
    },
    {
      kind: 'diagram',
      content: `
  extractArticle(url)
       │
       ▼
  Try Threadloom
  (X's GraphQL API)
       │
  ┌────┴────────────────────┐
  │ Success?                │
  Yes                       No
  │                         │
  ▼                         ▼
  Return article        Try Companion
                        (HTML scraping)
                             │
                        ┌────┴────────────────────┐
                        │ Success?                │
                        Yes                       No
                        │                         │
                        ▼                         ▼
                    Return article         Throw Error
                                       "Could not extract"`,
      filename: 'Provider Fallback Chain',
    },
    {
      kind: 'code',
      language: 'typescript',
      filename: 'src/lib/extractArticle.ts',
      content: `// Structured tracking of which providers were tried
const providerAttempts: ProviderAttempt[] = []

// Try provider 1: Threadloom
try {
  const result = await parseThreadloomStatusResponse(backendData)
  providerAttempts.push({ provider: 'threadloom', ok: true, message: 'OK' })
  return { article: result, providerAttempts }
} catch (err) {
  providerAttempts.push({
    provider: 'threadloom',
    ok: false,
    message: String(err),
  })
}

// Fallback to provider 2: Companion (HTML parsing)
try {
  const result = await parseXHtmlDocument(backendData)
  providerAttempts.push({ provider: 'companion', ok: true, message: 'OK' })
  return { article: result, providerAttempts }
} catch (err) {
  providerAttempts.push({ provider: 'companion', ok: false, message: String(err) })
  throw new Error('All extraction providers failed')
}`,
    },
    {
      kind: 'text',
      content: `Fail Closed vs Fail Open

A key decision in error handling: when something goes wrong, do you fail closed (reject the request) or fail open (proceed anyway with degraded data)?

Fail closed: safer. "If I can't validate this, I won't process it."
Example: the worker returns 400 if the URL is missing — it refuses to proceed.

Fail open: more permissive. "If metrics are unavailable, show what I have."
Example: the app shows null for view counts rather than refusing to render.

This app uses both, appropriately: strict at API boundaries (fail closed), graceful in display (fail open).`,
    },
  ],
  quiz: [
    {
      question: 'What is an AbortController used for in the fetch call?',
      options: [
        'Cancelling a DOM event listener',
        'Aborting a fetch request after a timeout, preventing it from hanging indefinitely',
        'Stopping a CSS animation mid-play',
        'Throwing a specific error type for debugging',
      ],
      correctIndex: 1,
      explanation: '`AbortController` + `signal` lets you cancel a fetch in-flight. The `setTimeout` triggers `controller.abort()` after 25s, which throws an `AbortError` in the fetch.',
    },
    {
      question: 'What is a "fallback chain" and why does this app use one?',
      options: [
        'A chain of CSS fallback fonts',
        'A sequence of try-next providers — if the first fails, try the second — making the system resilient to single-point failures',
        'A series of database retry attempts',
        'A list of backup servers to route traffic to',
      ],
      correctIndex: 1,
      explanation: 'The app tries Threadloom first (X\'s API), then Companion (HTML parsing) if Threadloom fails. This ensures the app works even if one extraction method breaks.',
    },
    {
      question: 'Why do all network calls need a timeout?',
      options: [
        'To prevent the browser from caching the response',
        'To comply with HTTP/2 protocol requirements',
        'Without timeouts, a slow dependency freezes the system indefinitely — other requests pile up waiting',
        'To prevent server overload from long-running requests',
      ],
      correctIndex: 2,
      explanation: 'Without a timeout, one slow API call blocks the request forever. With 25s timeout, the system fails fast and shows the user a clear error.',
    },
    {
      question: 'What does "fail closed" mean in error handling?',
      options: [
        'The server shuts down when an error occurs',
        'On failure, the system rejects the request rather than proceeding with potentially invalid/incomplete data',
        'The error is logged but the operation continues normally',
        'The server closes the HTTP connection on error',
      ],
      correctIndex: 1,
      explanation: '"Fail closed" means rejecting or stopping on error — the safe default. The worker returns 400 if the URL is missing rather than trying to process null.',
    },
    {
      question: 'Why does the app track `providerAttempts` in the returned article data?',
      options: [
        'For billing purposes — Threadloom costs more than Companion',
        'For observability — it tells you which providers were tried and whether they succeeded, without requiring separate logging',
        'To determine which export format to use',
        'To populate the article\'s warnings field for GDPR compliance',
      ],
      correctIndex: 1,
      explanation: '`providerAttempts` embeds observability directly in the domain model. You can see what happened during extraction without needing to grep server logs.',
    },
  ],
}

export default lesson
