import { format } from 'date-fns'
import { X } from 'lucide-react'
import { PairBadge } from '@/components/journal/PairBadge'
import { OutcomeBadge } from '@/components/journal/OutcomeBadge'
import { SessionBadge } from '@/components/journal/SessionBadge'
import type { TradeWithRelations } from '@/types'

interface Props {
  date: Date | null
  trades: TradeWithRelations[]
  onClose: () => void
}

export function DayTradesModal({ date, trades, onClose }: Props) {
  if (!date) return null

  const totalPnl = trades.reduce((s, t) => s + (t.pnl_usd ?? 0), 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-lg rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] shadow-xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/10">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{format(date, 'MMMM d, yyyy')}</p>
            <p
              className="text-xs font-mono"
              style={{ color: totalPnl >= 0 ? '#10b981' : '#ef4444' }}
            >
              {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)} · {trades.length} trade
            </p>
          </div>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {trades.map(trade => {
            const entryTime = trade.entry_time_et ? new Date(trade.entry_time_et) : null
            return (
              <div
                key={trade.id}
                className="flex items-center justify-between px-5 py-3 border-b border-white/5 last:border-0"
              >
                <div className="flex items-center gap-3">
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
                    className="text-sm font-mono font-medium"
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
