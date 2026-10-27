import { afterEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_BEARER_TOKEN, DEFAULT_TWEET_RESULT_QUERY_ID } from '../constants'
import { resolveQueryAndBearer } from '../xClient'
import { readBearerToken, readMainScriptUrl, readQueryId } from '../xParsing'

const MAIN_SCRIPT = 'https://abs.twimg.com/responsive-web/client-web/main.abc123.js'
const LEGACY_HTML = `<script src="${MAIN_SCRIPT}" nonce="n"></script>`
const XWEB_HTML = '<script type="module" src="https://abs.twimg.com/x-web/x-web/entry-client-logged-out-DpS6XgVj.js"></script>'
const BEARER = 'AAAAAAAAAAAAAAAAAAAAAFreshBearerTokenFromTheBundle1234567890abcdef'
const LEGACY_SCRIPT = `e.exports={queryId:"legacyId123",operationName:"TweetResultByRestId",operationType:"query"};const t="Bearer ${BEARER}"`
const RELAY_CHUNK = 'params:{id:`kz76KDSlN6fcOJyezSmqZg`,metadata:{},name:`TweetResultByRestId`,operationKind:`query`,text:null}'

const stubFetch = (bodies: Record<string, string>) => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => (url in bodies ? new Response(bodies[url]) : new Response('', { status: 404 }))),
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('X script parsing', () => {
  it('finds the legacy main script and ignores the x-web entry', () => {
    expect(readMainScriptUrl(LEGACY_HTML)).toBe(MAIN_SCRIPT)
    expect(readMainScriptUrl(XWEB_HTML)).toBeNull()
  })

  it('reads legacy query ids but not Relay ids that return a different shape', () => {
    expect(readQueryId(LEGACY_SCRIPT)).toBe('legacyId123')
    expect(readQueryId(RELAY_CHUNK)).toBeNull()
  })

  it('reads the bundle bearer or falls back to the default', () => {
    expect(readBearerToken(LEGACY_SCRIPT)).toBe(BEARER)
    expect(readBearerToken(RELAY_CHUNK)).toBe(DEFAULT_BEARER_TOKEN)
  })
})

describe('resolveQueryAndBearer', () => {
  it('resolves from the legacy main script', async () => {
    stubFetch({ 'https://x.com': LEGACY_HTML, [MAIN_SCRIPT]: LEGACY_SCRIPT })
    await expect(resolveQueryAndBearer(true)).resolves.toEqual({ bearerToken: BEARER, queryId: 'legacyId123' })
  })

  it('falls back to the known-good query on the x-web layout', async () => {
    stubFetch({ 'https://x.com': XWEB_HTML })
    await expect(resolveQueryAndBearer(true)).resolves.toEqual({
      bearerToken: DEFAULT_BEARER_TOKEN,
      queryId: DEFAULT_TWEET_RESULT_QUERY_ID,
    })
  })

  it('falls back instead of throwing when X is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new Error('offline'))))
    await expect(resolveQueryAndBearer(true)).resolves.toEqual({
      bearerToken: DEFAULT_BEARER_TOKEN,
      queryId: DEFAULT_TWEET_RESULT_QUERY_ID,
    })
  })
})
