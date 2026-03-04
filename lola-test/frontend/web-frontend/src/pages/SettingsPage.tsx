import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import BottomNav from '@/components/BottomNav'

interface Member {
  id: string
  display_name: string
  role: string
  avatar_color: string
  xp_total: number
}

interface HouseholdData {
  household: { id: string; name: string; invite_code: string; plan: string; home_score: number }
  members: Member[]
  my_role: string
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [data, setData] = useState<HouseholdData | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    void api.get<HouseholdData>('/households/me').then(setData).catch(console.error)
  }, [])

  const copyInviteCode = async () => {
    if (!data) return
    await navigator.clipboard.writeText(data.household.invite_code)
    setCopied(true)
    setTimeout(() => { setCopied(false) }, 2000)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="flex flex-col flex-1 pb-20">
      <div className="px-5 pt-8 pb-4 border-b border-border">
        <h1 className="font-bold text-lg">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {data && (
          <>
            {/* Household info */}
            <div className="bg-secondary rounded-xl px-4 py-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Household</p>
                <p className="font-semibold">{data.household.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{data.household.plan} plan</p>
              </div>

              {/* Invite code */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Invite Code</p>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg tracking-widest font-bold">{data.household.invite_code}</span>
                  <button
                    onClick={() => { void copyInviteCode() }}
                    className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Share with family to invite them</p>
              </div>
            </div>

            {/* Members */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2 px-1">Members</p>
              <div className="space-y-2">
                {data.members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 py-3 px-4 bg-secondary rounded-xl">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ backgroundColor: member.avatar_color }}
                    >
                      {member.display_name[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{member.display_name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{member.role} · {member.xp_total} XP</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Sign out */}
        <button
          onClick={() => { void handleSignOut() }}
          className="w-full py-3 text-sm text-red-500 font-medium border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
        >
          Sign out
        </button>
      </div>

      <BottomNav active="settings" />
    </div>
  )
}
