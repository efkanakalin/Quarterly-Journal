import { useEffect, useState } from 'react'
import { ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

/**
 * TOTP MFA enrollment paneli. Profile / Personal Info sekmesinde gösterilir.
 *
 * Akış:
 *  1) Kullanıcı "Enable 2FA" tıklar → enroll() → QR + secret döner
 *  2) Authenticator app'e ekler, 6-haneli kod girer → challenge + verify
 *  3) Başarılı → factor 'verified' state'inde, signin'de challenge istenecek
 *
 * NOT: Supabase MFA challenge'ı signin akışına AAL2 ile entegre etmek lazım;
 * bu component sadece enrollment/unenrollment kısmı. Tam MFA login akışı için
 * Auth.tsx içinde mfa.challenge + mfa.verify çağrıları gerekir (sonraki sprint).
 */
export function MfaSection() {
  const [factors, setFactors] = useState<{ id: string; status: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [qrSvg, setQrSvg]         = useState<string | null>(null)
  const [secret, setSecret]       = useState<string | null>(null)
  const [factorId, setFactorId]   = useState<string | null>(null)
  const [code, setCode]           = useState('')
  const [verifying, setVerifying] = useState(false)

  const refresh = async () => {
    setLoading(true)
    const { data, error } = await supabase.auth.mfa.listFactors()
    if (error) { setLoading(false); return }
    const totp = (data?.totp ?? []).map(f => ({ id: f.id, status: f.status }))
    setFactors(totp)
    setLoading(false)
  }

  useEffect(() => { void refresh() }, [])

  const verifiedFactor = factors.find(f => f.status === 'verified')

  const startEnroll = async () => {
    setEnrolling(true)
    setCode('')
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
      if (error) throw error
      setQrSvg(data.totp.qr_code)
      setSecret(data.totp.secret)
      setFactorId(data.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '2FA enroll failed.')
      setEnrolling(false)
    }
  }

  const cancelEnroll = async () => {
    if (factorId) await supabase.auth.mfa.unenroll({ factorId })
    setQrSvg(null); setSecret(null); setFactorId(null); setCode('')
    setEnrolling(false)
  }

  const verifyEnroll = async () => {
    if (!factorId || code.length !== 6) return
    setVerifying(true)
    try {
      const { data: chal, error: chalErr } = await supabase.auth.mfa.challenge({ factorId })
      if (chalErr) throw chalErr
      const { error: verErr } = await supabase.auth.mfa.verify({
        factorId, challengeId: chal.id, code,
      })
      if (verErr) throw verErr
      toast.success('2FA enabled.')
      setQrSvg(null); setSecret(null); setFactorId(null); setCode('')
      setEnrolling(false)
      void refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Code is incorrect or expired.')
    } finally {
      setVerifying(false)
    }
  }

  const disable = async () => {
    if (!verifiedFactor) return
    if (!confirm('Disable two-factor authentication? Your account will be less secure.')) return
    const { error } = await supabase.auth.mfa.unenroll({ factorId: verifiedFactor.id })
    if (error) { toast.error(error.message); return }
    toast.success('2FA disabled.')
    void refresh()
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-5">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-[#9ca3af]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading 2FA status…
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {verifiedFactor
            ? <ShieldCheck className="h-4.5 w-4.5 text-emerald-500" />
            : <ShieldAlert className="h-4.5 w-4.5 text-amber-500" />}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Two-factor authentication</h2>
            <p className="text-xs text-gray-500 dark:text-[#9ca3af]">
              {verifiedFactor ? 'Active — your account is protected.' : 'Recommended — adds a second layer to your login.'}
            </p>
          </div>
        </div>
        {!verifiedFactor && !enrolling && (
          <button
            onClick={startEnroll}
            className="rounded-lg bg-[#415dff] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#2f4ae6]"
          >
            Enable 2FA
          </button>
        )}
        {verifiedFactor && (
          <button
            onClick={disable}
            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-200"
          >
            Disable
          </button>
        )}
      </div>

      {enrolling && qrSvg && secret && (
        <div className="px-4 sm:px-6 py-5 space-y-4">
          <p className="text-xs text-gray-600 dark:text-[#9ca3af]">
            1. Scan this QR code with an authenticator app (Google Authenticator, 1Password, Authy, etc.).
          </p>
          <div className="flex justify-center">
            <div
              className="rounded-lg border border-gray-200 dark:border-white/10 bg-white p-3"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
          </div>
          <p className="text-[11px] text-gray-500 dark:text-[#6b7280] text-center">
            Or enter this secret manually:
          </p>
          <p className="text-center font-mono text-xs bg-gray-50 dark:bg-white/5 rounded-md px-3 py-2 break-all">
            {secret}
          </p>

          <p className="text-xs text-gray-600 dark:text-[#9ca3af] pt-1">
            2. Enter the 6-digit code from your authenticator:
          </p>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            maxLength={6}
            inputMode="numeric"
            autoComplete="one-time-code"
            className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f0f0f] px-3 py-2 text-center font-mono text-lg tracking-[0.4em] focus:outline-none focus:ring-1 focus:ring-[#415dff]/40 focus:border-[#415dff]"
          />
          <div className="flex gap-2">
            <button
              onClick={cancelEnroll}
              className="flex-1 rounded-lg border border-gray-200 dark:border-white/10 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-[#d1d5db] hover:bg-gray-50 dark:hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              onClick={verifyEnroll}
              disabled={code.length !== 6 || verifying}
              className="flex-1 rounded-lg bg-[#415dff] px-3 py-2 text-xs font-semibold text-white hover:bg-[#2f4ae6] disabled:opacity-50"
            >
              {verifying ? 'Verifying…' : 'Verify & enable'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
