import { useMemo } from 'react'
import { formatDistanceToNowStrict } from 'date-fns'
import { useNewsStore } from '@/stores/useNewsStore'
import { flag } from '@/lib/news/format'
import { LiveDot } from './LiveDot'
import { useS } from '@/lib/i18n'

function fmtValue(n: number | null, unit: string): string {
  if (n == null || !Number.isFinite(n)) return '—'
  if (unit === 'K' || unit === 'M$') return n.toLocaleString(undefined, { maximumFractionDigits: 0 })
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

function safeDate(iso?: string | null): Date | null {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

const IMPACT_DOT = {
  high:   'bg-rose-500',
  medium: 'bg-amber-400',
  low:    'bg-gray-300 dark:bg-white/20',
} as const

export function EconReleases() {
  const releases   = useNewsStore(s => s.releases)
  const showLow    = useNewsStore(s => s.showLowEconImpact)
  const setShowLow = useNewsStore(s => s.setShowLowEconImpact)
  const S = useS()

  const visible = useMemo(
    () =>
      releases
        .filter(r => showLow || r.impact === 'high' || r.impact === 'medium')
        .slice(0, 10),
    [releases, showLow],
  )

  return (
    <section className="flex flex-col rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-[#1a1a1a]">
      <header className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-white/5">
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-semibold tracking-tight text-gray-900 dark:text-white">
            {S.news.econReleases}
          </h2>
          <LiveDot />
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-[11px] text-gray-500 dark:text-[#9ca3af]">
          <input
            type="checkbox"
            checked={showLow}
            onChange={e => setShowLow(e.target.checked)}
            className="h-3 w-3 accent-[#415dff]"
          />
          {S.news.showLow}
        </label>
      </header>

      {visible.length === 0 ? (
        <div className="p-10 text-center">
          <p className="text-sm text-gray-400 dark:text-[#6b7280]">{S.news.waiting}</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-white/5">
          {visible.map(r => {
            const tone =
              r.beatExpectation === 'beat'   ? 'text-emerald-600 dark:text-emerald-400' :
              r.beatExpectation === 'miss'   ? 'text-rose-600 dark:text-rose-400'       :
              r.beatExpectation === 'inline' ? 'text-gray-500 dark:text-[#9ca3af]'      :
                                                'text-gray-400 dark:text-[#6b7280]'
            const released = safeDate(r.releasedAt)
            return (
              <li key={r.id} className="flex items-center gap-4 px-5 py-3">
                <span className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-[#9ca3af]">
                  <span className={`h-2 w-2 rounded-full ${IMPACT_DOT[r.impact]}`} aria-hidden />
                  <span>{flag(r.country) || r.country}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-gray-900 dark:text-white">{r.title}</p>
                  <p className="mt-0.5 text-[11px] text-gray-400 dark:text-[#6b7280]">
                    {released && (
                      <span title={released.toLocaleString()}>
                        {S.news.released} {formatDistanceToNowStrict(released, { addSuffix: true })}
                      </span>
                    )}
                    {released && r.unit ? <span className="mx-1.5 opacity-50">·</span> : null}
                    {r.unit && <span>{r.unit}</span>}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-right text-xs tabular-nums">
                  <Col label={S.news.actual}   value={fmtValue(r.actual,   r.unit)} className={tone} />
                  <Col label={S.news.forecast} value={fmtValue(r.forecast, r.unit)} />
                  <Col label={S.news.previous} value={fmtValue(r.previous, r.unit)} />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function Col({
  label, value, className = 'text-gray-700 dark:text-[#d1d5db]',
}: { label: string; value: string; className?: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-[#6b7280]">{label}</p>
      <p className={`mt-0.5 font-mono text-sm font-medium ${className}`}>{value}</p>
    </div>
  )
}
