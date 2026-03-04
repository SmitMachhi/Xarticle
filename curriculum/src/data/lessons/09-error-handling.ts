import type { Lesson } from '../../types/curriculum.ts'

const lesson: Lesson = {
  moduleId: 9,
  sections: [
    {
      kind: 'text',
      content: `## Everything Will Break

Not might. **Will.**

APIs go down. Networks timeout. Servers crash. Rate limits hit.
Data arrives malformed. Connections drop mid-transfer.

The question is never "will this fail?"
The question is: **when this fails, what does your app do?**

A system that fails gracefully looks reliable.
A system that fails badly looks broken — even if the failure rate is identical.`,
    },
    {
      kind: 'text',
      content: `## Timeouts: Never Wait Forever

Without a timeout, one slow dependency can freeze everything.

X's API takes 60 seconds to respond on a bad day.
Without a timeout, every user requesting an article during that window just waits.
The request never fails — it just never finishes.

**With a timeout:** after 25 seconds, abort. Return a clear error. Free the connection.

You occasionally miss a slow response that would have succeeded.
But you guarantee no user waits more than 25 seconds.
That guarantee is worth the occasional miss.`,
    },
    { kind: 'visual', content: '', visualKey: 'TimeoutBar' },
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
      content: `## The Fallback Chain

This app has two ways to get article data.

**First try: Threadloom** — calls X's private GraphQL API.
Rich, structured data. Fast when it works.

**If that fails: Companion** — fetches the public page as HTML, parses the DOM.
Slower. Less data. But it works when Threadloom doesn't.

Only if both fail does the app show an error.

This is called a fallback chain.
Try the best option. Degrade gracefully if it fails.
Only surface an error as a last resort.`,
    },
    { kind: 'visual', content: '', visualKey: 'FallbackChainDiagram' },
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
      content: `## Fail Closed vs Fail Open

When something goes wrong, you have two choices.

**Fail closed:** refuse to proceed. Return an error.
→ Used at API boundaries. URL is missing? Return 400. Don't guess.

**Fail open:** continue with degraded data. Show what you have.
→ Used in the UI. Metrics unavailable? Show the article, skip the numbers.

Neither is universally right.
The right choice depends on what's worse:
processing invalid data, or refusing to process valid data.`,
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
