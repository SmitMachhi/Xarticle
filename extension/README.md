# X Article Printer Companion Extension

This extension gives the webapp a reliable way to fetch public X/Twitter article pages without running a backend.

## Load locally (Chromium browsers)

1. Open `chrome://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select this `extension/` directory.

## Configure webapp domain

Edit `background.js` and set `WEBAPP_BASE_URL` to your deployed domain.

Edit `manifest.json` -> `content_scripts.matches` and add the same domain so the bridge script is injected.

## Context menu flow

1. Right-click an X/Twitter article link.
2. Click `Open in X Article Printer`.
3. The webapp opens with the URL prefilled.
