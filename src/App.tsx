import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase, LOCAL_MODE } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { AuthGuard } from '@/components/shared/AuthGuard'
import { AppLayout } from '@/components/layout/AppLayout'
import { Login } from '@/pages/Login'
import { Auth } from '@/pages/Auth'
import { ResetPassword } from '@/pages/ResetPassword'
import { Dashboard } from '@/pages/Dashboard'
import { Journal } from '@/pages/Journal'
import { DailyStats } from '@/pages/DailyStats'
import { ScoreBoard } from '@/pages/ScoreBoard'
import { Profile } from '@/pages/Profile'
import { CreateProfile } from '@/pages/CreateProfile'
import { News } from '@/pages/News'
import { Privacy } from '@/pages/Privacy'
import { Terms } from '@/pages/Terms'
import { Brokers } from '@/pages/Brokers'
import { AdminUsers } from '@/pages/AdminUsers'
import { Blog } from '@/pages/Blog'
import { BlogPost } from '@/pages/BlogPost'
import { BlogEditor } from '@/pages/BlogEditor'

function App() {
  const setSession = useAuthStore(s => s.setSession)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [setSession])

  return (
    <Routes>
      <Route path="/login"          element={<Login />} />
      <Route path="/auth"           element={<Auth />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/privacy"        element={<Privacy />} />
      <Route path="/terms"          element={<Terms />} />
      <Route path="/create-profile" element={<CreateProfile />} />

      <Route
        element={
          <AuthGuard>
            <AppLayout />
          </AuthGuard>
        }
      >
        <Route path="/journal"     element={<Journal />} />
        <Route path="/dashboard"   element={<Dashboard />} />
        <Route path="/brokers"     element={<Brokers />} />
        <Route path="/daily-stats" element={<DailyStats />} />
        <Route path="/scoreboard"  element={<ScoreBoard />} />
        <Route path="/news"        element={LOCAL_MODE ? <Navigate to="/dashboard" replace /> : <News />} />
        <Route path="/profile"     element={<Profile />} />
        <Route path="/admin"       element={<AdminUsers />} />
        <Route path="/blog"             element={<Blog />} />
        <Route path="/blog/new"         element={<BlogEditor />} />
        <Route path="/blog/:slug"       element={<BlogPost />} />
        <Route path="/blog/:slug/edit"  element={<BlogEditor />} />
        <Route path="/"            element={<Navigate to="/dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
