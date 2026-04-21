import { useEffect, useState } from 'react'
import { useTradesStore } from '@/stores/useTradesStore'
import { useDashboardStore } from '@/stores/useDashboardStore'
import { filterByDateRange, calcStats, calcDrawdown } from '@/lib/stats'
import { DateRangePicker } from '@/components/dashboard/DateRangePicker'
import { SummaryCards } from '@/components/dashboard/SummaryCards'
import { PnlChart } from '@/components/dashboard/PnlChart'
import { DrawdownChart } from '@/components/dashboard/DrawdownChart'
import { BestWorstCards } from '@/components/dashboard/BestWorstCards'
import { SessionBreakdown } from '@/components/dashboard/SessionBreakdown'
import { QTScore } from '@/components/dashboard/QTScore'
import { RecentPositions } from '@/components/dashboard/RecentPositions'
import { DayTradesModal } from '@/components/shared/DayTradesModal'
import { useS } from '@/lib/i18n'
import type { TradeWithRelations } from '@/types'

export function Dashboard() {
  const { trades, loading, fetchTrades } = useTradesStore()
  const dateRange = useDashboardStore(s => s.dateRange)
  const [modalDate, setModalDate] = useState<Date | null>(null)
  const [modalTrades] = useState<TradeWithRelations[]>([])
  const S = useS()

  useEffect(() => { fetchTrades() }, [fetchTrades])

  const filtered  = filterByDateRange(trades, dateRange)
  const stats     = calcStats(filtered)
  const drawdown  = calcDrawdown(filtered)

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-gray-200 dark:bg-white/5 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{S.dashboard.title}</h1>
        <DateRangePicker />
      </div>

      {/* Row 1 — 5 özet kart */}
      <SummaryCards stats={stats} />

      {/* Row 2 — QT Score + Grafikler (tam genişlik) */}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-4">
          <QTScore trades={filtered} />
        </div>
        <div className="col-span-2 flex flex-col gap-4">
          <PnlChart trades={filtered} />
          <DrawdownChart data={drawdown} />
        </div>
      </div>

      {/* Row 3 — Recent Trades + Session Performance */}
      <div className="grid grid-cols-3 gap-4">
        <RecentPositions trades={filtered} />
        <div className="col-span-2">
          <SessionBreakdown trades={filtered} />
        </div>
      </div>

      {/* Row 4 — Best / Total / Worst */}
      <BestWorstCards trades={filtered} />

      <DayTradesModal
        date={modalDate}
        trades={modalTrades}
        onClose={() => setModalDate(null)}
      />
    </div>
  )
}
