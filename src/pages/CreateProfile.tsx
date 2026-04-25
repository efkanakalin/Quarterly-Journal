import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { useS } from '@/lib/i18n'

export function CreateProfile() {
  const user = useAuthStore(s => s.user)
  const navigate = useNavigate()
  const S = useS()

  const [firstName, setFirstName] = useState('')
  const [lastName,  setLastName]  = useState('')
  const [username,  setUsername]  = useState('')
  const [error,     setError]     = useState('')
  const [saving,    setSaving]    = useState(false)

  const validateUsername = (v: string) => /^[a-zA-Z0-9_]{3,20}$/.test(v)

  const handleSubmit = async () => {
    if (!user) return
    if (!firstName.trim() || !lastName.trim()) { setError('Ad ve soyad zorunludur.'); return }
    if (!validateUsername(username)) { setError(S.profile.usernameInvalid); return }

    setSaving(true)
    setError('')
    try {
      const displayName = `${firstName.trim()} ${lastName.trim()}`
      const { error: err } = await supabase.from('profiles').insert({
        id: user.id,
        username: username.toLowerCase(),
        display_name: displayName,
      })

      if (err) {
        if (err.code === '23505') setError(S.profile.usernameInUse)
        else throw err
        return
      }
      navigate('/journal', { replace: true })
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const INPUT = 'w-full rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0a0a0a] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-blue-500'
  const LABEL = 'text-sm font-medium text-gray-700 dark:text-[#9ca3af]'

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <img src="/quarterly-journal.png" alt="Quarterly Journal" className="h-20 w-auto object-contain mx-auto" onError={e => { e.currentTarget.style.display='none' }} />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{S.profile.createTitle}</h1>
          <p className="text-sm text-gray-500 dark:text-[#9ca3af]">{S.profile.createSubtitle}</p>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-white/10 p-6 space-y-4">
          {/* Ad + Soyad */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={LABEL}>{S.profile.firstName} <span className="text-red-500">*</span></label>
              <input type="text" value={firstName} onChange={e => { setFirstName(e.target.value); setError('') }} placeholder="Efkan" className={INPUT} />
            </div>
            <div className="space-y-1.5">
              <label className={LABEL}>{S.profile.lastName} <span className="text-red-500">*</span></label>
              <input type="text" value={lastName} onChange={e => { setLastName(e.target.value); setError('') }} placeholder="Akalın" className={INPUT} />
            </div>
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <label className={LABEL}>{S.profile.username} <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={username}
              onChange={e => { setUsername(e.target.value); setError('') }}
              placeholder={S.profile.usernamePlaceholder}
              maxLength={20}
              className={INPUT}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            {error
              ? <p className="text-xs text-red-500">{error}</p>
              : (
                <div className="space-y-0.5">
                  <p className="text-xs text-gray-400 dark:text-[#6b7280]">{S.profile.usernameHint}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">{S.profile.usernameLockedHint}</p>
                </div>
              )
            }
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving || !firstName || !lastName || !username}
            className="w-full rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {saving ? '...' : S.profile.continueButton}
          </button>
        </div>
      </div>
    </div>
  )
}
