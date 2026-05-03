import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'

/**
 * Şifre sıfırlama akışı:
 *  - Kullanıcı email'deki linke tıklar → Supabase recovery session açar
 *  - Bu sayfa yüklenir, kullanıcı yeni şifresini belirler
 *  - supabase.auth.updateUser({ password }) → şifre güncellenir
 *  - Dashboard'a yönlendirilir
 */
export function ResetPassword() {
  const navigate = useNavigate()
  const user      = useAuthStore(s => s.user)
  const loading   = useAuthStore(s => s.loading)

  const [password, setPassword]     = useState('')
  const [confirm,  setConfirm]      = useState('')
  const [showPass, setShowPass]     = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')
  const [info,  setInfo]            = useState('')

  // Recovery linkten gelen kullanıcının session'ı yoksa /auth'a gönder
  useEffect(() => {
    if (!loading && !user) {
      // Recovery linki geçersiz veya expired
      setError('Reset link is invalid or expired. Please request a new one.')
    }
  }, [loading, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')

    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }

    setSubmitting(true)
    try {
      const { error: err } = await supabase.auth.updateUser({ password })
      if (err) throw err
      setInfo('Password updated. Redirecting...')
      setTimeout(() => navigate('/dashboard', { replace: true }), 800)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.'
      setError(msg)
      setSubmitting(false)
    }
  }

  const INPUT = `w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900
    placeholder:text-slate-400 focus:border-[#415dff] focus:outline-none focus:ring-1 focus:ring-[#415dff]/40
    transition disabled:opacity-50`

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-sm space-y-6">

        <div className="text-center space-y-2">
          <img
            src="/qt-wordmark.png"
            alt="Quarterly Journal"
            className="h-14 w-auto object-contain mx-auto"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Set new password</h1>
          <p className="text-sm text-slate-500">Enter and confirm your new password to continue.</p>
        </div>

        {error && <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">{error}</p>}
        {info  && <p className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-700">{info}</p>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="New password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={INPUT + ' pr-10'}
              disabled={submitting || !user}
              autoComplete="new-password"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPass(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              tabIndex={-1}
            >
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <input
            type={showPass ? 'text' : 'password'}
            placeholder="Confirm new password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className={INPUT}
            disabled={submitting || !user}
            autoComplete="new-password"
          />

          <button
            type="submit"
            disabled={submitting || !user}
            className="w-full rounded-lg bg-[#415dff] py-2.5 text-sm font-semibold text-white hover:bg-[#2f4ae6] active:scale-[0.98] transition disabled:opacity-60"
          >
            {submitting ? '...' : 'Update password'}
          </button>

          {!user && !loading && (
            <button
              type="button"
              onClick={() => navigate('/auth?mode=signin')}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-700 mt-2"
            >
              Back to sign in
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
