import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'

interface Props {
  children: React.ReactNode
}

export function AuthGuard({ children }: Props) {
  const { user, loading } = useAuthStore()
  const navigate = useNavigate()
  const [profileChecked, setProfileChecked] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true })
      return
    }
    if (!loading && user) {
      supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (!data) navigate('/create-profile', { replace: true })
          else setProfileChecked(true)
        })
    }
  }, [user, loading, navigate])

  if (loading || (user && !profileChecked)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 dark:border-white/20 border-t-blue-500" />
      </div>
    )
  }

  if (!user) return null

  return <>{children}</>
}
