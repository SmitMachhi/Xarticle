import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      // Supabase exchanges the OAuth code from the URL automatically
      const { data, error } = await supabase.auth.getSession()
      if (error !== null || data.session === null) {
        navigate('/')
        return
      }

      // Tell the backend to upsert this user in public.users
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        const displayName = data.session.user.user_metadata['full_name'] as string | undefined
        const result = await api.post<{ is_new_user: boolean }>('/auth/session', {
          display_name: displayName,
          timezone,
        })
        navigate(result.is_new_user ? '/onboard' : '/home', { replace: true })
      } catch {
        navigate('/home', { replace: true })
      }
    }
    void handleCallback()
  }, [navigate])

  return (
    <div className="flex items-center justify-center min-h-dvh">
      <div className="text-center space-y-3">
        <div className="text-4xl animate-spin">⚙️</div>
        <p className="text-muted-foreground text-sm">Signing you in…</p>
      </div>
    </div>
  )
}
