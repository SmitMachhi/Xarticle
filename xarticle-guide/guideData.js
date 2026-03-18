export const journeySteps = [
  {
    id: 'paste-url',
    label: '1. Paste URL',
    title: 'Step 1: Paste one public X link',
    copy:
      'Paste one public X link into the box. This app only starts once the user gives it a valid status or article URL.',
    highlightIds: ['browser', 'frontend-ui'],
  },
  {
    id: 'validate-send',
    label: '2. Frontend check',
    title: 'Step 2: The frontend checks the link and sends it',
    copy:
      'The frontend makes sure the link looks valid, shows loading text, and sends one request to the backend route at /api/extract.',
    highlightIds: ['frontend-ui', 'frontend-logic', 'extract-route'],
  },
  {
    id: 'worker-route',
    label: '3. Worker route',
    title: 'Step 3: The worker receives the request',
    copy:
      'The Cloudflare Worker is the backend door. It reads the URL, checks that it points to a supported X link, and decides which backend path to use.',
    highlightIds: ['extract-route', 'worker-router', 'cache'],
  },
  {
    id: 'fetch-source',
    label: '4. Fetch source',
    title: 'Step 4: The backend fetches raw X data',
    copy:
      'If the link is a status, the worker fetches status data. If the link is a direct article page, it fetches article HTML. Both paths are trying to collect raw source material.',
    highlightIds: ['worker-router', 'x-source', 'cache'],
  },
  {
    id: 'parse-clean',
    label: '5. Parse clean',
    title: 'Step 5: Worker and browser parsers clean the raw data together',
    copy:
      'The worker already reshapes some status data, and the browser finishes the job by turning the returned raw payloads or article HTML into one clean article shape the rest of the app can trust.',
    highlightIds: ['extract-route', 'frontend-logic', 'parser', 'article-model'],
  },
  {
    id: 'preview-export',
    label: '6. Preview and export',
    title: 'Step 6: The frontend shows the result and exports it',
    copy:
      'Now the browser already has the clean article object. The preview reads it, export tools reuse the same clean data, and image requests can pass through the image proxy route when needed.',
    highlightIds: ['article-model', 'preview', 'exports', 'image-route'],
  },
]

export const systemNodes = [
  { id: 'browser', label: 'User browser', note: 'Paste URL here', componentId: 'frontend' },
  { id: 'frontend-ui', label: 'Frontend UI', note: 'Input, buttons, preview shell', componentId: 'frontend' },
  { id: 'frontend-logic', label: 'Frontend logic', note: 'Validate, load, store state', componentId: 'frontend' },
  { id: 'extract-route', label: 'POST /api/extract', note: 'The main backend door', componentId: 'worker' },
  { id: 'worker-router', label: 'Worker router', note: 'Sends requests to the right room', componentId: 'worker' },
  { id: 'cache', label: 'Worker cache', note: 'Saved worker response for repeated URLs', componentId: 'worker' },
  { id: 'x-source', label: 'X source', note: 'Status data or article HTML', componentId: 'worker' },
  { id: 'parser', label: 'Parser layer', note: 'Cleans raw data', componentId: 'parser' },
  { id: 'article-model', label: 'Clean article object', note: 'One trusted internal shape', componentId: 'model' },
  { id: 'preview', label: 'Preview UI', note: 'Readable article view', componentId: 'frontend' },
  { id: 'image-route', label: 'GET /api/image', note: 'Safe image helper route', componentId: 'image-proxy' },
  { id: 'exports', label: 'Export tools', note: 'PDF, print, Markdown', componentId: 'exports' },
]

export const componentExplainers = [
  {
    id: 'frontend',
    label: 'Frontend',
    title: 'Frontend UI and state',
    copy:
      'This is the part the user sees. It holds the URL box, loading messages, preview area, and export controls. Its job is to start the request and show the result, not to do the hard scraping work itself.',
    why: 'Keeping the frontend focused makes it easier to change the design without touching backend logic.',
  },
  {
    id: 'worker',
    label: 'Worker backend',
    title: 'Worker backend',
    copy:
      'The worker is the backend door. It receives the request, checks the URL, reads cache, fetches the right X source, and sends back data the frontend can keep working with.',
    why: 'Putting this logic on the backend protects the browser from messy network details and source-specific rules.',
  },
  {
    id: 'parser',
    label: 'Parser layer',
    title: 'Parser layer',
    copy:
      'A parser is a cleaner and translator. In Xarticle.co, the worker and browser both do part of that cleanup so the rest of the app can trust one neat article shape.',
    why: 'If you skip this, every other part of your app has to deal with weird raw data on its own.',
  },
  {
    id: 'model',
    label: 'Article model',
    title: 'Clean article model',
    copy:
      'This is the app-owned shape for article data. It is like a neat folder with the title, blocks, media, warnings, and links all organized in one place.',
    why: 'One trusted shape lets the preview and exports reuse the same data instead of rebuilding it twice.',
  },
  {
    id: 'exports',
    label: 'Exports',
    title: 'Export pipeline',
    copy:
      'The export tools take the clean article model and turn it into PDF, printable PDF, or Markdown. They do not refetch X data.',
    why: 'Good systems reuse clean internal data instead of repeating work for every output.',
  },
  {
    id: 'image-proxy',
    label: 'Image proxy',
    title: 'Image proxy route',
    copy:
      'The image proxy is a small helper route at /api/image. It safely fetches allowed X image hosts so preview and export code can load images through one controlled backend path.',
    why: 'It keeps image loading controlled and avoids letting every part of the app fetch any random image URL directly.',
  },
]

export const compareViews = {
  real: {
    id: 'real',
    label: 'This app',
    title: 'This app: the real Xarticle.co flow',
    copy:
      'Xarticle.co has a frontend, a worker backend, cache, two fetch paths, parser logic, a clean article model, preview rendering, and export tools.',
    layers: [
      'Input box and load button',
      'Frontend validation and loading state',
      'One backend route: /api/extract',
      'Cache for repeated URLs',
      'Status path and article HTML path',
      'Image proxy route: /api/image',
      'Parser layer that normalizes the result',
      'Preview plus PDF and Markdown exports',
    ],
  },
  starter: {
    id: 'starter',
    label: 'Starter version',
    title: 'Starter version: build the tiny house first',
    copy:
      'Start with one backend route, one fetch step, one simple parser, and one result view. Add cache and exports later after the basic path works.',
    layers: [
      'One input box',
      'One submit button',
      'One backend route',
      'One fetch function',
      'One simple parser',
      'One result screen',
    ],
  },
}

export const fundamentals = [
  {
    title: 'One box, one job',
    copy: 'Each part should have one clear responsibility so bugs are easier to find and fix.',
  },
  {
    title: 'Clean data once',
    copy: 'Do the messy cleanup in one parser layer instead of spreading it across the whole app.',
  },
  {
    title: 'Use one trusted model',
    copy: 'A clean internal data shape lets many features reuse the same result.',
  },
  {
    title: 'Add upgrades later',
    copy: 'Cache, exports, and extra fetch paths are upgrades. Build the smallest working path first.',
  },
]

export const glossary = [
  ['Frontend', 'The part the user sees and clicks.'],
  ['Backend', 'The behind-the-scenes helper that does the heavy work.'],
  ['Route', 'A named backend door like /api/extract.'],
  ['Parser', 'The cleaner that turns messy data into neat data.'],
  ['State', 'The app memory while the page is open.'],
  ['Cache', 'Saved results so you do not repeat the same work.'],
  ['Payload', 'The data being sent from one part of the system to another.'],
  ['Domain model', 'The clean internal shape your app trusts.'],
]

export const buildChecklist = [
  'Make one page with a URL input and submit button.',
  'Create one backend endpoint that accepts the URL.',
  'Validate the URL before fetching.',
  'Fetch the source data from the backend.',
  'Parse only the fields you need first.',
  'Return one clean article object.',
  'Render that object in a readable result view.',
  'Add cache and export features only after the basic path works.',
]
