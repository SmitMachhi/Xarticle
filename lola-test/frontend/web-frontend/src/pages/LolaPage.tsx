import { useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'
import BottomNav from '@/components/BottomNav'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'lola'
  content: string
  actions?: { type: string; label: string }[]
  streaming?: boolean
}

export default function LolaPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void api
      .get<{ messages: { id: string; role: 'user' | 'lola'; content: string; actions?: Message['actions'] }[] }>('/lola/messages')
      .then((r) => { setMessages(r.messages) })
      .catch(console.error)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setSending(true)

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: text }
    const lolaMsg: Message = { id: `l-${Date.now()}`, role: 'lola', content: '', streaming: true }
    setMessages((prev) => [...prev, userMsg, lolaMsg])

    try {
      await api.streamLola(
        text,
        (chunk) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === lolaMsg.id ? { ...m, content: m.content + chunk } : m,
            ),
          )
        },
        (_hasActions, _msgId) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === lolaMsg.id ? { ...m, streaming: false } : m,
            ),
          )
        },
      )
    } catch (e) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === lolaMsg.id
            ? { ...m, content: 'Something went wrong. Try again.', streaming: false }
            : m,
        ),
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 pb-20">
      {/* Header */}
      <div className="px-5 pt-8 pb-3 border-b border-border">
        <h1 className="font-bold text-lg">Lola 🤖</h1>
        <p className="text-xs text-muted-foreground">Your family AI</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Say hi to Lola to get started
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex',
              msg.role === 'user' ? 'justify-end' : 'justify-start',
            )}
          >
            <div
              className={cn(
                'max-w-[80%] px-4 py-3 rounded-2xl text-sm',
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-secondary text-foreground rounded-bl-sm',
                msg.streaming && 'streaming-cursor',
              )}
            >
              {msg.content || (msg.streaming ? '' : '…')}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border flex gap-2 bg-background fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-[430px]">
        <input
          className="flex-1 px-4 py-2.5 bg-secondary rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Message Lola…"
          value={input}
          onChange={(e) => { setInput(e.target.value) }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send() } }}
          disabled={sending}
        />
        <button
          onClick={() => { void send() }}
          disabled={sending || !input.trim()}
          className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center disabled:opacity-40 transition-opacity"
        >
          ↑
        </button>
      </div>

      <BottomNav active="lola" />
    </div>
  )
}
