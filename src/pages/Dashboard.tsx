import { useEffect, useState } from 'react'
import { useTradesStore } from '@/stores/useTradesStore'
import { useDashboardStore } from '@/stores/useDashboardStore'
import { filterByDateRange, calcStats, calcCumulativePnl, calcDrawdown, calcWeeklyPnl, calcMonthlyPnl } from '@/lib/stats'
import { DateRangePicker } from '@/components/dashboard/DateRangePicker'
import { SummaryCards } from '@/components/dashboard/SummaryCards'
import { CumulativePnlChart } from '@/components/dashboard/CumulativePnlChart'
import { DrawdownChart } from '@/components/dashboard/DrawdownChart'
import { WeeklyBarChart } from '@/components/dashboard/WeeklyBarChart'
import { BestWorstCards } from '@/components/dashboard/BestWorstCards'
import { CalendarGrid } from '@/components/shared/CalendarGrid'
import { DayTradesModal } from '@/components/shared/DayTradesModal'
import type { TradeWithRelations } from '@/types'

export function Dashboard() {
  const { trades, loading, fetchTrades } = useTradesStore()
  const dateRange = useDashboardStore(s => s.dateRange)

  const [modalDate, setModalDate] = useState<Date | null>(null)
  const [modalTrades, setModalTrades] = useState<TradeWithRelations[]>([])

  useEffect(() => {
    fetchTrades()
  }, [fetchTrades])

  const filtered = filterByDateRange(trades, dateRange)
  const stats      = calcStats(filtered)
  const cumulative = calcCumulativePnl(filtered)
  const drawdown   = calcDrawdown(filtered)
  const weekly     = calcWeeklyPnl(filtered)
  const monthly    = calcMonthlyPnl(filtered)

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <DateRangePicker />
      </div>

      {/* Row 1 — Summary cards */}
      <SummaryCards stats={stats} />

      {/* Row 2 — Charts */}
      <div className="grid grid-cols-3 gap-4">
        <CumulativePnlChart data={cumulative} />
        <DrawdownChart data={drawdown} />
        <WeeklyBarChart weekly={weekly} monthly={monthly} />
      </div>

      {/* Row 3 — Calendar */}
      <CalendarGrid
        trades={filtered}
        onDayClick={(date, dayTrades) => {
          setModalDate(date)
          setModalTrades(dayTrades)
        }}
      />

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
