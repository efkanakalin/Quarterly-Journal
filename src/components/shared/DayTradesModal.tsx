import { useMemo } from 'react'
import { format } from 'date-fns'
import { X } from 'lucide-react'
import { PairBadge } from '@/components/journal/PairBadge'
import { OutcomeBadge } from '@/components/journal/OutcomeBadge'
import { SessionBadge } from '@/components/journal/SessionBadge'
import { mergeIntoLogicalTrades } from '@/lib/trades/mergeGroupedTrades'
import type { TradeWithRelations } from '@/types'

interface Props {
  date: Date | null
  trades: TradeWithRelations[]
  onClose: () => void
}

export function DayTradesModal({ date, trades, onClose }: Props) {
  const merged = useMemo(() => mergeIntoLogicalTrades(trades), [trades])

  if (!date) return null

  const totalPnl = merged.reduce((s, t) => s + (t.pnl_usd ?? 0), 0)

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 sm:p-4">
      <div onClick={e => e.stopPropagation()} className="w-full sm:max-w-lg sm:rounded-xl border-0 sm:border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] shadow-xl max-h-[85vh] sm:max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 dark:border-white/10 shrink-0">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{format(date, 'MMMM d, yyyy')}</p>
            <p
              className="text-xs font-mono"
              style={{ color: totalPnl >= 0 ? '#10b981' : '#ef4444' }}
            >
              {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)} · {merged.length} trade
            </p>
          </div>
          <button onClick={onClose} className="rounded-md p-2 text-[#9ca3af] hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {merged.map(trade => {
            const entryTime = trade.entry_time_et ? new Date(trade.entry_time_et) : null
            return (
              <div
                key={trade.id}
                className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-gray-100 dark:border-white/5 last:border-0"
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0">
                  <PairBadge symbol={trade.symbol} />
                  <OutcomeBadge outcome={trade.outcome} />
                  <SessionBadge session={trade.session} />
                  {entryTime && (
                    <span className="text-xs text-[#9ca3af] font-mono">
                      {format(entryTime, 'HH:mm')}
                    </span>
                  )}
                </div>
                {trade.pnl_usd !== null && (
                  <span
                    className="text-sm font-mono font-medium shrink-0"
                    style={{ color: trade.pnl_usd >= 0 ? '#10b981' : '#ef4444' }}
                  >
                    {trade.pnl_usd >= 0 ? '+' : ''}${trade.pnl_usd.toFixed(2)}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
