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
        .then(async ({ data }) => {
          if (!data) {
            // Try auto-create from user_metadata (set during signup)
            const meta = user.user_metadata as {
              username?: string; display_name?: string
            } | undefined
            if (meta?.username && meta?.display_name) {
              await supabase.from('profiles').upsert({
                id:           user.id,
                username:     meta.username,
                display_name: meta.display_name,
              })
              setProfileChecked(true)
            } else {
              navigate('/create-profile', { replace: true })
            }
          } else {
            setProfileChecked(true)
          }
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
