import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'

type AuthMode = 'signin' | 'signup' | 'reset'

function GoogleLogo() {
  return (
    <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    </svg>
  )
}

export function Auth() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  // Initial mode from query string ?mode=signin|signup
  const initialMode: AuthMode = (() => {
    const m = new URLSearchParams(location.search).get('mode')
    return m === 'signup' ? 'signup' : 'signin'
  })()
  const [mode, setMode] = useState<AuthMode>(initialMode)

  const [email, setEmail]         = useState('')
  const [password, setPass]       = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [username, setUsername]   = useState('')
  const [showPass, setShowP]      = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [info, setInfo]           = useState('')

  useEffect(() => { setMode(initialMode) /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [location.search])

  const reset = () => { setError(''); setInfo('') }
  const validateUsername = (v: string) => /^[a-zA-Z0-9_]{3,20}$/.test(v)

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    reset()
    if (!email) { setError('Email is required.'); return }
    setLoading(true)
    try {
      if (mode === 'reset') {
        await resetPassword(email)
        setInfo('Check your inbox — we sent a password reset link.')
        setMode('signin')
      } else if (mode === 'signup') {
        if (!firstName.trim() || !lastName.trim()) { setError('First and last name are required.'); setLoading(false); return }
        if (!validateUsername(username)) { setError('Username must be 3–20 chars: letters, numbers, underscores only.'); setLoading(false); return }
        const { needsConfirmation } = await signUpWithEmail(email, password, { firstName, lastName, username })
        if (needsConfirmation) setInfo('Almost there! Check your email to confirm your account.')
      } else {
        await signInWithEmail(email, password)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.'
      setError(msg.replace('Invalid login credentials', 'Incorrect email or password.'))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    reset()
    try { await signInWithGoogle() }
    catch { setError('Google sign-in failed. Try again.') }
  }

  const INPUT = `w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900
    placeholder:text-slate-400 focus:border-[#415dff] focus:outline-none focus:ring-1 focus:ring-[#415dff]/40
    transition disabled:opacity-50`

  const greeting = mode === 'signup' ? 'Create your account' : 'Hi, Welcome Back!'
  const greetingSub = mode === 'signup'
    ? 'Set up your profile to start tracking trades.'
    : 'Enter your credentials to access your account.'

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white text-slate-900 antialiased">

      {/* ─────────────── LEFT — Auth form ─────────────── */}
      <div className="flex-1 flex flex-col px-6 sm:px-10 py-8 lg:py-12 max-w-xl mx-auto lg:mx-0 w-full">
        {/* Top: back link */}
        <button
          onClick={() => navigate('/login')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition self-start mb-10"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>

        <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto">
          {/* Greeting */}
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{greeting}</h1>
          <p className="mt-1.5 text-sm text-slate-500">{greetingSub}</p>

          {/* Mode tabs */}
          <div className="mt-6 flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 gap-0.5">
            {(['signin', 'signup'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); reset() }}
                className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${
                  mode === m
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {m === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="mt-5 w-full flex items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition shadow-sm disabled:opacity-60"
          >
            <GoogleLogo />
            {mode === 'signup' ? 'Sign up with Google' : 'Log in with Google'}
          </button>

          {/* Divider */}
          <div className="mt-5 flex items-center gap-3">
            <span className="flex-1 h-px bg-slate-100" />
            <span className="text-[11px] font-medium text-slate-400">or</span>
            <span className="flex-1 h-px bg-slate-100" />
          </div>

          {/* Info / error */}
          {info  && <p className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-700">{info}</p>}
          {error && <p className="mt-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">{error}</p>}

          {/* Email form */}
          <form onSubmit={handleEmail} className="mt-5 space-y-3">
            {mode === 'signup' && (
              <>
                <div className="flex gap-2">
                  <input
                    type="text" placeholder="First name"
                    value={firstName} onChange={e => { setFirstName(e.target.value); reset() }}
                    className={INPUT} disabled={loading} autoComplete="given-name"
                  />
                  <input
                    type="text" placeholder="Last name"
                    value={lastName} onChange={e => { setLastName(e.target.value); reset() }}
                    className={INPUT} disabled={loading} autoComplete="family-name"
                  />
                </div>
                <input
                  type="text" placeholder="Username (e.g. trader123)"
                  value={username} onChange={e => { setUsername(e.target.value); reset() }}
                  className={INPUT} disabled={loading} maxLength={20} autoComplete="username"
                />
              </>
            )}
            <input
              type="email" placeholder="Email"
              value={email} onChange={e => setEmail(e.target.value)}
              className={INPUT} disabled={loading} autoComplete="email"
            />
            {mode !== 'reset' && (
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} placeholder="Password"
                  value={password} onChange={e => setPass(e.target.value)}
                  className={INPUT + ' pr-10'} disabled={loading}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                />
                <button
                  type="button" onClick={() => setShowP(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            )}

            {mode === 'signin' && (
              <div className="text-right">
                <button
                  type="button" onClick={() => { setMode('reset'); reset() }}
                  className="text-[11px] text-slate-400 hover:text-[#415dff] transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full rounded-lg bg-[#415dff] py-2.5 text-sm font-semibold text-white hover:bg-[#2f4ae6] active:scale-[0.98] transition disabled:opacity-60"
            >
              {loading ? '...' : mode === 'reset' ? 'Send Reset Link' : mode === 'signup' ? 'Create Account' : 'Login'}
            </button>
          </form>

          {/* Footer toggle */}
          <p className="mt-6 text-center text-xs text-slate-500">
            {mode === 'signup' ? (
              <>Already have an account? <button onClick={() => { setMode('signin'); reset() }} className="text-[#415dff] hover:underline font-medium">Sign in</button></>
            ) : (
              <>Don't have an account? <button onClick={() => { setMode('signup'); reset() }} className="text-[#415dff] hover:underline font-medium">Sign up</button></>
            )}
          </p>

          <p className="mt-6 text-center text-[10px] text-slate-400">
            By continuing you agree to our{' '}
            <Link to="/terms" className="underline hover:text-slate-600">Terms of Service</Link>{' '}and{' '}
            <Link to="/privacy" className="underline hover:text-slate-600">Privacy Policy</Link>.
          </p>
        </div>
      </div>

      {/* ─────────────── RIGHT — Marketing + dashboard preview ─────────────── */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-[#080808] via-[#141416] to-[#1f1f24] overflow-hidden items-center justify-center">
        {/* Subtle radial vignette */}
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 30%, rgba(255,255,255,0.04) 0%, transparent 70%)' }}
          aria-hidden
        />

        <div className="relative z-10 px-10 py-12 max-w-2xl">
          <h2 className="text-3xl xl:text-4xl font-bold tracking-tight leading-tight text-white">
            A{' '}
            <span className="bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent">Trading Journal</span>{' '}
            to Master Your Process
          </h2>
          <p className="mt-3 text-sm text-slate-400 max-w-md leading-relaxed">
            Track every trade, measure your confluences, and build a data-driven edge — all within the Quarterly Theory framework.
          </p>

          <div className="relative mt-8">
            {/* Dış halo */}
            <div
              className="absolute -inset-4 rounded-3xl opacity-50 blur-3xl pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(180,180,200,0.35), transparent 70%)' }}
              aria-hidden
            />

            {/* Browser-style frame */}
            <div
              className="relative rounded-2xl bg-gradient-to-b from-[#1c1c22] to-[#0f0f12] p-1.5 ring-1 ring-white/10"
              style={{
                boxShadow:
                  '0 30px 60px -15px rgba(0,0,0,0.55), 0 18px 36px -18px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04) inset',
              }}
            >
              <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-t-xl bg-[#16161a] border-b border-white/[0.06]">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                <div className="flex-1 mx-3">
                  <div className="mx-auto max-w-[260px] rounded-md bg-[#0c0c10] px-3 py-1 text-center text-[10px] text-slate-500 font-mono">
                    app.quarterlyjournal.com/dashboard
                  </div>
                </div>
              </div>

              <div className="rounded-b-xl overflow-hidden bg-white">
                <img
                  src="/qt-dashboard-preview.png"
                  alt="Dashboard preview"
                  className="w-full h-auto block"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
