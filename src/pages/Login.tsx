import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const FAQS = [
  {
    q: 'What makes Quarterly Journal different from other trading journals?',
    a: 'Quarterly Journal is purpose-built for the Quarterly Theory methodology. Unlike generic journals, it tracks Q/D/W cycles, analyzes by session, and scores trades based on the specific confirmations you took — so every field you fill in actually maps to the framework you trade.',
  },
  {
    q: 'Which confirmations and metrics can I track?',
    a: 'You can tag every trade with QT primitives such as liquidity sweeps, market-structure shifts, FVG, OTE, session opens and displacement. Each position carries its outcome (win/loss/breakeven), R-multiple, session and pair — and the dashboard rolls it up into a single QT Score.',
  },
  {
    q: 'Where is my data stored, and is it secure?',
    a: 'All your trades live in Supabase, encrypted at rest and protected by row-level security. Only you can read your own rows — not even we can. You can export everything to CSV, or wipe your account entirely, at any time.',
  },
  {
    q: 'Is it free? Will it ever be paid?',
    a: 'Right now it is completely free and built as an open tool for the QT community. Even if we add advanced analytics modules later, the core — journal and dashboard — will always stay free. Feedback is more than welcome.',
  },
]

/* ---------- Scroll-reveal hook ---------- */
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            setShown(true)
            io.disconnect()
          }
        })
      },
      { threshold: 0.2 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return { ref, shown }
}

/* ---------- Decorative vortex (kodla çizildi, statik) ---------- */
function Vortex() {
  const count = 40
  return (
    <svg viewBox="-220 -220 440 440" className="h-full w-full">
      <defs>
        <radialGradient id="vortex-fade" cx="50%" cy="50%" r="50%">
          <stop offset="15%" stopColor="white" stopOpacity="0" />
          <stop offset="55%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask id="vortex-mask">
          <rect x="-220" y="-220" width="440" height="440" fill="url(#vortex-fade)" />
        </mask>
      </defs>
      <g mask="url(#vortex-mask)">
        {Array.from({ length: count }).map((_, i) => {
          const angle = (i * 360) / count
          const isAccent = i % 8 === 0
          return (
            <ellipse
              key={i}
              cx="0"
              cy="0"
              rx="200"
              ry="90"
              transform={`rotate(${angle})`}
              fill="none"
              stroke={isAccent ? 'rgba(65,93,255,0.35)' : 'rgba(255,255,255,0.11)'}
              strokeWidth={isAccent ? 0.6 : 0.4}
            />
          )
        })}
      </g>
    </svg>
  )
}

/* ---------- FAQ item ---------- */
function FaqItem({
  index,
  q,
  a,
  open,
  onToggle,
}: {
  index: number
  q: string
  a: string
  open: boolean
  onToggle: () => void
}) {
  const { ref, shown } = useReveal<HTMLLIElement>()

  return (
    <li
      ref={ref}
      style={{ transitionDelay: shown ? `${index * 90}ms` : '0ms' }}
      className={`transition-all duration-700 ease-out ${
        shown ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      }`}
    >
      <button
        onClick={onToggle}
        className={`group relative flex w-full items-center gap-5 rounded-2xl border px-6 py-5 text-left transition-all duration-300 ${
          open
            ? 'border-[#415dff]/40 bg-gradient-to-r from-white/[0.06] via-white/[0.03] to-transparent shadow-[0_0_40px_-10px_rgba(65,93,255,0.3)]'
            : 'border-white/10 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.04]'
        }`}
      >
        <span
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border text-[11px] font-semibold tracking-wider transition-colors duration-300 ${
            open
              ? 'border-[#8a9eff]/50 bg-[#415dff]/15 text-[#8a9eff]'
              : 'border-white/15 bg-white/[0.03] text-white/60 group-hover:text-white/80'
          }`}
        >
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="flex-1 text-[15px] font-medium text-white md:text-base">{q}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-all duration-300 ${
            open ? 'rotate-180 text-[#8a9eff]' : 'text-white/50 group-hover:text-white/80'
          }`}
        />
      </button>

      <div
        className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-500 ease-out ${
          open ? 'mt-2 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="min-h-0">
          <p className="px-[4.25rem] pr-6 pb-4 text-sm leading-relaxed text-white/65">{a}</p>
        </div>
      </div>
    </li>
  )
}

/* ---------- Page ---------- */
export function Login() {
  const signInWithGoogle = useAuthStore(s => s.signInWithGoogle)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const heading = useReveal<HTMLDivElement>()

  const scrollToFaq = () => {
    document.getElementById('faq-section')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-black text-white antialiased">
      {/* ---------- HERO ---------- */}
      <section className="relative h-screen w-full overflow-hidden">
        {/* Zemin: koyu radial */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, #0b0b0d 0%, #050506 55%, #000 100%)',
          }}
          aria-hidden
        />

        {/* İnce nokta dokusu */}
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              'radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            maskImage:
              'radial-gradient(ellipse at center, black 40%, transparent 85%)',
            WebkitMaskImage:
              'radial-gradient(ellipse at center, black 40%, transparent 85%)',
          }}
          aria-hidden
        />

        {/* Mavi merkez halesi */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(65,93,255,0.18), rgba(65,93,255,0.05) 45%, transparent 70%)',
          }}
          aria-hidden
        />

        {/* Vortex (statik) */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            height: 'min(92vh, 92vw)',
            width: 'min(92vh, 92vw)',
          }}
          aria-hidden
        >
          <Vortex />
        </div>

        {/* İçerik */}
        <div className="relative h-full w-full">
          {/* Başlık — vortex'in üst bölgesinde */}
          <div
            className="absolute left-1/2 -translate-x-1/2 text-center"
            style={{ bottom: 'calc(50% + 140px)' }}
          >
            <h1 className="font-heading text-6xl font-semibold uppercase leading-[0.95] tracking-[0.04em] md:text-7xl lg:text-8xl">
              <span className="block bg-gradient-to-b from-white via-[#d7dcff] to-[#8a9eff] bg-clip-text text-transparent">
                QUARTERLY
              </span>
              <span className="block bg-gradient-to-b from-white via-[#d7dcff] to-[#8a9eff] bg-clip-text text-transparent">
                JOURNAL
              </span>
            </h1>
          </div>

          {/* Login butonu — vortex'in gözü */}
          <button
            onClick={() => setDialogOpen(true)}
            aria-label="Sign in"
            className="group absolute left-1/2 top-1/2 grid h-36 w-36 -translate-x-1/2 -translate-y-1/2 place-items-center"
          >
            {/* Yavaş dönen mavi dış halka */}
            <span
              className="pointer-events-none absolute inset-0 rounded-full border border-[#415dff]/55 [animation:qt-spin_18s_linear_infinite]"
              aria-hidden
            />
            {/* Ters yönde ince ikinci halka */}
            <span
              className="pointer-events-none absolute inset-[8px] rounded-full border border-[#8a9eff]/35 [animation:qt-spin_12s_linear_infinite_reverse]"
              aria-hidden
            />
            {/* Pulse */}
            <span
              className="pointer-events-none absolute inset-0 rounded-full border border-[#8a9eff]/40 [animation:qt-pulse_2.8s_ease-out_infinite]"
              aria-hidden
            />
            {/* Çekirdek */}
            <span className="relative grid h-24 w-24 place-items-center rounded-full bg-black ring-1 ring-[#415dff]/80 shadow-[0_0_32px_rgba(65,93,255,0.35)] transition-all duration-300 group-hover:scale-110 group-hover:ring-[#8a9eff] group-hover:shadow-[0_0_56px_rgba(65,93,255,0.6)]">
              <span className="text-[12px] font-medium tracking-[0.28em] text-white/95 uppercase">
                login
              </span>
            </span>
          </button>
        </div>

        {/* Kenar vinyette */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)',
          }}
          aria-hidden
        />

        {/* Scroll ipucu */}
        <button
          onClick={scrollToFaq}
          className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-white/45 transition-colors hover:text-[#8a9eff]"
          aria-label="Scroll down"
        >
          <span className="text-[10px] font-medium tracking-[0.3em] uppercase">Scroll</span>
          <ChevronDown className="h-4 w-4 [animation:qt-bounce_2s_ease-in-out_infinite]" />
        </button>
      </section>

      {/* ---------- FAQ ---------- */}
      <section
        id="faq-section"
        className="relative flex min-h-screen items-center justify-center px-6 pt-40 pb-24"
      >
        {/* Başlığın çok altında, ince bir altın sızıntı (kenarda değil, iç alanda) */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[680px] max-w-[90%] -translate-x-1/2 -translate-y-1/2 blur-3xl"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(65,93,255,0.08), transparent 70%)',
          }}
          aria-hidden
        />

        <div className="relative z-10 mx-auto w-full max-w-4xl">
          <div
            ref={heading.ref}
            className={`mb-12 text-center transition-all duration-700 ease-out ${
              heading.shown ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
          >
            <p className="mb-3 text-[11px] font-medium tracking-[0.4em] text-[#8a9eff]/80 uppercase">
              Frequently Asked
            </p>
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-white md:text-4xl">
              How does Quarterly Journal work?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/50">
              A journal designed from scratch for Quarterly Theory traders. Here are the
              questions we hear most.
            </p>
          </div>

          <ul className="flex flex-col gap-3">
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
        </div>
      </section>

      {/* ---------- Login Dialog ---------- */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          showCloseButton={false}
          className="overflow-hidden border border-white/10 bg-[#0b0b0d] p-0 text-white shadow-[0_30px_90px_-20px_rgba(0,0,0,0.9)] sm:max-w-md"
        >
          {/* Üstte ince altın aksan çizgi */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-[#415dff]/70 to-transparent" />

          {/* Yumuşak radial altın parıltı */}
          <div
            className="pointer-events-none absolute left-1/2 top-0 h-56 w-[140%] -translate-x-1/2 -translate-y-1/2 blur-3xl"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(65,93,255,0.15), transparent 70%)',
            }}
            aria-hidden
          />

          <div className="relative px-8 pt-10 pb-8">
            {/* Marka mührü */}
            <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-full border border-[#415dff]/40 bg-black/60 shadow-[0_0_24px_rgba(65,93,255,0.22)]">
              <span className="font-heading text-xl font-semibold tracking-tight text-[#8a9eff]">
                QT
              </span>
            </div>

            <DialogHeader className="items-center gap-1">
              <DialogTitle className="font-heading text-center text-xl font-semibold tracking-tight text-white">
                Welcome back
              </DialogTitle>
              <DialogDescription className="text-center text-[13px] leading-relaxed text-white/50">
                Sign in to continue to your journal.
              </DialogDescription>
            </DialogHeader>

            <button
              onClick={() => signInWithGoogle().catch(console.error)}
              className="group mt-7 flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white transition-all duration-200 hover:border-white/30 hover:bg-white/[0.07] hover:shadow-[0_0_24px_rgba(255,255,255,0.06)]"
            >
              <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* İnce ayırıcı ve etiket */}
            <div className="mt-7 flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-white/30">
              <span className="h-px flex-1 bg-white/10" />
              <span>Secure sign-in</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
