# Xarticle.co

Turn one public X/Twitter URL into clean exports.

## What It Does

- Accepts one public X status URL or long-form article URL.
- Calls a single stateless backend endpoint: `POST /api/extract`.
- Extracts status/article content and renders an in-browser preview.
- Exports:
  - PDF for human reading
  - Markdown for LLM workflows
  - Offline Markdown ZIP (`article.md` + `assets/`) when media exists

## Current Architecture

- Frontend: React + TypeScript + Vite
- Worker backend: Cloudflare Worker at `worker/src/index.ts`
  - Routes: `POST /api/extract`, `GET /health`
- Parsing and exports are modularized under `src/lib/*`:
  - article parsing
  - thread/status parsing
  - markdown export pipeline
  - pdf export pipeline
- Browser extension companion scripts are TypeScript under `extension/`

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Backend Local Dev

```bash
wrangler dev
```

Frontend defaults to same-origin `/api/extract`. Override with:

- `VITE_EXTRACT_API_URL=<full-endpoint-url>`

## Scripts

- `npm run dev` -> start Vite dev server
- `npm run build` -> type-check + production build
- `npm run preview` -> preview production build
- `npm run lint` -> strict lint gates
- `npm run test:run` -> unit/regression tests
- `npm run test:e2e` -> Playwright smoke test

## Input Support

Supported:

- `https://x.com/<handle>/status/<id>`
- `https://x.com/i/articles/<id>`

Not supported:

- private/locked accounts
- non-X URLs
- malformed URLs

## Privacy and Limits

- No login required.
- No persistent storage of extracted content in app runtime.
- Public pages only.
- Upstream X markup/API behavior can change and affect extraction quality.
- Some metrics may be unavailable depending on upstream payloads.

## Why It Exists

Reading long posts in timeline UI is painful.
Xarticle.co makes them portable and readable.
