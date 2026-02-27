# Self-Host FxEmbed In This Repo

This repo includes FxEmbed as a git submodule at `services/fxembed`.

## 1. Initialize submodule

```bash
npm run fx:init
```

## 2. Install FxEmbed dependencies

```bash
npm run fx:install
```

## 3. Create FxEmbed local config files

```bash
cp services/fxembed/.env.example services/fxembed/.env
cp services/fxembed/wrangler.example.toml services/fxembed/wrangler.toml
```

## 4. Configure FxEmbed

Edit:

- `services/fxembed/.env`
- `services/fxembed/wrangler.toml`

At minimum:

- set your Cloudflare `account_id`
- set your worker name
- set your domain lists and API host values for your deployment

## 5. Deploy FxEmbed

```bash
npm run fx:deploy
```

## 6. Point Xarticle worker to your FxEmbed API origin

In this repo's `wrangler.toml`, set:

```toml
[vars]
FXTWITTER_API_BASE_URL = "https://<your-fx-api-origin>"
```

Use origin only, no trailing slash.

## 7. Run/tail services

```bash
wrangler dev
npm run fx:tail
```

`wrangler dev` runs Xarticle's extract worker (this repo).  
`npm run fx:tail` tails logs for the FxEmbed worker.

