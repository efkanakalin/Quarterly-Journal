import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { S } from '@/lib/constants/strings'

export function CreateProfile() {
  const user = useAuthStore(s => s.user)
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const validate = (v: string) => /^[a-zA-Z0-9_]{3,20}$/.test(v)

  const handleSubmit = async () => {
    if (!user) return
    if (!validate(username)) {
      setError(S.profile.usernameInvalid)
      return
    }

    setSaving(true)
    setError('')
    try {
      const { error: err } = await supabase.from('profiles').insert({
        id: user.id,
        username: username.toLowerCase(),
        display_name: user.user_metadata?.full_name ?? username,
      })

      if (err) {
        if (err.code === '23505') setError(S.profile.usernameInUse)
        else throw err
        return
      }

      navigate('/journal', { replace: true })
    } catch {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 text-white text-lg font-bold mx-auto">
            QT
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{S.profile.createTitle}</h1>
          <p className="text-sm text-gray-500 dark:text-[#9ca3af]">{S.profile.createSubtitle}</p>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-white/10 p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-[#9ca3af]">
              {S.profile.username}
            </label>
            <input
              type="text"
              value={username}
              onChange={e => { setUsername(e.target.value); setError('') }}
              placeholder={S.profile.usernamePlaceholder}
              maxLength={20}
              className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0a0a0a] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            {error
              ? <p className="text-xs text-red-500">{error}</p>
              : <p className="text-xs text-gray-400 dark:text-[#6b7280]">{S.profile.usernameHint}</p>
            }
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving || !username}
            className="w-full rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Kaydediliyor...' : S.profile.continueButton}
          </button>
        </div>
      </div>
    </div>
  )
}
