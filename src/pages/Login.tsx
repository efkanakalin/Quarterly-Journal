import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'

/* ─── Scroll-reveal ─────────────────────────────────────── */
function useReveal<T extends HTMLElement>() {
  const ref  = useRef<T | null>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { setShown(true); io.disconnect() }
    }, { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return { ref, shown }
}

/* ─── FAQ ───────────────────────────────────────────────── */
const FAQS = [
  {
    q: 'What is Quarterly Journal?',
    a: 'Quarterly Journal is a trading journal purpose-built for the Quarterly Theory methodology. Every field — session, quarter, confluence, R-multiple — maps directly to the framework you trade, so your data actually means something.',
  },
  {
    q: 'Which confirmations and setups can I track?',
    a: 'You can tag every trade with QT primitives (SSMT, PSP, PRC, SD, PO3, MMXM…) plus ICT concepts (BOS, CHOCH, OB, FVG, MSS, CISD…), indicators, volume tools, and classic patterns — over 60 types in total. The list is fully customisable: only show what you actually trade.',
  },
  {
    q: 'Which brokers and platforms are supported?',
    a: 'Any broker that gives you a Tradovate-style Performance CSV export can be imported automatically. You can also add trades manually, so there is no hard dependency on any single platform.',
  },
  {
    q: 'Where is my data stored? Is it secure?',
    a: 'All trades live in Supabase, encrypted at rest and protected by row-level security — only you can read your own rows. Not even we have access to your data.',
  },
  {
    q: 'What does the QT Score mean?',
    a: 'QT Score is a single radar chart that grades your process across five dimensions: discipline, win rate, profit factor, consistency and R-multiple. It gives you a quick snapshot of where your edge is solid and where you need work.',
  },
  {
    q: 'Can I customise what I see in the journal?',
    a: 'Yes. From your profile you can choose which pairs, confluences, timeframes and table columns are visible. If you don\'t trade London, hide the London session. If you don\'t track CVD, remove it. The app adapts to your workflow.',
  },
  {
    q: 'Is it free?',
    a: 'Completely. The core journal, dashboard, news feed and all analytics are free with no usage limits. There are no plans to put the core behind a paywall.',
  },
]

/* ─── Google logo SVG ────────────────────────────────────── */
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

/* ─── Auth form ─────────────────────────────────────────── */
type AuthMode = 'signin' | 'signup' | 'reset'

function AuthCard() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuthStore()
  const [mode, setMode]       = useState<AuthMode>('signin')
  const [email, setEmail]     = useState('')
  const [password, setPass]   = useState('')
  const [showPass, setShowP]  = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [info, setInfo]       = useState('')

  const reset = () => { setError(''); setInfo('') }

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
        const { needsConfirmation } = await signUpWithEmail(email, password)
        if (needsConfirmation) {
          setInfo('Almost there! Check your email to confirm your account.')
        }
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

  return (
    <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg shadow-slate-200/80 border border-slate-100 p-7 space-y-5">
      {/* Tabs */}
      <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 gap-0.5">
        {(['signin', 'signup'] as AuthMode[]).map(m => (
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

      {/* Info / error */}
      {info  && <p className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-700">{info}</p>}
      {error && <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">{error}</p>}

      {/* Email form */}
      <form onSubmit={handleEmail} className="space-y-3">
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className={INPUT}
          disabled={loading}
          autoComplete="email"
        />
        {mode !== 'reset' && (
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={e => setPass(e.target.value)}
              className={INPUT + ' pr-10'}
              disabled={loading}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
            <button
              type="button"
              onClick={() => setShowP(p => !p)}
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
              type="button"
              onClick={() => { setMode('reset'); reset() }}
              className="text-[11px] text-slate-400 hover:text-[#415dff] transition-colors"
            >
              Forgot password?
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#415dff] py-2.5 text-sm font-semibold text-white hover:bg-[#2f4ae6] active:scale-[0.98] transition disabled:opacity-60"
        >
          {loading ? '...' : mode === 'reset' ? 'Send Reset Link' : mode === 'signup' ? 'Create Account' : 'Sign In'}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <span className="flex-1 h-px bg-slate-100" />
        <span className="text-[11px] font-medium text-slate-400">or</span>
        <span className="flex-1 h-px bg-slate-100" />
      </div>

      {/* Google */}
      <button
        onClick={handleGoogle}
        className="w-full flex items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition shadow-sm"
      >
        <GoogleLogo />
        Continue with Google
      </button>

      <p className="text-center text-[10px] text-slate-400 leading-relaxed">
        By continuing you agree to our{' '}
        <a href="/privacy" className="underline hover:text-slate-600">Privacy Policy</a>.
      </p>
    </div>
  )
}

/* ─── FAQ Item ───────────────────────────────────────────── */
function FaqItem({ q, a, index, open, onToggle }: {
  q: string; a: string; index: number; open: boolean; onToggle: () => void
}) {
  const { ref, shown } = useReveal<HTMLLIElement>()
  return (
    <li
      ref={ref}
      style={{ transitionDelay: shown ? `${index * 60}ms` : '0ms' }}
      className={`transition-all duration-500 ease-out ${shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
    >
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between gap-4 text-left px-5 py-4 rounded-xl border transition-all duration-200 ${
          open
            ? 'border-[#415dff]/25 bg-[#415dff]/[0.04] shadow-sm'
            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
        }`}
      >
        <span className={`text-sm font-semibold transition-colors ${open ? 'text-[#415dff]' : 'text-slate-800'}`}>{q}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-all duration-200 ${open ? 'rotate-180 text-[#415dff]' : 'text-slate-400'}`}
        />
      </button>
      <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${open ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="min-h-0">
          <p className="px-5 pb-4 pt-2 text-sm text-slate-600 leading-relaxed">{a}</p>
        </div>
      </div>
    </li>
  )
}

/* ─── Page ───────────────────────────────────────────────── */
export function Login() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const { ref: headRef, shown: headShown } = useReveal<HTMLDivElement>()
  const { ref: formRef, shown: formShown } = useReveal<HTMLDivElement>()

  const scrollToForm = () => document.getElementById('auth')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div className="min-h-screen bg-[#f5f6fa] text-slate-900 antialiased">

      {/* ── Navbar ─────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <img
          src="/landing-logo.png"
          alt="Quarterly Journal"
          className="h-12 w-auto object-contain"
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
        />
        <button
          onClick={scrollToForm}
          className="rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-sm"
        >
          Log in
        </button>
      </nav>

      {/* ── Hero ───────────────────────────────────────── */}
      <section className="flex flex-col items-center text-center px-6 pt-24 pb-20">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#415dff]/20 bg-[#415dff]/[0.07] px-4 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#415dff]" />
          <span className="text-xs font-semibold text-[#415dff] tracking-wide">Built for Quarterly Theory Traders</span>
        </div>

        {/* Heading */}
        <div
          ref={headRef}
          className={`transition-all duration-700 ease-out ${headShown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] max-w-3xl">
            A{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-[#415dff]">Trading Journal</span>
              <span
                className="absolute inset-x-0 -bottom-1 h-2.5 rounded-full opacity-20"
                style={{ background: 'linear-gradient(90deg, #415dff, #8a9eff)' }}
                aria-hidden
              />
            </span>
            <br />
            to Master Your Process
          </h1>
          <p className="mt-5 text-base sm:text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
            Track every trade, measure your confluences, and build a data-driven edge — all within the Quarterly Theory framework.
          </p>
        </div>

        {/* Auth card */}
        <div
          id="auth"
          ref={formRef}
          className={`mt-14 w-full max-w-sm transition-all duration-700 delay-150 ease-out ${formShown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <AuthCard />
        </div>

        {/* Scroll hint */}
        <button
          onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })}
          className="mt-16 flex flex-col items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <span className="text-[10px] font-medium tracking-[0.25em] uppercase">FAQ</span>
          <ChevronDown className="h-4 w-4 [animation:qt-bounce_2s_ease-in-out_infinite]" />
        </button>
      </section>

      {/* ── FAQ ────────────────────────────────────────── */}
      <section id="faq" className="px-6 pb-24 max-w-2xl mx-auto">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Frequently asked questions
          </h2>
          <p className="mt-2 text-sm text-slate-500">Everything you need to know before you start.</p>
        </div>

        <ul className="space-y-2">
          {FAQS.map((faq, i) => (
            <FaqItem
              key={i}
              index={i}
              q={faq.q}
              a={faq.a}
              open={openFaq === i}
              onToggle={() => setOpenFaq(openFaq === i ? null : i)}
            />
          ))}
        </ul>
      </section>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white py-6 px-6 text-center text-xs text-slate-400">
        <a href="/privacy" className="hover:text-slate-600 underline underline-offset-2 transition-colors">Privacy Policy</a>
        <span className="mx-3 opacity-50">·</span>
        <span>© {new Date().getFullYear()} Quarterly Journal</span>
      </footer>
    </div>
  )
}
