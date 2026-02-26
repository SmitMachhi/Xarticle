# Xarticle.co (no backend, no drama)

Turn a public X/Twitter link into a readable export.

## What this app does

- Accepts one public X status URL or X long-form article URL.
- Extracts content with a fallback chain that refuses to panic:
  - `fxtwitter` first (great for status links)
  - Companion extension bridge next (most reliable)
  - `r.jina.ai` fallback last (because hope is a strategy)
- Shows a clean in-browser preview before you download.
- Exports PDF for humans.
- Exports Markdown for LLM workflows.
- If media exists, Markdown export becomes an offline ZIP (`article.md` + `assets/`).

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

## Companion extension (optional, recommended)

See [extension/README.md](./extension/README.md).

Use it when X decides to be "creative" with anti-bot/cross-origin behavior.

## Limits (honest section)

- Public pages only. Private/locked accounts are out.
- X markup can change at any time, usually at the least convenient moment.
- Some metrics may be missing depending on source availability.
- If one extraction provider fails, the app tries the next one automatically.

## Stack

- React + TypeScript + Vite
- `pdfmake` for PDF export
- `jszip` for offline Markdown bundles
- Optional browser extension bridge for reliable page HTML access

## Why this exists

Reading good posts inside infinite scroll is like eating soup with a fork.
This app is the spoon.