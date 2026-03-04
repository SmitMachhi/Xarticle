import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { importPKCS8, SignJWT } from 'jose'

const APNS_PROD_URL = 'https://api.push.apple.com/3/device'
const APNS_SANDBOX_URL = 'https://api.sandbox.push.apple.com/3/device'
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const OPENROUTER_JSON_REASONING_FALLBACK_STATUS = [400, 422]
const OPENROUTER_REASONING_DEFAULT = 'low'
const REQUEST_TIMEOUT_MS = 12000
const RETRY_DELAYS_MS = [300, 900]
const RETRY_DELAY_FALLBACK_MS = 300
const WEEKDAY_MAP: Record<string, number> = { Fri: 5, Mon: 1, Sat: 6, Sun: 0, Thu: 4, Tue: 2, Wed: 3 }

export interface PushPayload {
  body: string
  title: string
}

export const createServiceClient = (): SupabaseClient => {
  return createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
}

export const localDate = (value: Date | string, timezone: string): string => {
  const date = typeof value === 'string' ? new Date(value) : value
  const zone = safeTimezone(timezone)
  const parts = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: '2-digit',
    timeZone: zone,
    year: 'numeric',
  }).formatToParts(date)
  const year = partValue(parts, 'year')
  const month = partValue(parts, 'month')
  const day = partValue(parts, 'day')
  return `${year}-${month}-${day}`
}

export const localWeekdayAndHour = (value: Date, timezone: string): { hour: number; weekday: number } => {
  const zone = safeTimezone(timezone)
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    hour12: false,
    timeZone: zone,
    weekday: 'short',
  }).formatToParts(value)
  const weekday = WEEKDAY_MAP[partValue(parts, 'weekday')] ?? -1
  return { hour: Number(partValue(parts, 'hour')), weekday }
}

export const callOpenRouterJson = async <T>(messages: Array<{ content: string; role: 'system' | 'user' }>): Promise<T> => {
  const apiKey = Deno.env.get('OPENROUTER_API_KEY') ?? ''
  const model = selectOpenRouterJsonModel()
  if (apiKey.length === 0 || model.length === 0) {
    throw new Error('openrouter env missing')
  }

  const payload = await requestOpenRouterJsonWithFallback(apiKey, {
    include_reasoning: false,
    messages,
    model,
    reasoning: { enabled: false },
    reasoning_effort: selectOpenRouterReasoningEffort(),
    response_format: { type: 'json_object' },
    stream: false,
  })

  logOpenRouterUsage(payload)
  return parseOpenRouterJsonPayload<T>(payload)
}

export const pushToUserIds = async (
  service: SupabaseClient,
  userIds: string[],
  payload: PushPayload,
): Promise<void> => {
  if (userIds.length === 0 || !canPush()) {
    return
  }

  const users = await service.from('users').select('id, apns_token').in('id', userIds)
  if (users.error !== null || users.data === null) {
    return
  }

  for (const user of users.data) {
    if (user.apns_token === null) {
      continue
    }
    await sendPushToToken(user.apns_token, payload).catch(() => undefined)
  }
}

export const pushToHousehold = async (
  service: SupabaseClient,
  householdId: string,
  payload: PushPayload,
): Promise<void> => {
  const users = await service.from('users').select('id').eq('household_id', householdId)
  if (users.error !== null || users.data === null || users.data.length === 0) {
    return
  }
  await pushToUserIds(service, users.data.map((user) => user.id), payload)
}

const sendPushToToken = async (token: string, payload: PushPayload): Promise<void> => {
  const endpoint = `${Deno.env.get('APP_ENV') === 'production' ? APNS_PROD_URL : APNS_SANDBOX_URL}/${token}`
  const jwt = await buildApnsJwt()
  await requestWithRetry(endpoint, {
    body: JSON.stringify({ aps: { alert: { body: payload.body, title: payload.title }, sound: 'default' } }),
    headers: {
      authorization: `bearer ${jwt}`,
      'apns-topic': Deno.env.get('APP_BUNDLE_ID') ?? '',
      'content-type': 'application/json',
    },
    method: 'POST',
  })
}

const buildApnsJwt = async (): Promise<string> => {
  const privateKey = Deno.env.get('APNS_PRIVATE_KEY') ?? ''
  const keyId = Deno.env.get('APNS_KEY_ID') ?? ''
  const teamId = Deno.env.get('APNS_TEAM_ID') ?? ''
  if (privateKey.length === 0 || keyId.length === 0 || teamId.length === 0) {
    throw new Error('apns env missing')
  }

  const key = await importPKCS8(privateKey, 'ES256')
  return await new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: keyId })
    .setIssuer(teamId)
    .setIssuedAt()
    .sign(key)
}

const canPush = (): boolean => {
  return (
    (Deno.env.get('APNS_PRIVATE_KEY') ?? '').length > 0 &&
    (Deno.env.get('APNS_KEY_ID') ?? '').length > 0 &&
    (Deno.env.get('APNS_TEAM_ID') ?? '').length > 0 &&
    (Deno.env.get('APP_BUNDLE_ID') ?? '').length > 0
  )
}

const requestWithRetry = async <T = undefined>(url: string, init: RequestInit): Promise<T> => {
  let attempt = 0
  while (attempt <= RETRY_DELAYS_MS.length) {
    try {
      return await requestJson<T>(url, init)
    } catch (error) {
      if (attempt >= RETRY_DELAYS_MS.length || !isRetryableRequestError(error)) {
        throw error
      }
      await sleep(nextRetryDelay(attempt))
      attempt += 1
    }
  }
  throw new Error('request exhausted retries')
}

const requestJson = async <T>(url: string, init: RequestInit): Promise<T> => {
  const controller = new AbortController()
  let timeout: ReturnType<typeof setTimeout> | null = null
  const fetchPromise = fetch(url, { ...init, signal: controller.signal }).catch(() => {
    throw new Error('request failed')
  })
  const timeoutPromise = new Promise<Response>((_, reject) => {
    timeout = setTimeout(() => {
      controller.abort()
      reject(new Error('request timed out'))
    }, REQUEST_TIMEOUT_MS)
  })

  const response = await Promise.race([fetchPromise, timeoutPromise])
  if (timeout !== null) {
    clearTimeout(timeout)
  }
  if (!response.ok) {
    throw toStatusError(response.status, await response.text())
  }

  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}

const requestOpenRouterJsonWithFallback = async (
  apiKey: string,
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> => {
  try {
    return await requestWithRetry<Record<string, unknown>>(OPENROUTER_URL, toOpenRouterRequestInit(apiKey, payload))
  } catch (error) {
    if (!isReasoningParamRejection(error)) {
      throw error
    }
  }

  const fallbackPayload = { ...payload }
  delete fallbackPayload.include_reasoning
  delete fallbackPayload.reasoning
  delete fallbackPayload.reasoning_effort
  return await requestWithRetry<Record<string, unknown>>(OPENROUTER_URL, toOpenRouterRequestInit(apiKey, fallbackPayload))
}

const toOpenRouterRequestInit = (apiKey: string, payload: Record<string, unknown>): RequestInit => {
  return {
    body: JSON.stringify(payload),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  }
}

const parseOpenRouterJsonPayload = <T>(payload: Record<string, unknown>): T => {
  const choices = asArray(payload.choices)
  const choice = choices.at(0)
  const message = asRecord(choice?.message)
  const content = message.content
  if (typeof content !== 'string') {
    throw new Error('openrouter response missing content')
  }
  const raw = content.trim()
  const json = raw.startsWith('```') ? raw.replace(/^```(?:json)?\r?\n/, '').replace(/\r?\n```$/, '') : raw
  return JSON.parse(json) as T
}

const logOpenRouterUsage = (payload: Record<string, unknown>): void => {
  const usage = asRecord(payload.usage)
  const completionTokens = asFiniteNumber(usage.completion_tokens)
  const promptTokens = asFiniteNumber(usage.prompt_tokens)
  const completionDetails = asRecord(usage.completion_tokens_details)
  const reasoningTokens = asFiniteNumber(completionDetails.reasoning_tokens)

  // eslint-disable-next-line no-console
  console.info('openrouter usage', {
    completion_tokens: completionTokens,
    prompt_tokens: promptTokens,
    reasoning_tokens: reasoningTokens,
  })
}

const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

const partValue = (parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string => {
  return parts.find((part) => part.type === type)?.value ?? ''
}

const asArray = (value: unknown): Array<Record<string, unknown>> => {
  if (!Array.isArray(value)) {
    return []
  }
  return value.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
}

const asRecord = (value: unknown): Record<string, unknown> => {
  if (typeof value !== 'object' || value === null) {
    return {}
  }
  return value as Record<string, unknown>
}

const asFiniteNumber = (value: unknown): number | null => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null
  }
  return value
}

const nextRetryDelay = (attempt: number): number => {
  return RETRY_DELAYS_MS[attempt] ?? RETRY_DELAY_FALLBACK_MS
}

const safeTimezone = (timezone: string): string => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone })
    return timezone
  } catch {
    return 'UTC'
  }
}

const selectOpenRouterJsonModel = (): string => {
  return Deno.env.get('OPENROUTER_EDGE_JSON_MODEL') ?? Deno.env.get('OPENROUTER_JSON_MODEL') ?? Deno.env.get('OPENROUTER_MODEL') ?? ''
}

const selectOpenRouterReasoningEffort = (): string => {
  return Deno.env.get('OPENROUTER_REASONING_EFFORT_JSON') ?? OPENROUTER_REASONING_DEFAULT
}

const toStatusError = (status: number, body: string): Error & { status: number } => {
  const summary = body.trim().slice(0, 200)
  return Object.assign(new Error(`request failed: ${status}${summary.length === 0 ? '' : ` ${summary}`}`), { status })
}

const isRetryableRequestError = (error: unknown): boolean => {
  const status = readErrorStatus(error)
  if (status === null) {
    return true
  }
  return status >= 500
}

const isReasoningParamRejection = (error: unknown): boolean => {
  const status = readErrorStatus(error)
  if (status === null) {
    return false
  }
  return OPENROUTER_JSON_REASONING_FALLBACK_STATUS.includes(status)
}

const readErrorStatus = (error: unknown): number | null => {
  if (typeof error !== 'object' || error === null || !('status' in error)) {
    return null
  }
  const status = error.status
  return typeof status === 'number' ? status : null
}
