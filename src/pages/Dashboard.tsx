import { useEffect, useState } from 'react'
import { useTradesStore } from '@/stores/useTradesStore'
import { useDashboardStore } from '@/stores/useDashboardStore'
import {
  filterByDateRange, calcStats, calcCumulativePnl,
  calcDrawdown, calcWeeklyPnl, calcMonthlyPnl,
} from '@/lib/stats'
import { DateRangePicker } from '@/components/dashboard/DateRangePicker'
import { SummaryCards } from '@/components/dashboard/SummaryCards'
import { CumulativePnlChart } from '@/components/dashboard/CumulativePnlChart'
import { DrawdownChart } from '@/components/dashboard/DrawdownChart'
import { WeeklyBarChart } from '@/components/dashboard/WeeklyBarChart'
import { BestWorstCards } from '@/components/dashboard/BestWorstCards'
import { SessionBreakdown } from '@/components/dashboard/SessionBreakdown'
import { SessionHeatmap } from '@/components/dashboard/SessionHeatmap'
import { ConfirmationEffectiveness } from '@/components/dashboard/ConfirmationEffectiveness'
import { MistakeFrequency } from '@/components/dashboard/MistakeFrequency'
import { QTScore } from '@/components/dashboard/QTScore'
import { RecentPositions } from '@/components/dashboard/RecentPositions'
import { CalendarGrid } from '@/components/shared/CalendarGrid'
import { DayTradesModal } from '@/components/shared/DayTradesModal'
import { S } from '@/lib/constants/strings'
import type { TradeWithRelations } from '@/types'

export function Dashboard() {
  const { trades, loading, fetchTrades } = useTradesStore()
  const dateRange = useDashboardStore(s => s.dateRange)
  const [modalDate, setModalDate] = useState<Date | null>(null)
  const [modalTrades, setModalTrades] = useState<TradeWithRelations[]>([])

  useEffect(() => { fetchTrades() }, [fetchTrades])

  const filtered   = filterByDateRange(trades, dateRange)
  const stats      = calcStats(filtered)
  const cumulative = calcCumulativePnl(filtered)
  const drawdown   = calcDrawdown(filtered)
  const weekly     = calcWeeklyPnl(filtered)
  const monthly    = calcMonthlyPnl(filtered)

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />
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

      {/* Row 1 — 5 Özet kart */}
      <SummaryCards stats={stats} />

      {/* Row 2 — QT Score + Grafikler | Takvim (referans layout) */}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-4">
          <QTScore trades={filtered} />
          <CumulativePnlChart data={cumulative} />
          <DrawdownChart data={drawdown} />
          <WeeklyBarChart weekly={weekly} monthly={monthly} />
        </div>
        <div className="col-span-2">
          <CalendarGrid
            trades={filtered}
            onDayClick={(date, dayTrades) => { setModalDate(date); setModalTrades(dayTrades) }}
          />
        </div>
      </div>

      {/* Row 3 — Recent Positions + Session Breakdown */}
      <div className="grid grid-cols-3 gap-4">
        <RecentPositions trades={filtered} />
        <div className="col-span-2">
          <SessionBreakdown trades={filtered} />
        </div>
      </div>

      {/* Row 4 — Session Heatmap + Mistake Frequency */}
      <div className="grid grid-cols-2 gap-4">
        <SessionHeatmap trades={filtered} />
        <MistakeFrequency trades={filtered} />
      </div>

      {/* Row 5 — Confirmation Effectiveness */}
      <ConfirmationEffectiveness trades={filtered} />

      {/* Row 6 — Best / Total / Worst */}
      <BestWorstCards trades={filtered} />

      <DayTradesModal
        date={modalDate}
        trades={modalTrades}
        onClose={() => setModalDate(null)}
      />
    </div>
  )
}
