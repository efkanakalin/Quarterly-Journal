import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { CONFIRMATION_PALETTE, BADGE_CLASS } from '@/lib/constants/palette'
import { useS } from '@/lib/i18n'
import type { TradeWithRelations } from '@/types'

type SortKey = 'count' | 'winRate' | 'avgR'

interface Props { trades: TradeWithRelations[] }

export function ConfirmationEffectiveness({
  trades }: Props) {
  const S = useS()
  const [sortBy, setSortBy] = useState<SortKey>('count')
  const [sortAsc, setSortAsc] = useState(false)

  // Aynı trade aynı confirmation_type'ı (farklı timeframe'lerde olsa bile) bir kez sayılsın.
  const map: Record<string, { win: number; total: number; rSum: number; rCount: number }> = {}
  for (const trade of trades) {
    const seen = new Set<string>()
    for (const conf of trade.trade_confirmations ?? []) {
      const key = conf.confirmation_type
      if (seen.has(key)) continue
      seen.add(key)
      if (!map[key]) map[key] = { win: 0, total: 0, rSum: 0, rCount: 0 }
      if (trade.outcome === 'win' || trade.outcome === 'loss') {
        map[key].total++
        if (trade.outcome === 'win') map[key].win++
      }
      if (trade.r_multiple !== null) { map[key].rSum += trade.r_multiple; map[key].rCount++ }
    }
  }

  const rows = Object.entries(map).map(([key, v]) => {
    return {
      key, confirmationType: key,
      count:   v.total,
      winRate: v.total === 0 ? 0 : (v.win / v.total) * 100,
      avgR:    v.rCount === 0 ? null : v.rSum / v.rCount,
      badgeClass: BADGE_CLASS[CONFIRMATION_PALETTE[key] ?? 'slate'],
    }
  })

  const sorted = [...rows].sort((a, b) => {
    const av = sortBy === 'count' ? a.count : sortBy === 'winRate' ? a.winRate : (a.avgR ?? -999)
    const bv = sortBy === 'count' ? b.count : sortBy === 'winRate' ? b.winRate : (b.avgR ?? -999)
    return sortAsc ? av - bv : bv - av
  })

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortAsc(p => !p)
    else { setSortBy(key); setSortAsc(false) }
  }

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortBy !== col) return null
    return sortAsc ? <ChevronUp className="h-3 w-3 inline ml-0.5" /> : <ChevronDown className="h-3 w-3 inline ml-0.5" />
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-5">
        <p className="text-xs font-medium text-gray-500 dark:text-[#9ca3af] mb-3">{S.dashboard.confirmationEffect}</p>
        <p className="text-xs text-gray-400 dark:text-[#9ca3af]">{S.stats.noConfluences}</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-5 space-y-3">
      <p className="text-xs font-medium text-gray-500 dark:text-[#9ca3af]">{S.dashboard.confirmationEffect}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-white/10">
              <th className="text-left pb-2 text-xs text-gray-500 dark:text-[#9ca3af]">{S.dashboard.confluenceHeader}</th>
              {(['count', 'winRate', 'avgR'] as SortKey[]).map(col => (
                <th key={col} className="text-right pb-2 text-xs text-gray-500 dark:text-[#9ca3af] cursor-pointer hover:text-gray-700 dark:hover:text-white px-3" onClick={() => handleSort(col)}>
                  {col === 'count' ? S.dashboard.countHeader : col === 'winRate' ? S.dashboard.winRateHeader : S.dashboard.avgRHeader}
                  <SortIcon col={col} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(row => (
              <tr key={row.key} className="border-b border-gray-50 dark:border-white/5 last:border-0">
                <td className="py-2">
                  <span className={`inline-flex items-center rounded-sm px-2 py-1 text-xs font-medium ${row.badgeClass}`}>
                    {row.confirmationType}
                  </span>
                </td>
                <td className="py-2 text-right text-gray-900 dark:text-white px-3">{row.count}</td>
                <td className="py-2 text-right px-3 font-medium" style={{ color: row.winRate >= 55 ? '#10b981' : row.winRate >= 45 ? '#6b7280' : '#ef4444' }}>
                  {row.winRate.toFixed(0)}%
                </td>
                <td className="py-2 text-right pl-3 font-mono text-gray-900 dark:text-white">
                  {row.avgR !== null ? row.avgR.toFixed(2) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
