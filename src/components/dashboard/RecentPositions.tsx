import { useNavigate } from 'react-router-dom'
import { PairBadge } from '@/components/journal/PairBadge'
import { useS } from '@/lib/i18n'
import { useLangStore } from '@/stores/useLangStore'
import type { TradeWithRelations } from '@/types'

// Kompakt relative time: "7d ago", "8h ago", "3m ago"
function compactAgo(date: Date, lang: 'en' | 'tr'): string {
  const now = Date.now()
  const diffSec = Math.max(1, Math.floor((now - date.getTime()) / 1000))
  const suffix = lang === 'tr' ? 'önce' : 'ago'
  if (diffSec < 60)   return `${diffSec}s ${suffix}`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60)   return `${diffMin}m ${suffix}`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24)    return `${diffHr}h ${suffix}`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 30)   return `${diffDay}d ${suffix}`
  const diffMo = Math.floor(diffDay / 30)
  if (diffMo < 12)    return `${diffMo}mo ${suffix}`
  const diffYr = Math.floor(diffMo / 12)
  return `${diffYr}y ${suffix}`
}

interface Props { trades: TradeWithRelations[] }

export function RecentPositions({
  trades }: Props) {
  const S = useS()
  const lang = useLangStore(s => s.lang)
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
          <p className="text-sm text-gray-400 dark:text-[#9ca3af]">{S.stats.noTrades}</p>
          <p className="text-xs text-gray-300 dark:text-[#6b7280] mt-1">{S.stats.addFirst}</p>
        </div>
      ) : (
        <div>
          {recent.map(trade => {
            const entryTime = trade.entry_time_et ? new Date(trade.entry_time_et) : null
            const relativeTime = entryTime ? compactAgo(entryTime, lang) : '—'

            return (
              <div
                key={trade.id}
                onClick={() => navigate('/journal')}
                className="flex items-center justify-between px-5 py-2.5 border-b border-gray-50 dark:border-white/5 last:border-0 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <PairBadge symbol={trade.symbol} />
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
