import { format } from 'date-fns'
import { useS } from '@/lib/i18n'
import type { TradeWithRelations } from '@/types'

interface Props { trades: TradeWithRelations[] }

export function BestWorstCards({
  trades }: Props) {
  const S = useS()
  const pnlTrades = trades.filter(t => t.pnl_usd !== null)
  if (pnlTrades.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-5 flex items-center justify-center">
        <p className="text-xs text-gray-400 dark:text-[#9ca3af]">{S.dashboard.noData}</p>
      </div>
    )
  }

  const best  = pnlTrades.reduce((a, b) => (b.pnl_usd! > a.pnl_usd! ? b : a))
  const worst = pnlTrades.reduce((a, b) => (b.pnl_usd! < a.pnl_usd! ? b : a))

  return (
    <div className="grid grid-cols-3 gap-4">
      <MiniCard label={S.dashboard.bestTrade}  trade={best}  color="#10b981" />
      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] px-5 py-4 flex flex-col items-center justify-center gap-1">
        <p className="text-xs text-gray-500 dark:text-[#9ca3af]">{S.dashboard.totalTrades}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white">{pnlTrades.length}</p>
      </div>
      <MiniCard label={S.dashboard.worstTrade} trade={worst} color="#ef4444" />
    </div>
  )
}

function MiniCard({ label, trade, color }: { label: string; trade: TradeWithRelations; color: string }) {
  const date = trade.entry_time_et ? format(new Date(trade.entry_time_et), 'MMM d, yyyy') : '—'
  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] px-5 py-4 space-y-1">
      <p className="text-xs text-gray-500 dark:text-[#9ca3af]">{label}</p>
      <p className="text-xl font-bold" style={{ color }}>
        {trade.pnl_usd! >= 0 ? '+' : ''}${trade.pnl_usd!.toFixed(2)}
      </p>
      <p className="text-xs text-gray-400 dark:text-[#9ca3af]">{trade.symbol} · {date}</p>
    </div>
  )
}
