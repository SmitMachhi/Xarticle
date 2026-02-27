# Xarticle.co

Turn a public X/Twitter link into a readable export.

## What this app does

- Accepts one public X status URL or X long-form article URL.
- Uses a minimal stateless backend endpoint (`/api/extract`) for extraction.
- Resolves statuses/threads through `fxtwitter` from backend only (not browser-direct).
- Resolves long-form article URLs by fetching HTML server-side and parsing client-side.
- Shows a clean in-browser preview before you download.
- Exports PDF for humans.
- Exports Markdown for LLM workflows.
- If media exists, Markdown export becomes an offline ZIP (`article.md` + `assets/`).
- Keeps extracted data in-memory on the client session only.

## Latest updates

- Custom dropdowns for `Paper Size` and `Margin`.
  - No native browser dropdown chaos.
  - Click outside to close, `Esc` to close.
- Better clipboard behavior on stricter browsers.
  - Some browsers (Firefox/Safari) may ask for one extra native "Paste" confirmation.
  - The app now explains this instead of acting mysterious.

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Backend (Cloudflare Worker)

This project now expects a Worker endpoint at `/api/extract`.

```bash
wrangler dev
```

By default, the frontend calls `/api/extract` on the same origin.  
For custom environments, set `VITE_EXTRACT_API_URL` to a full endpoint URL.

## Build for production

```bash
npm run build
npm run preview
```

## Main scripts

- `npm run dev` -> start local dev server
- `npm run build` -> TypeScript + Vite production build
- `npm run lint` -> lint project
- `npm run test:run` -> run unit/regression tests once
- `npm run test:e2e` -> run Playwright tests

## How to use

1. Paste one public X URL.
2. Click `Load Article`.
3. Review preview.
4. Pick PDF settings:
  - Paper size: `A4` or `Letter`
  - Margin: `Default` or `Minimum`
5. Download:
  - `Download for Humans (PDF)`
  - `Download for LLMs (Markdown)`

## Limits (honest section)

- Public pages only. Private/locked accounts are out.
- X markup/upstream behavior can change at any time.
- Some metrics may be missing depending on upstream payload availability.
- No login/auth is implemented.

## Stack

- React + TypeScript + Vite
- Cloudflare Worker (stateless extract API)
- `pdfmake` for PDF export
- `jszip` for offline Markdown bundles

## Why this exists

Reading good posts inside infinite scroll is like eating soup with a fork.
This app is the spoon.
