import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { CONFIRMATION_COLORS } from '@/lib/constants/confirmations'
import type { TradeWithRelations } from '@/types'

interface ConfirmationStat {
  key: string
  timeframe: string
  confirmationType: string
  count: number
  winRate: number
  avgR: number | null
  color: string
}

interface Props {
  trades: TradeWithRelations[]
}

type SortKey = 'count' | 'winRate' | 'avgR'

export function ConfirmationEffectiveness({ trades }: Props) {
  const [sortBy, setSortBy] = useState<SortKey>('count')
  const [sortAsc, setSortAsc] = useState(false)

  const map: Record<string, { win: number; total: number; rSum: number; rCount: number }> = {}

  for (const trade of trades) {
    if (!trade.trade_confirmations) continue
    for (const conf of trade.trade_confirmations) {
      const key = `${conf.timeframe}__${conf.confirmation_type}`
      if (!map[key]) map[key] = { win: 0, total: 0, rSum: 0, rCount: 0 }
      if (trade.outcome === 'win' || trade.outcome === 'loss') {
        map[key].total++
        if (trade.outcome === 'win') map[key].win++
      }
      if (trade.r_multiple !== null) {
        map[key].rSum   += trade.r_multiple
        map[key].rCount += 1
      }
    }
  }

  const rows: ConfirmationStat[] = Object.entries(map).map(([key, v]) => {
    const [timeframe, confirmationType] = key.split('__')
    return {
      key,
      timeframe,
      confirmationType,
      count:   v.total,
      winRate: v.total === 0 ? 0 : (v.win / v.total) * 100,
      avgR:    v.rCount === 0 ? null : v.rSum / v.rCount,
      color:   CONFIRMATION_COLORS[confirmationType as keyof typeof CONFIRMATION_COLORS] ?? '#9ca3af',
    }
  })

  const sorted = [...rows].sort((a, b) => {
    let av: number, bv: number
    if (sortBy === 'count')   { av = a.count;   bv = b.count }
    else if (sortBy === 'winRate') { av = a.winRate; bv = b.winRate }
    else { av = a.avgR ?? -999; bv = b.avgR ?? -999 }
    return sortAsc ? av - bv : bv - av
  })

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSetAsc(p => !p)
    else { setSortBy(key); setSortAsc(false) }
  }

  function setSetAsc(fn: (p: boolean) => boolean) { setSortAsc(fn) }

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortBy !== col) return null
    return sortAsc ? <ChevronUp className="h-3 w-3 inline ml-0.5" /> : <ChevronDown className="h-3 w-3 inline ml-0.5" />
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-5">
        <p className="text-xs font-medium text-[#9ca3af] uppercase tracking-wide mb-3">Konfirmasyon Etkinliği</p>
        <p className="text-xs text-[#9ca3af]">Wizard ile konfirmasyon eklenmiş trade yok.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-5 space-y-3">
      <p className="text-xs font-medium text-[#9ca3af] uppercase tracking-wide">Konfirmasyon Etkinliği</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left pb-2 text-xs text-[#9ca3af]">Konfirmasyon</th>
              <th
                className="text-right pb-2 text-xs text-[#9ca3af] cursor-pointer hover:text-white px-3"
                onClick={() => handleSort('count')}
              >
                Trade <SortIcon col="count" />
              </th>
              <th
                className="text-right pb-2 text-xs text-[#9ca3af] cursor-pointer hover:text-white px-3"
                onClick={() => handleSort('winRate')}
              >
                Win Rate <SortIcon col="winRate" />
              </th>
              <th
                className="text-right pb-2 text-xs text-[#9ca3af] cursor-pointer hover:text-white pl-3"
                onClick={() => handleSort('avgR')}
              >
                Avg R <SortIcon col="avgR" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(row => (
              <tr key={row.key} className="border-b border-white/5 last:border-0">
                <td className="py-2">
                  <span
                    className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: `${row.color}22`, color: row.color }}
                  >
                    {row.timeframe} {row.confirmationType}
                  </span>
                </td>
                <td className="py-2 text-right text-white px-3">{row.count}</td>
                <td className="py-2 text-right px-3 font-medium" style={{
                  color: row.winRate >= 55 ? '#10b981' : row.winRate >= 45 ? '#9ca3af' : '#ef4444'
                }}>
                  {row.winRate.toFixed(0)}%
                </td>
                <td className="py-2 text-right pl-3 font-mono text-white">
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
