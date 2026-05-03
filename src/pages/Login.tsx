import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { ParticleField } from '@/components/landing/ParticleField'

/* ─── Scroll-reveal ─────────────────────────────────────── */
function useReveal<T extends HTMLElement>(threshold = 0.15) {
  const ref  = useRef<T | null>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    // İlk render anında zaten görünürse animasyonu çalıştır
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { setShown(true); io.disconnect() }
    }, { threshold, rootMargin: '0px 0px -8% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
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

/* ─── FAQ Item — minimalist, ince ayraçlı ─────────────────── */
function FaqItem({ q, a, index, open, onToggle }: {
  q: string; a: string; index: number; open: boolean; onToggle: () => void
}) {
  const { ref, shown } = useReveal<HTMLLIElement>(0)
  return (
    <li
      ref={ref}
      style={{ transitionDelay: shown ? `${index * 110}ms` : '0ms' }}
      className={`border-b border-slate-200 transition-all duration-[900ms] ease-out ${shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 text-left py-5 group"
      >
        <span className={`text-base font-medium transition-colors ${open ? 'text-slate-900' : 'text-slate-700 group-hover:text-slate-900'}`}>{q}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-all duration-300 ${open ? 'rotate-180 text-slate-700' : 'text-slate-400'}`}
        />
      </button>
      <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="min-h-0">
          <p className="pb-5 text-sm text-slate-600 leading-relaxed pr-8">{a}</p>
        </div>
      </div>
    </li>
  )
}

/* ─── Page ───────────────────────────────────────────────── */
export function Login() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const { ref: headRef, shown: headShown } = useReveal<HTMLDivElement>()
  const { ref: dashRef, shown: dashShown } = useReveal<HTMLDivElement>(0.05)

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">

      {/* ─────────────────── Dark Hero with Particles ─────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#050505] via-[#0c0c10] to-[#1a1a20]">
        {/* Particle field — pointer-events-none, mouse window'a bağlı */}
        <ParticleField />

        {/* Hafif vignette — koyu zemin korunsun */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 75% 55% at 50% 35%, transparent 0%, rgba(0,0,0,0.4) 100%)' }}
          aria-hidden
        />

        {/* Navbar */}
        <nav className="relative z-30 flex items-center justify-between gap-3 px-4 sm:px-10 py-4 sm:py-5">
          <img
            src="/qt-full.png"
            alt="Quarterly Journal"
            className="h-12 sm:h-24 lg:h-28 w-auto object-contain shrink-0"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <Link
              to="/auth?mode=signin"
              className="rounded-lg px-3 sm:px-5 py-1.5 sm:py-2.5 text-sm sm:text-base font-medium text-slate-200 hover:text-white hover:bg-white/5 transition"
            >
              Login
            </Link>
            <Link
              to="/auth?mode=signup"
              className="rounded-lg bg-white px-3 sm:px-5 py-1.5 sm:py-2.5 text-sm sm:text-base font-semibold text-slate-900 hover:bg-slate-100 active:scale-[0.98] transition shadow-sm whitespace-nowrap"
            >
              Get Started
            </Link>
          </div>
        </nav>

        {/* Hero copy + CTA */}
        <div className="relative z-20 flex flex-col items-center text-center px-6 pt-4 sm:pt-8 pb-56 sm:pb-72">
          <div
            ref={headRef}
            className={`transition-all duration-700 ease-out ${headShown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 [animation:qt-pulse_2s_ease-in-out_infinite]" />
              <span className="text-xs font-semibold text-slate-200 tracking-wide">Built for Quarterly Theory Traders</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] max-w-3xl text-white">
              A{' '}
              <span className="bg-gradient-to-r from-slate-100 via-white to-slate-300 bg-clip-text text-transparent">Trading Journal</span>
              <br />
              to Master Your Process
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
              Track every trade, measure your confluences, and build a data-driven edge within the Quarterly Theory framework — completely free.
            </p>

            {/* CTA */}
            <Link
              to="/auth?mode=signup"
              className="mt-10 inline-flex items-center gap-2 rounded-lg bg-white px-7 py-3.5 text-base font-semibold text-slate-900 hover:bg-slate-100 active:scale-[0.98] transition shadow-[0_8px_30px_rgba(255,255,255,0.15)]"
            >
              Get Started
            </Link>
          </div>
        </div>

        {/* Curved white transition at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-[120px] sm:h-[180px] pointer-events-none">
          <svg
            viewBox="0 0 1440 220"
            preserveAspectRatio="none"
            className="w-full h-full"
          >
            <path
              d="M0,220 L0,90 Q720,260 1440,90 L1440,220 Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* ─────────────────── Dashboard preview — derinlik efekti ─────────────────── */}
      <div
        ref={dashRef}
        className={`relative -mt-[140px] sm:-mt-[220px] mb-16 sm:mb-24 px-4 sm:px-6 z-10 transition-all duration-1000 ease-out ${dashShown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
      >
        <div className="mx-auto max-w-6xl">
          {/* Dış glow layer (mavimsi mistik halo) */}
          <div
            className="absolute -inset-4 rounded-3xl opacity-50 blur-3xl"
            style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(180,180,210,0.45), transparent 70%)' }}
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
            {/* Window controls bar */}
            <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-t-xl bg-[#16161a] border-b border-white/[0.06]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              <div className="flex-1 mx-3">
                <div className="mx-auto max-w-[280px] rounded-md bg-[#0c0c10] px-3 py-1 text-center text-[10px] text-slate-500 font-mono">
                  app.quarterlyjournal.com/dashboard
                </div>
              </div>
            </div>

            {/* Dashboard image */}
            <div className="rounded-b-xl overflow-hidden bg-white">
              <img
                src="/qt-dashboard-preview.png"
                alt="Quarterly Journal Dashboard"
                className="w-full h-auto block"
              />
            </div>
          </div>

          {/* Reflective sheen at top */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}
            aria-hidden
          />
        </div>
      </div>

      {/* ─────────────────── FAQ on white — minimalist ─────────────────── */}
      <section id="faq" className="px-6 pb-24 max-w-2xl mx-auto">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Frequently asked questions
          </h2>
          <p className="mt-3 text-sm text-slate-500">Everything you need to know before you start.</p>
        </div>

        <ul className="border-t border-slate-200">
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
        <a href="/terms" className="hover:text-slate-600 underline underline-offset-2 transition-colors">Terms of Service</a>
        <span className="mx-3 opacity-50">·</span>
        <span>© {new Date().getFullYear()} Quarterly Journal</span>
      </footer>
    </div>
  )
}
