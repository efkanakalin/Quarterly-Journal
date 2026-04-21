import type { TradeStats } from '@/lib/stats'

interface CardProps {
  label: string
  value: string
  sub?: string
  valueColor?: string
}

function StatCard({ label, value, sub, valueColor }: CardProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#1a1a1a] px-5 py-4 space-y-1">
      <p className="text-xs text-[#9ca3af] font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold" style={{ color: valueColor ?? '#ffffff' }}>{value}</p>
      {sub && <p className="text-xs text-[#9ca3af]">{sub}</p>}
    </div>
  )
}

interface Props {
  stats: TradeStats
}

export function SummaryCards({ stats }: Props) {
  const pnlColor = stats.totalPnl > 0 ? '#10b981' : stats.totalPnl < 0 ? '#ef4444' : '#9ca3af'
  const pfColor  = stats.profitFactor >= 1.5 ? '#10b981' : stats.profitFactor >= 1 ? '#f59e0b' : '#ef4444'

  const pfDisplay = stats.profitFactor === Infinity
    ? '∞'
    : stats.profitFactor === 0
    ? '—'
    : stats.profitFactor.toFixed(2)

  return (
    <div className="grid grid-cols-5 gap-4">
      <StatCard
        label="PNL"
        value={`${stats.totalPnl >= 0 ? '+' : ''}$${stats.totalPnl.toFixed(2)}`}
        sub={`${stats.tradeCount} trade`}
        valueColor={pnlColor}
      />
      <StatCard
        label="Profit Factor"
        value={pfDisplay}
        sub="Gross profit / loss"
        valueColor={pfColor}
      />
      <StatCard
        label="Win Rate"
        value={`${stats.winRate.toFixed(1)}%`}
        sub={`${stats.winCount}W · ${stats.lossCount}L`}
        valueColor={stats.winRate >= 50 ? '#10b981' : '#ef4444'}
      />
      <StatCard
        label="Day Win %"
        value={`${stats.dayWinRate.toFixed(1)}%`}
        sub="pozitif gün oranı"
        valueColor={stats.dayWinRate >= 50 ? '#10b981' : '#ef4444'}
      />
      <StatCard
        label="Avg Win / Loss"
        value={`$${stats.avgWin.toFixed(0)}`}
        sub={`vs $${stats.avgLoss.toFixed(0)} kayıp`}
        valueColor="#10b981"
      />
    </div>
  )
}
