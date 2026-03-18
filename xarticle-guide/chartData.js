export const chartSummary = {
  copy:
    'This chart shows the real runtime system, not a simplified fairy tale. Xarticle.co has one shared entry path, then it splits into a status URL path that uses GraphQL and an article URL path that fetches raw HTML.',
  title: 'Runtime system chart',
}

export const chartGroups = [
  {
    id: 'entry',
    title: 'Shared entry path',
    nodeIds: ['browser', 'clipboard-paste', 'url-section', 'extraction-state', 'x-url', 'extract-client', 'extract-route', 'worker-router', 'worker-cache'],
  },
  {
    id: 'status',
    title: 'Status URL -> GraphQL path',
    nodeIds: ['status-branch', 'graphql', 'x-parsing', 'tweet-mapper', 'worker-article-parser', 'threadloom-parser'],
  },
  {
    id: 'article',
    title: 'Article URL -> HTML path',
    nodeIds: ['article-branch', 'article-fetch', 'html-parser', 'document-parser'],
  },
  {
    id: 'shared-output',
    title: 'Shared clean model and outputs',
    nodeIds: ['article-model', 'preview', 'image-proxy', 'image-route', 'pdf-export', 'markdown-export'],
  },
]

export const systemNodes = [
  { id: 'browser', label: 'User browser', note: 'A person pastes an X URL into the page.', componentId: 'main-entry' },
  { id: 'clipboard-paste', label: 'useClipboardPaste', note: 'Optional helper for pasting a copied X link into the input.', componentId: 'clipboard-paste' },
  { id: 'url-section', label: 'UrlSection', note: 'The visible input box and load button.', componentId: 'url-section-ui' },
  { id: 'extraction-state', label: 'useExtractionState', note: 'Owns URL, loading, error, and article state.', componentId: 'extraction-state' },
  { id: 'x-url', label: 'xUrl.ts', note: 'Normalizes the URL and classifies status vs article.', componentId: 'x-url' },
  { id: 'extract-client', label: 'extractArticle.ts', note: 'Calls the backend and chooses the right browser parser.', componentId: 'extract-client' },
  { id: 'extract-route', label: 'POST /api/extract', note: 'The single extraction door on the worker.', componentId: 'extract-route' },
  { id: 'worker-router', label: 'worker/src/index.ts', note: 'Routes /health, /api/image, and /api/extract.', componentId: 'worker-index' },
  { id: 'worker-cache', label: 'extractCache.ts', note: 'Checks and stores cached extract responses by URL.', componentId: 'worker-cache' },
  { id: 'status-branch', label: 'Status branch', note: 'Used when the input URL contains a status ID.', componentId: 'worker-url' },
  { id: 'graphql', label: 'GraphQL TweetResultByRestId', note: 'The worker asks X for tweet data through GraphQL.', componentId: 'x-client' },
  { id: 'x-parsing', label: 'xParsing.ts', note: 'Unwraps the GraphQL result and discovers X query details.', componentId: 'x-parsing' },
  { id: 'tweet-mapper', label: 'tweetMapper.ts', note: 'Shapes X tweet data into the worker payload contract.', componentId: 'tweet-mapper' },
  { id: 'worker-article-parser', label: 'worker articleParser.ts', note: 'Parses embedded article content inside the tweet data.', componentId: 'worker-article-parser' },
  { id: 'threadloom-parser', label: 'threadloomParser.ts', note: 'Finishes the browser-side status path and builds the clean article.', componentId: 'threadloom-parser' },
  { id: 'article-branch', label: 'Article branch', note: 'Used when the input URL points to an article page.', componentId: 'worker-url' },
  { id: 'article-fetch', label: 'Fetch raw article HTML', note: 'The worker fetches raw HTML instead of GraphQL data.', componentId: 'extract-route' },
  { id: 'html-parser', label: 'src/lib/articleParser.ts', note: 'Browser HTML parser that builds the article model.', componentId: 'html-parser' },
  { id: 'document-parser', label: 'article-parser/document.ts', note: 'Walks the DOM and turns tags into article blocks.', componentId: 'document-parser' },
  { id: 'article-model', label: 'ExtractedArticle', note: 'The clean shared model the rest of the app trusts.', componentId: 'article-model' },
  { id: 'preview', label: 'ArticlePreview', note: 'Renders the clean article on screen.', componentId: 'article-preview' },
  { id: 'image-proxy', label: 'imageProxy.ts', note: 'Frontend bridge that rewrites asset URLs to /api/image.', componentId: 'image-proxy' },
  { id: 'image-route', label: 'GET /api/image', note: 'Safe image helper route for preview and PDF asset loading.', componentId: 'image-route' },
  { id: 'pdf-export', label: 'pdfExport.ts', note: 'Turns the clean article into a PDF or print job.', componentId: 'pdf-export' },
  { id: 'markdown-export', label: 'markdownExport.ts', note: 'Turns the clean article into Markdown or a ZIP with assets.', componentId: 'markdown-export' },
]

export const runtimePaths = [
  {
    id: 'status-graphql',
    label: 'Status URL + GraphQL',
    title: 'Status URL path',
    copy:
      'This path starts with an X status URL. The worker extracts the status ID, talks to X through GraphQL, reshapes the tweet and embedded article data, then the browser finishes the status parser and creates the clean article.',
    focusNodeIds: ['browser', 'clipboard-paste', 'url-section', 'extraction-state', 'x-url', 'extract-client', 'extract-route', 'worker-router', 'worker-cache', 'status-branch', 'graphql', 'x-parsing', 'tweet-mapper', 'worker-article-parser', 'threadloom-parser', 'article-model', 'preview', 'image-proxy', 'pdf-export', 'markdown-export', 'image-route'],
    steps: [
      'Frontend classifies the input as a status URL.',
      'Worker extracts the status ID and checks the worker cache.',
      'xClient.ts discovers query ID, bearer token, and guest token, then calls GraphQL TweetResultByRestId.',
      'xParsing.ts unwraps the GraphQL response.',
      'tweetMapper.ts shapes the tweet payload and worker articleParser.ts shapes the embedded article blocks.',
      'The worker returns a status payload, and threadloomParser.ts in the browser turns it into ExtractedArticle.',
    ],
  },
  {
    id: 'article-html',
    label: 'Article URL + HTML',
    title: 'Article URL path',
    copy:
      'This path starts with a direct article URL. The worker does not use GraphQL here. It fetches raw HTML, sends that HTML back, and the browser parser turns the raw HTML into the clean article model.',
    focusNodeIds: ['browser', 'clipboard-paste', 'url-section', 'extraction-state', 'x-url', 'extract-client', 'extract-route', 'worker-router', 'worker-cache', 'article-branch', 'article-fetch', 'html-parser', 'document-parser', 'article-model', 'preview', 'image-proxy', 'pdf-export', 'markdown-export', 'image-route'],
    steps: [
      'Frontend classifies the input as an article URL.',
      'Worker extracts the article ID and checks the worker cache.',
      'Worker fetches the raw article HTML page.',
      'Worker returns { kind: article-html, html, finalUrl }.',
      'src/lib/articleParser.ts parses the HTML in the browser.',
      'article-parser/document.ts walks the DOM and creates ArticleBlock entries for the shared ExtractedArticle model.',
    ],
  },
]
