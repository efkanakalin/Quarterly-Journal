import { useEffect } from 'react'
import { X, ExternalLink, Clock, Calendar, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { formatET } from '@/lib/formatET'
import { PairBadge } from './PairBadge'
import { OutcomeBadge } from './OutcomeBadge'
import { SessionBadge } from './SessionBadge'
import { ConfirmationChips } from './ConfirmationChips'
import { useS } from '@/lib/i18n'
import type { TradeWithRelations } from '@/types'

interface Props {
  trade: TradeWithRelations | null
  open: boolean
  onClose: () => void
}

export function TradeDetailPanel({ trade, open, onClose }: Props) {
  const S = useS()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !trade) return null

  const entryRaw = trade.entry_time_et ?? null
  const exitRaw  = trade.exit_time_et ?? null

  const pnl = trade.pnl_usd
  const pnlPositive = pnl !== null && pnl > 0
  const pnlNegative = pnl !== null && pnl < 0
  const pnlColorClass =
    pnlPositive ? 'text-emerald-600 dark:text-emerald-400'
    : pnlNegative ? 'text-rose-600 dark:text-rose-400'
    : 'text-gray-500 dark:text-[#9ca3af]'

  const durationStr = trade.duration_sec != null
    ? `${Math.floor(trade.duration_sec / 60)}m ${trade.duration_sec % 60}s`
    : '—'

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full sm:max-w-2xl max-h-screen sm:max-h-[90vh] overflow-y-auto sm:rounded-2xl border-0 sm:border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141414] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-white/5 sticky top-0 bg-white dark:bg-[#141414] z-10">
          <div className="flex items-center gap-3">
            <PairBadge symbol={trade.symbol} />
            <OutcomeBadge outcome={trade.outcome} />
            {trade.direction && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-[#9ca3af] uppercase tracking-wide">
                {trade.direction === 'long'
                  ? <TrendingUp className="h-3.5 w-3.5" />
                  : <TrendingDown className="h-3.5 w-3.5" />}
                {trade.direction}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Hero — PnL + R + duration */}
        <div className="px-4 sm:px-6 py-5 sm:py-6 grid grid-cols-3 gap-3 sm:gap-4 border-b border-gray-100 dark:border-white/5">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400 dark:text-[#6b7280]">P&L</p>
            <p className={`mt-1 text-xl sm:text-3xl font-bold font-mono truncate ${pnlColorClass}`}>
              {pnl !== null ? `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}` : '—'}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400 dark:text-[#6b7280]">R Multiple</p>
            <p className="mt-1 text-xl sm:text-3xl font-bold font-mono text-gray-900 dark:text-white truncate">
              {trade.r_multiple != null ? `${trade.r_multiple}R` : '—'}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400 dark:text-[#6b7280] flex items-center gap-1">
              <Clock className="h-3 w-3" /> Duration
            </p>
            <p className="mt-1 text-xl sm:text-3xl font-bold font-mono text-gray-900 dark:text-white truncate">
              {durationStr}
            </p>
          </div>
        </div>

        {/* Timing strip */}
        <div className="px-4 sm:px-6 py-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 border-b border-gray-100 dark:border-white/5">
          <InfoItem
            icon={<Calendar className="h-3.5 w-3.5" />}
            label={`${S.journal.date} (ET)`}
            value={entryRaw ? formatET(entryRaw, 'MMM d, yyyy HH:mm') : '—'}
          />
          <InfoItem
            icon={<Activity className="h-3.5 w-3.5" />}
            label={S.journal.session}
            value={<SessionBadge session={trade.session} />}
          />
        </div>

        {/* Metrics grid */}
        <div className="px-4 sm:px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-4 border-b border-gray-100 dark:border-white/5">
          <Metric label="Qty"          value={trade.qty ?? '—'} />
          <Metric label="Entry Price"  value={trade.entry_price ?? '—'} />
          <Metric label="Exit Price"   value={trade.exit_price ?? '—'} />
          <Metric label="Exit (ET)"    value={exitRaw ? formatET(exitRaw, 'HH:mm') : '—'} />
          <Metric label="Session Q"    value={trade.session_quarter ?? '—'} />
          <Metric label="Micro Q"      value={trade.micro_quarter_90m ?? '—'} />
          <Metric label="Year Q"       value={trade.year_quarter ?? '—'} />
          <Metric label="Month Q"      value={trade.month_quarter ?? '—'} />
        </div>

        {/* Confluences */}
        {trade.trade_confirmations?.length > 0 && (
          <Section title={S.journal.confluence}>
            <ConfirmationChips confirmations={trade.trade_confirmations} />
          </Section>
        )}

        {/* Mistakes */}
        {trade.trade_mistakes?.length > 0 && (
          <Section title="Mistakes">
            <div className="flex flex-wrap gap-1.5">
              {trade.trade_mistakes.map(m => (
                <span
                  key={m.id}
                  className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
                >
                  {m.mistake_type}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Notes */}
        {trade.notes && (
          <Section title={S.journal.notes}>
            <p className="text-sm text-gray-700 dark:text-[#d1d5db] whitespace-pre-wrap leading-relaxed">
              {trade.notes}
            </p>
          </Section>
        )}

        {/* Chart link */}
        {trade.chart_link && (
          <div className="px-4 sm:px-6 py-4 border-t border-gray-100 dark:border-white/5">
            <a
              href={trade.chart_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#415dff] dark:text-[#8a9eff] hover:underline"
            >
              {S.journal.chart} <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

function InfoItem({ icon, label, value }: { icon?: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400 dark:text-[#6b7280] flex items-center gap-1">
        {icon}{label}
      </p>
      <div className="mt-1 text-sm text-gray-900 dark:text-white">{value}</div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400 dark:text-[#6b7280]">{label}</p>
      <p className="mt-1 text-sm font-mono text-gray-900 dark:text-white">{value}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-white/5 last:border-0">
      <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400 dark:text-[#6b7280] mb-2">
        {title}
      </p>
      {children}
    </div>
  )
}
