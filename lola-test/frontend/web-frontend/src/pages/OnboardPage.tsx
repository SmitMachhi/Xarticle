import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

type Mode = 'choose' | 'create' | 'join'

export default function OnboardPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('choose')
  const [householdName, setHouseholdName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const createHousehold = async () => {
    if (!householdName.trim()) return
    setLoading(true)
    setError('')
    try {
      await api.post('/households', { name: householdName.trim(), timezone })
      navigate('/home', { replace: true })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const joinHousehold = async () => {
    if (!inviteCode.trim()) return
    setLoading(true)
    setError('')
    try {
      await api.post('/households/join', { invite_code: inviteCode.trim().toUpperCase() })
      navigate('/home', { replace: true })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (mode === 'choose') {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh gap-6 px-6">
        <div className="text-center space-y-2">
          <div className="text-5xl">🏡</div>
          <h1 className="text-2xl font-bold">Welcome to Lola</h1>
          <p className="text-muted-foreground text-sm">Set up your household to get started</p>
        </div>
        <div className="w-full space-y-3">
          <button
            onClick={() => { setMode('create') }}
            className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            Create a household
          </button>
          <button
            onClick={() => { setMode('join') }}
            className="w-full py-4 bg-secondary text-secondary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            Join with invite code
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-dvh px-6 pt-12 gap-6">
      <button
        onClick={() => { setMode('choose') }}
        className="text-muted-foreground text-sm self-start"
      >
        ← Back
      </button>

      {mode === 'create' ? (
        <>
          <h1 className="text-2xl font-bold">Name your household</h1>
          <input
            className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="e.g. The Smith Family"
            value={householdName}
            onChange={(e) => { setHouseholdName(e.target.value) }}
            onKeyDown={(e) => { if (e.key === 'Enter') void createHousehold() }}
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            onClick={() => { void createHousehold() }}
            disabled={loading || !householdName.trim()}
            className={cn(
              'w-full py-4 bg-primary text-primary-foreground rounded-xl font-medium transition-opacity',
              loading || !householdName.trim() ? 'opacity-50' : 'hover:opacity-90',
            )}
          >
            {loading ? 'Creating…' : 'Create household'}
          </button>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold">Enter invite code</h1>
          <p className="text-muted-foreground text-sm -mt-2">
            Your household admin can find this in Settings
          </p>
          <input
            className="w-full px-4 py-3 border border-border rounded-xl text-sm text-center tracking-widest font-mono uppercase focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="ABC12345"
            value={inviteCode}
            maxLength={10}
            onChange={(e) => { setInviteCode(e.target.value) }}
            onKeyDown={(e) => { if (e.key === 'Enter') void joinHousehold() }}
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            onClick={() => { void joinHousehold() }}
            disabled={loading || !inviteCode.trim()}
            className={cn(
              'w-full py-4 bg-primary text-primary-foreground rounded-xl font-medium transition-opacity',
              loading || !inviteCode.trim() ? 'opacity-50' : 'hover:opacity-90',
            )}
          >
            {loading ? 'Joining…' : 'Join household'}
          </button>
        </>
      )}
    </div>
  )
}
