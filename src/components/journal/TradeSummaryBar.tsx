import { ArrowRight, Clock, ExternalLink, Hash, Maximize2, TrendingDown, TrendingUp } from 'lucide-react'
import { formatET } from '@/lib/formatET'
import { PairBadge } from './PairBadge'
import { OutcomeBadge } from './OutcomeBadge'
import { SessionBadge } from './SessionBadge'
import { ConfirmationChips } from './ConfirmationChips'
import { useS } from '@/lib/i18n'
import type { TradeWithRelations } from '@/types'

interface Props {
  trade: TradeWithRelations
  onOpenFull: () => void
}

/**
 * Journal tablosunda bir satırın altında açılan kompakt özet barı. TradeDetailPanel'in
 * tam modal'ı yerine, satırı kapatmadan trade'in en kritik metriklerini tek bakışta
 * gösterir. Detay için "tam özet" linki TradeDetailPanel'i açar.
 */
export function TradeSummaryBar({ trade, onOpenFull }: Props) {
  const S = useS()

  const entryRaw = trade.entry_time_et ?? null
  const exitRaw  = trade.exit_time_et ?? null
  const pnl = trade.pnl_usd
  const pnlClass = pnl === null ? 'text-gray-400' : pnl > 0 ? 'text-emerald-600 dark:text-emerald-400' : pnl < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-500 dark:text-[#9ca3af]'
  const durationStr = trade.duration_sec != null
    ? trade.duration_sec >= 60
      ? `${Math.floor(trade.duration_sec / 60)}m ${trade.duration_sec % 60}s`
      : `${trade.duration_sec}s`
    : '—'

  return (
    <div className="border-y border-gray-200/70 dark:border-white/8 bg-gray-50/80 dark:bg-[#0f0f0f] px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
        {/* Identity */}
        <div className="flex items-center gap-2">
          <PairBadge symbol={trade.symbol} />
          <OutcomeBadge outcome={trade.outcome} />
          {trade.direction && (
            <span className="inline-flex items-center gap-1 rounded-md bg-white px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-gray-600 ring-1 ring-gray-200 dark:bg-white/5 dark:text-[#d1d5db] dark:ring-white/10">
              {trade.direction === 'long'
                ? <TrendingUp className="h-3 w-3 text-emerald-500" />
                : <TrendingDown className="h-3 w-3 text-rose-500" />}
              {trade.direction}
            </span>
          )}
          {trade.session && <SessionBadge session={trade.session} />}
        </div>

        {/* Entry → Exit */}
        <div className="flex items-center gap-2 font-mono text-gray-700 dark:text-[#d1d5db]">
          <Stat label={S.journal.entry ?? 'Entry'}>
            {trade.entry_price !== null ? `$${trade.entry_price.toFixed(2)}` : '—'}
          </Stat>
          <ArrowRight className="h-3 w-3 text-gray-400 dark:text-[#6b7280]" />
          <Stat label={S.journal.exit ?? 'Exit'}>
            {trade.exit_price !== null ? `$${trade.exit_price.toFixed(2)}` : '—'}
          </Stat>
          {trade.qty !== null && (
            <span className="ml-1 inline-flex items-center gap-0.5 text-[11px] text-gray-500 dark:text-[#9ca3af]">
              <Hash className="h-3 w-3" />{trade.qty}
            </span>
          )}
        </div>

        {/* Numbers */}
        <div className="flex items-center gap-4">
          <Stat label="PnL">
            <span className={`font-mono font-semibold ${pnlClass}`}>
              {pnl === null ? '—' : `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`}
            </span>
          </Stat>
          <Stat label="R">
            <span className="font-mono">{trade.r_multiple !== null ? trade.r_multiple.toFixed(2) : '—'}</span>
          </Stat>
          <Stat label={S.journal.duration ?? 'Dur'}>
            <span className="inline-flex items-center gap-1 font-mono text-gray-600 dark:text-[#d1d5db]">
              <Clock className="h-3 w-3" />{durationStr}
            </span>
          </Stat>
        </div>

        {/* Times */}
        <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-[#9ca3af]">
          <span className="font-mono">{entryRaw ? formatET(entryRaw, 'MMM d, HH:mm') : '—'}</span>
          {exitRaw && (
            <>
              <ArrowRight className="h-3 w-3 text-gray-400 dark:text-[#6b7280]" />
              <span className="font-mono">{formatET(exitRaw, 'HH:mm')}</span>
            </>
          )}
        </div>

        {/* Confirmations */}
        {trade.trade_confirmations.length > 0 && (
          <div className="flex items-center gap-1.5">
            <ConfirmationChips confirmations={trade.trade_confirmations} />
          </div>
        )}

        {/* Notes preview */}
        {trade.notes && (
          <p className="max-w-[260px] truncate text-[11px] italic text-gray-500 dark:text-[#9ca3af]">
            "{trade.notes}"
          </p>
        )}

        {/* Spacer + actions */}
        <div className="ml-auto flex items-center gap-2">
          {trade.chart_link && (
            <a
              href={trade.chart_link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
            >
              {S.journal.chart}<ExternalLink className="h-3 w-3" />
            </a>
          )}
          <button
            onClick={onOpenFull}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-100 dark:text-[#d1d5db] dark:hover:bg-white/10"
          >
            <Maximize2 className="h-3 w-3" />{S.journal.fullDetails ?? 'Full details'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-[#6b7280]">{label}</span>
      {children}
    </span>
  )
}
