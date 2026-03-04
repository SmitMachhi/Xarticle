import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import AuthPage from '@/pages/AuthPage'
import AuthCallback from '@/pages/AuthCallback'
import OnboardPage from '@/pages/OnboardPage'
import HomePage from '@/pages/HomePage'
import LolaPage from '@/pages/LolaPage'
import TasksPage from '@/pages/TasksPage'
import FeedPage from '@/pages/FeedPage'
import SettingsPage from '@/pages/SettingsPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    )
  }
  if (session === null) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/onboard" element={<ProtectedRoute><OnboardPage /></ProtectedRoute>} />
          <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/lola" element={<ProtectedRoute><LolaPage /></ProtectedRoute>} />
          <Route path="/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
          <Route path="/feed" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
