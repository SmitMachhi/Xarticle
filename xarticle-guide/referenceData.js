export const fundamentals = [
  {
    title: 'One box, one job',
    copy: 'Each part should have one clear responsibility so bugs are easier to find and fix.',
  },
  {
    title: 'Two input paths, one clean model',
    copy: 'Status URLs and article URLs take different roads, but they must end in the same trusted article shape.',
  },
  {
    title: 'GraphQL is only one branch',
    copy: 'GraphQL is important, but only for status URLs. Direct article URLs use raw HTML instead.',
  },
  {
    title: 'Renderers reuse the same data',
    copy: 'Preview, PDF, and Markdown all reuse the same clean article instead of each learning raw X data.',
  },
]

export const glossary = [
  ['Frontend', 'The part the user sees and clicks.'],
  ['Backend', 'The behind-the-scenes helper that does the heavy work.'],
  ['Route', 'A named backend door like /api/extract or /api/image.'],
  ['GraphQL', 'A structured way for the worker to ask X for tweet data by ID.'],
  ['Parser', 'The cleaner that turns messy data into neat data.'],
  ['State', 'The app memory while the page is open.'],
  ['Cache', 'Saved worker responses so the same URL does not need the full extraction work every time.'],
  ['Payload', 'The data being sent from one part of the system to another.'],
  ['Domain model', 'The clean internal shape your app trusts.'],
]
