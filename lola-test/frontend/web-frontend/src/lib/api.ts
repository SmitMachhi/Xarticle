import { supabase } from './supabase'

const API_BASE = import.meta.env.VITE_API_URL as string

async function getToken(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? ''
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = await getToken()
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error((err as { message?: string }).message ?? res.statusText)
  }
  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),

  // SSE format: event: delta\ndata: {"text":"..."}\n\n  event: done\ndata: {...}\n\n
  async streamLola(
    message: string,
    onChunk: (text: string) => void,
    onDone: (hasActions: boolean, messageId: string) => void,
  ): Promise<void> {
    const token = await getToken()
    const res = await fetch(`${API_BASE}/lola/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({ content: message }),
    })
    if (!res.ok || res.body === null) {
      throw new Error('Lola stream failed')
    }
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let currentEvent = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim()
        } else if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          try {
            const parsed = JSON.parse(data) as { text?: string; has_actions?: boolean; message_id?: string }
            if (currentEvent === 'delta' && parsed.text) {
              onChunk(parsed.text)
            } else if (currentEvent === 'done') {
              onDone(parsed.has_actions ?? false, parsed.message_id ?? '')
              return
            }
          } catch {
            // ignore malformed lines
          }
        }
      }
    }
    onDone(false, '')
  },
}
