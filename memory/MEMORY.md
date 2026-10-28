# Xarticle.co Project Memory

## CRITICAL: Deploy Workflow

**xarticle.co is served by Cloudflare PAGES (`twitter-article-downloader` project).**
**API routes (/api/extract, /api/image) are served by Pages Functions in `functions/api/`.**

**Normal path: push to `master`.** `.github/workflows/ci.yml` runs lint, tests, build and the Playwright smoke test, then its `deploy` job ships that exact build. A failing check blocks the deploy.

```bash
# Manual deploy (bypasses CI checks; deploys static assets + Pages Functions together):
npm run build && npx wrangler pages deploy dist --project-name twitter-article-downloader --branch=master

# WRONG - deploys to Worker only (workers.dev URL, NOT xarticle.co):
npx wrangler deploy
```

- Pages project: `twitter-article-downloader` → serves `xarticle.co` (static files + functions)
- Worker: `xarticle-extract-worker` → `xarticle-extract-worker.smit-759.workers.dev` (separate, NOT used by xarticle.co)
- Pages Functions: `functions/api/extract.ts` + `functions/api/image.ts` — import and run the worker route handlers
- Root cause of past 405 errors: Pages was serving static files only; functions/ directory fixed this

## CRITICAL: Project Separation

- `lola-test/` is a **completely separate git repo** inside this folder
- It is gitignored and must NEVER be touched, committed, or mixed with this project
- Current working branch: `codex/lola-one-shot` — this is for xarticle.co (main project)
- `lola-test/` has its own remote, its own branches, its own deploys — ignore it entirely

## Architecture

- Frontend: React + Vite + TypeScript in `src/`
- Worker (API): `worker/src/` — handles `/api/extract` and `/api/image` (image proxy)
- Image proxy: `/api/image?url=...` — proxies `pbs.twimg.com` images to avoid CORS
- All image URLs in frontend go through `src/lib/imageProxy.ts` → `proxyImageUrl(url)`

## Key Files

- `src/features/home/HomePage.tsx` — main layout (single column: URL → Preview → Export bar)
- `src/features/home/hooks/useExtractionState.ts` — extraction, `loadArticle(overrideUrl?)`
- `src/features/home/hooks/useExportState.ts` — export state, localStorage persistence
- `src/features/home/components/ExportSection.tsx` — horizontal export bar
- `src/lib/imageProxy.ts` — `proxyImageUrl(url)` utility
- `worker/src/routes/image.ts` — image proxy endpoint
- `src/index.css` — Tailwind v4 theme + article prose styles; components use Tailwind classes
- `src/components/magicui/` — vendored Magic UI components (aurora-text, shimmer-button, border-beam, blur-fade); page background is a warm paper grain in index.css, pulled from magicui.design/r/<name>.json; lint-relaxed in eslint.config.js

## Curriculum App

- Located at `curriculum/` — standalone React + Vite + TypeScript app
- Duolingo-style backend engineering curriculum using this codebase as examples
- 10 modules: HTTP, APIs, Client-Server, Serverless, Routing, Auth/Headers, CORS, Caching, Error Handling, Type Contracts
- Run: `cd curriculum && npm run dev` → localhost:5173
- Progress persists in localStorage key `curriculum_progress`
- Lesson data: `curriculum/src/data/lessons/01-http.ts` through `10-type-contracts.ts`
- Do NOT deploy curriculum alongside xarticle.co — it's a local learning tool

## UX Decisions Made

- Auto-load on paste (Ctrl+V or Paste button) — no manual "Load Article" click needed
- Single column layout: URL input → Preview → Export bar (shown only when article loaded)
- PDFs are always US Letter with narrow margins (no paper or margin pickers)
- Download success flash: `.btn-success` for 1.5s after download
- No FAQ, no pandas on the page (panda is only the favicon); brand centered at top, hero vertically centered until an article loads, creator credit bottom-right
