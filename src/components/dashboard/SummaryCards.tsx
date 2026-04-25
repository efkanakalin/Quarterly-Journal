import { Info } from 'lucide-react'
import type { TradeStats } from '@/lib/stats'
import { useS } from '@/lib/i18n'

interface CardProps {
  label: string
  value: string
  sub?: string
  valueColor?: string
  info?: string
}

function StatCard({ label, value, sub, valueColor, info }: CardProps) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] px-4 py-3 sm:px-5 sm:py-4 space-y-1">
      <div className="flex items-center gap-1">
        <p className="text-xs text-gray-500 dark:text-[#9ca3af] font-medium">{label}</p>
        {info && (
          <div className="group relative">
            <Info className="h-3 w-3 text-gray-400 dark:text-[#9ca3af]/60 cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-lg bg-gray-900 dark:bg-[#0a0a0a] border border-gray-700 dark:border-white/10 px-3 py-2 text-xs text-white shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              {info}
            </div>
          </div>
        )}
      </div>
      <p className="text-xl sm:text-2xl font-bold truncate" style={{ color: valueColor ?? '#111111' }} data-dark-color={valueColor ?? '#ffffff'}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400 dark:text-[#9ca3af]">{sub}</p>}
    </div>
  )
}

interface Props { stats: TradeStats }

export function SummaryCards({
  stats }: Props) {
  const S = useS()
  const pnlColor = stats.totalPnl > 0 ? '#10b981' : stats.totalPnl < 0 ? '#ef4444' : '#6b7280'
  const pfColor  = stats.profitFactor >= 1.5 ? '#10b981' : stats.profitFactor >= 1 ? '#f59e0b' : '#ef4444'

  const pfDisplay = stats.profitFactor === Infinity ? '∞'
    : stats.profitFactor === 0 ? '—'
    : stats.profitFactor.toFixed(2)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      <StatCard
        label={S.dashboard.pnl}
        value={`${stats.totalPnl >= 0 ? '+' : ''}$${stats.totalPnl.toFixed(2)}`}
        sub={`${stats.tradeCount} ${S.stats.trades}`}
        valueColor={pnlColor}
        info={S.metricInfo.pnl}
      />
      <StatCard
        label={S.dashboard.profitFactor}
        value={pfDisplay}
        sub={S.stats.grossPL}
        valueColor={pfColor}
        info={S.metricInfo.profitFactor}
      />
      <StatCard
        label={S.dashboard.winRate}
        value={`${stats.winRate.toFixed(1)}%`}
        sub={`${stats.winCount}W · ${stats.lossCount}L`}
        valueColor={stats.winRate >= 50 ? '#10b981' : '#ef4444'}
        info={S.metricInfo.winRate}
      />
      <StatCard
        label={S.dashboard.dayWinPct}
        value={`${stats.dayWinRate.toFixed(1)}%`}
        sub={S.stats.positiveDays}
        valueColor={stats.dayWinRate >= 50 ? '#10b981' : '#ef4444'}
        info={S.metricInfo.dayWinPct}
      />
      <StatCard
        label={S.dashboard.avgWinLoss}
        value={`$${stats.avgWin.toFixed(0)}`}
        sub={S.stats.vsLoss(stats.avgLoss)}
        valueColor="#10b981"
        info={S.metricInfo.avgWinLoss}
      />
    </div>
  )
}
