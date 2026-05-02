import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { ParticleField } from '@/components/landing/ParticleField'

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
            ? 'border-slate-400/40 bg-slate-50 shadow-sm'
            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
        }`}
      >
        <span className={`text-sm font-semibold transition-colors ${open ? 'text-slate-900' : 'text-slate-800'}`}>{q}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-all duration-200 ${open ? 'rotate-180 text-slate-700' : 'text-slate-400'}`}
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

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">

      {/* ─────────────────── Dark Hero with Particles ─────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#050505] via-[#101012] to-[#1c1c20]">
        {/* Particle field */}
        <ParticleField />

        {/* Subtle radial vignette to focus on center */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 30%, transparent 0%, rgba(0,0,0,0.55) 100%)' }}
          aria-hidden
        />

        {/* Navbar */}
        <nav className="relative z-20 flex items-center justify-between px-6 sm:px-10 py-5">
          <img
            src="/qt-full.png"
            alt="Quarterly Journal"
            className="h-14 sm:h-16 w-auto object-contain"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/auth?mode=signin"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-200 hover:text-white hover:bg-white/5 transition"
            >
              Login
            </Link>
            <Link
              to="/auth?mode=signup"
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 active:scale-[0.98] transition shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </nav>

        {/* Hero copy */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 pt-16 pb-72 sm:pb-80">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
            <span className="text-xs font-semibold text-slate-200 tracking-wide">Built for Quarterly Theory Traders</span>
          </div>

          <div
            ref={headRef}
            className={`transition-all duration-700 ease-out ${headShown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] max-w-3xl text-white">
              A{' '}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">Trading Journal</span>
              </span>
              <br />
              to Master Your Process
            </h1>
            <p className="mt-5 text-base sm:text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
              Track every trade, measure your confluences, and build a data-driven edge — all within the Quarterly Theory framework.
            </p>
          </div>

          {/* Get Started CTA */}
          <Link
            to="/auth?mode=signup"
            className="mt-10 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 active:scale-[0.98] transition shadow-lg"
          >
            Get Started
          </Link>
        </div>

        {/* Curved white transition at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-[160px] sm:h-[220px] pointer-events-none">
          <svg
            viewBox="0 0 1440 220"
            preserveAspectRatio="none"
            className="w-full h-full"
          >
            <path
              d="M0,220 L0,80 Q720,260 1440,80 L1440,220 Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* ─────────────────── Dashboard preview floating on the curve ─────────────────── */}
      <div className="relative -mt-[260px] sm:-mt-[340px] mb-12 sm:mb-20 px-4 sm:px-6 z-10">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-slate-900/10 bg-white shadow-2xl overflow-hidden">
            <img
              src="/qt-dashboard-preview.png"
              alt="Quarterly Journal Dashboard"
              className="w-full h-auto block"
            />
          </div>
        </div>
      </div>

      {/* ─────────────────── FAQ on white ─────────────────── */}
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

      {/* ─────────────────── Footer ─────────────────── */}
      <footer className="border-t border-slate-200 bg-white py-6 px-6 text-center text-xs text-slate-400">
        <a href="/privacy" className="hover:text-slate-600 underline underline-offset-2 transition-colors">Privacy Policy</a>
        <span className="mx-3 opacity-50">·</span>
        <span>© {new Date().getFullYear()} Quarterly Journal</span>
      </footer>
    </div>
  )
}
