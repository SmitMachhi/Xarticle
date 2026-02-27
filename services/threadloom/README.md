# Threadloom

Threadloom is a minimal X status extractor service for Xarticle.

## Scope

- `GET /i/status/:id` only
- `GET /health`
- No non-X providers
- No databases, no queues, no storage

## Output contract

`/i/status/:id` returns a JSON payload compatible with Xarticle's status parser:

```json
{
  "code": 200,
  "message": "OK",
  "tweet": {}
}
```

## Local run

```bash
wrangler dev --config services/threadloom/wrangler.toml
```

## Deploy

```bash
wrangler deploy --config services/threadloom/wrangler.toml
```
