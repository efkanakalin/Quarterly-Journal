import { forwardRef } from 'react'
import { AreaChart, Area, YAxis, ResponsiveContainer } from 'recharts'
import { formatET } from '@/lib/formatET'
import type { TradeWithRelations } from '@/types'

export interface DailyReportData {
  date:         string
  label:        string
  trades:       TradeWithRelations[]
  netPnl:       number
  winners:      number
  losers:       number
  winrate:      number
  grossPnl:     number
  volume:       number
  profitFactor: number
  curve:        { t: number; pnl: number }[]
  note?:        string
}

/**
 * Branded daily report layout, sized for A4 (≈794 × n × 1123 px at 96 DPI).
 * Rendered off-screen, captured by html-to-image, embedded into a PDF.
 * Always light theme so the printed page reads cleanly on any printer.
 */
export const DailyReportPDF = forwardRef<HTMLDivElement, { data: DailyReportData }>(
  function DailyReportPDF({ data }, ref) {
    const isPos = data.netPnl >= 0
    const accentBar = isPos
      ? 'from-emerald-500 via-emerald-400 to-transparent'
      : 'from-rose-500 via-rose-400 to-transparent'

    return (
      <div
        ref={ref}
        style={{
          width:      '794px',
          background: '#ffffff',
          color:      '#0f172a',
          fontFamily: '"Geist Variable", "Geist", -apple-system, BlinkMacSystemFont, sans-serif',
        }}
      >
        {/* Top accent bar */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${accentBar}`} />

        {/* Header: logo + report title */}
        <div className="flex items-end justify-between px-10 pt-8 pb-6 border-b border-slate-200">
          <img
            src="/qt-full.png"
            alt="Quarterly Journal"
            crossOrigin="anonymous"
            style={{ height: 56, width: 'auto', objectFit: 'contain' }}
          />
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">
              Daily Trading Report
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {data.label}
            </p>
          </div>
        </div>

        {/* Hero KPI band */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-200">
          <KpiHero label="Net P&L"
            value={`${isPos ? '+' : ''}$${data.netPnl.toFixed(2)}`}
            tone={isPos ? 'pos' : 'neg'}
          />
          <KpiHero label="Win Rate"
            value={`${data.winrate.toFixed(0)}%`}
            tone="neutral"
          />
          <KpiHero label="Profit Factor"
            value={data.profitFactor === 99 ? '∞' : data.profitFactor.toFixed(2)}
            tone="neutral"
          />
        </div>

        {/* Secondary metrics */}
        <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-200">
          <KpiCell label="Trades"   value={String(data.trades.length)} />
          <KpiCell label="Winners"  value={String(data.winners)} />
          <KpiCell label="Losers"   value={String(data.losers)} />
          <KpiCell label="Volume"   value={String(data.volume)} />
        </div>

        {/* Equity curve */}
        {data.curve.length > 1 && (
          <div className="px-10 pt-6 pb-3 border-b border-slate-200">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400 mb-2">
              Cumulative P&L
            </p>
            <div style={{ height: 140 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.curve} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="dailyReportGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={isPos ? '#10b981' : '#f43f5e'} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={isPos ? '#10b981' : '#f43f5e'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <YAxis hide domain={['auto', 'auto']} />
                  <Area
                    type="monotone"
                    dataKey="pnl"
                    stroke={isPos ? '#10b981' : '#f43f5e'}
                    strokeWidth={2}
                    fill="url(#dailyReportGrad)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Trade log */}
        <div className="px-10 pt-6 pb-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400 mb-3">
            Trades ({data.trades.length})
          </p>
        </div>
        <table className="w-full text-[12px]" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '13%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '30%' }} />
          </colgroup>
          <thead>
            <tr className="bg-slate-50 border-y border-slate-200">
              <Th>Time (ET)</Th>
              <Th>Pair</Th>
              <Th>Side</Th>
              <Th align="center">Qty</Th>
              <Th align="right">P&L</Th>
              <Th align="center">R</Th>
              <Th>Confluences</Th>
            </tr>
          </thead>
          <tbody>
            {data.trades.map(t => (
              <TradeReportRow key={t.id} trade={t} />
            ))}
            {data.trades.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-6 text-center text-slate-400">
                  No trades.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Notes */}
        {data.note && data.note.trim() !== '' && (
          <div className="px-10 pt-6 pb-2 border-t border-slate-200">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400 mb-2">
              Daily Note
            </p>
            <p className="text-[12px] leading-relaxed whitespace-pre-wrap text-slate-700">
              {data.note}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 px-10 py-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-slate-400">
            quarterlyjournal.org
          </span>
          <span className="text-[10px] text-slate-400">
            Generated {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>
    )
  }
)

/* ─── Helpers ─────────────────────────────────────────────────────── */

function KpiHero({ label, value, tone }: { label: string; value: string; tone: 'pos' | 'neg' | 'neutral' }) {
  const color =
    tone === 'pos' ? 'text-emerald-600'
    : tone === 'neg' ? 'text-rose-600'
    : 'text-slate-900'
  return (
    <div className="px-6 py-5 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold font-mono tracking-tight ${color}`}>{value}</p>
    </div>
  )
}

function KpiCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-6 py-3 text-center">
      <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-mono font-semibold text-slate-900">{value}</p>
    </div>
  )
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' | 'center' }) {
  return (
    <th
      className={`px-3 py-2 text-[9px] font-semibold uppercase tracking-widest text-slate-500`}
      style={{ textAlign: align }}
    >
      {children}
    </th>
  )
}

function TradeReportRow({ trade }: { trade: TradeWithRelations }) {
  const entryRaw = trade.entry_time_et ?? null
  const time = entryRaw ? formatET(entryRaw, 'HH:mm:ss') : '—'
  const side = trade.direction ? trade.direction.toUpperCase() : '—'
  const pnl = trade.pnl_usd
  const pnlColor =
    pnl == null ? 'text-slate-400'
    : pnl > 0 ? 'text-emerald-600'
    : pnl < 0 ? 'text-rose-600'
    : 'text-slate-500'

  const tags = trade.trade_confirmations
    ?.map(c => (c.timeframe ? `${c.timeframe} ${c.confirmation_type}` : c.confirmation_type))
    .join(', ') ?? ''

  return (
    <tr className="border-b border-slate-100">
      <td className="px-3 py-1.5 font-mono text-slate-700">{time}</td>
      <td className="px-3 py-1.5 text-slate-900 font-medium">{trade.symbol ?? '—'}</td>
      <td className="px-3 py-1.5 text-slate-700">{side}</td>
      <td className="px-3 py-1.5 text-center font-mono text-slate-900">{trade.qty ?? '—'}</td>
      <td className={`px-3 py-1.5 text-right font-mono font-semibold ${pnlColor}`}>
        {pnl != null ? `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}` : '—'}
      </td>
      <td className="px-3 py-1.5 text-center font-mono text-slate-700">
        {trade.r_multiple != null ? `${trade.r_multiple.toFixed(2)}R` : '—'}
      </td>
      <td className="px-3 py-1.5 text-slate-600 truncate" title={tags}>
        {tags || '—'}
      </td>
    </tr>
  )
}
