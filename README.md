# X Article Printer (No Backend)

Utility webapp for exporting public X/Twitter posts and long-form articles to print-friendly PDFs.

- Input: paste one X/Twitter status URL or long-form article URL
- Output: preview + `Color PDF` and `B/W PDF`
- Runtime: fully client-side webapp
- Reliability mode: companion browser extension (recommended)

## Why companion extension is included

A pure web page cannot reliably fetch and parse X content due cross-origin and anti-bot behavior. This project still runs as a webapp, but can optionally use a lightweight extension bridge to fetch page HTML from the browser context.

No backend servers are required.

## Features in this MVP

- Status/article URL validation and auto-reject for unsupported links
- Public extraction pipeline with two modes:
  - Companion extension mode (preferred)
  - Fallback mode (`r.jina.ai`) when extension is unavailable
- Preview with author metadata, metrics, body blocks, inline media
- PDF download options:
  - Paper size: `A4` or `Letter`
  - Margin preset: `Default` or `Minimum`
  - Theme: `Color` or `B/W`
- Selectable text in generated PDFs

## Local development

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173`.

## Build

```bash
npm run build
npm run preview
```

## Companion extension (optional but recommended)

See [extension/README.md](./extension/README.md).

## Notes and limits

- This tool is designed for **public** X pages only.
- Bookmark count may be unavailable on public pages.
- If extraction fails in fallback mode, use the companion extension path.
- X page structure can change over time; parser updates may be needed.
