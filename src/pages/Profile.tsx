import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { S } from '@/lib/constants/strings'

interface ProfileData {
  username: string
  display_name: string | null
}

export function Profile() {
  const user = useAuthStore(s => s.user)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('profiles')
      .select('username, display_name')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setProfile(data)
          setUsername(data.username)
        }
        setLoading(false)
      })
  }, [user])

  const validate = (v: string) => /^[a-zA-Z0-9_]{3,20}$/.test(v)

  const handleSave = async () => {
    if (!user || !validate(username)) {
      setError(S.profile.usernameInvalid)
      return
    }

    setSaving(true)
    setError('')
    const { error: err } = await supabase
      .from('profiles')
      .update({ username: username.toLowerCase(), updated_at: new Date().toISOString() })
      .eq('id', user.id)

    setSaving(false)
    if (err) {
      if (err.code === '23505') setError(S.profile.usernameInUse)
      else setError('Bir hata oluştu.')
    } else {
      toast.success('Profil güncellendi.')
      setProfile(p => p ? { ...p, username } : null)
    }
  }

  if (loading) {
    return <div className="h-48 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />
  }

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{S.profile.title}</h1>

      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-white/10 p-6 space-y-4">
        {/* Email (readonly) */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-[#9ca3af]">E-posta</label>
          <p className="text-sm text-gray-500 dark:text-[#9ca3af]">{user?.email}</p>
        </div>

        {/* Username */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-[#9ca3af]">
            {S.profile.username}
          </label>
          <input
            type="text"
            value={username}
            onChange={e => { setUsername(e.target.value); setError('') }}
            maxLength={20}
            className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0a0a0a] px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <p className="text-xs text-gray-400 dark:text-[#6b7280]">{S.profile.usernameHint}</p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || username === profile?.username}
          className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Kaydediliyor...' : S.profile.saveButton}
        </button>
      </div>
    </div>
  )
}
