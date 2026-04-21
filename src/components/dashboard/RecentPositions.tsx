import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { PairBadge } from '@/components/journal/PairBadge'
import { OutcomeBadge } from '@/components/journal/OutcomeBadge'
import { useS } from '@/lib/i18n'
import type { TradeWithRelations } from '@/types'

interface Props { trades: TradeWithRelations[] }

export function RecentPositions({
  trades }: Props) {
  const S = useS()
  const navigate = useNavigate()
  const recent = [...trades]
    .sort((a, b) => {
      const ta = a.entry_time_et ? new Date(a.entry_time_et).getTime() : 0
      const tb = b.entry_time_et ? new Date(b.entry_time_et).getTime() : 0
      return tb - ta
    })
    .slice(0, 10)

  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-white/10">
        <p className="text-xs font-medium text-gray-500 dark:text-[#9ca3af]">{S.dashboard.recentPositions}</p>
      </div>

      {recent.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-gray-400 dark:text-[#9ca3af]">Henüz işlem yok</p>
          <p className="text-xs text-gray-300 dark:text-[#6b7280] mt-1">Jurnal'dan ilk işleminizi ekleyin</p>
        </div>
      ) : (
        <div>
          {recent.map(trade => {
            const entryTime = trade.entry_time_et ? new Date(trade.entry_time_et) : null
            const relativeTime = entryTime
              ? formatDistanceToNow(entryTime, { addSuffix: true, locale: tr })
              : '—'

            return (
              <div
                key={trade.id}
                onClick={() => navigate('/journal')}
                className="flex items-center justify-between px-5 py-2.5 border-b border-gray-50 dark:border-white/5 last:border-0 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <PairBadge symbol={trade.symbol} />
                  <OutcomeBadge outcome={trade.outcome} />
                  <span className="text-xs text-gray-400 dark:text-[#9ca3af]">{relativeTime}</span>
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
      )}
    </div>
  )
}
