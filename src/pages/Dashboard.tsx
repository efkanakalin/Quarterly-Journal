import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTradesStore } from '@/stores/useTradesStore'
import { useDashboardStore } from '@/stores/useDashboardStore'
import { filterByDateRange, calcStats, calcDrawdown, calcCumulativePnl } from '@/lib/stats'
import { DateRangePicker } from '@/components/dashboard/DateRangePicker'
import { CsvUpload } from '@/components/journal/CsvUpload'
import { SummaryCards } from '@/components/dashboard/SummaryCards'
import { CumulativePnlChart } from '@/components/dashboard/CumulativePnlChart'
import { PnlChart } from '@/components/dashboard/PnlChart'
import { DrawdownChart } from '@/components/dashboard/DrawdownChart'
import { BestWorstCards } from '@/components/dashboard/BestWorstCards'
import { SessionBreakdown } from '@/components/dashboard/SessionBreakdown'
import { SessionHeatmap } from '@/components/dashboard/SessionHeatmap'
import { ConfirmationEffectiveness } from '@/components/dashboard/ConfirmationEffectiveness'
import { MistakeFrequency } from '@/components/dashboard/MistakeFrequency'
import { QTScore } from '@/components/dashboard/QTScore'
import { RecentPositions } from '@/components/dashboard/RecentPositions'
import { CalendarGrid } from '@/components/shared/CalendarGrid'
import { DayTradesModal } from '@/components/shared/DayTradesModal'
import { useS } from '@/lib/i18n'
import type { TradeWithRelations } from '@/types'

function greetingKey(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
  if (hour >= 5  && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 22) return 'evening'
  return 'night'
}

export function Dashboard() {
  const { trades, loading, fetchTrades } = useTradesStore()
  const dateRange = useDashboardStore(s => s.dateRange)
  const user = useAuthStore(s => s.user)
  const [modalDate, setModalDate] = useState<Date | null>(null)
  const [modalTrades, setModalTrades] = useState<TradeWithRelations[]>([])
  const [username, setUsername] = useState<string | null>(null)
  const S = useS()

  useEffect(() => { fetchTrades() }, [fetchTrades])

  useEffect(() => {
    if (!user) return
    supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.username) setUsername(data.username)
      })
  }, [user])

  const greeting = S.greeting[greetingKey(new Date().getHours())]

  const filtered   = filterByDateRange(trades, dateRange)
  const stats      = calcStats(filtered)
  const drawdown   = calcDrawdown(filtered)
  const cumulative = calcCumulativePnl(filtered)

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
      <div className="flex items-start sm:items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{S.dashboard.title}</h1>
          <p className="mt-1 text-xs sm:text-sm italic font-light text-gray-500 dark:text-[#9ca3af]">
            {greeting}{username ? `, ${username}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <CsvUpload compact />
          <DateRangePicker />
        </div>
      </div>

      {/* Row 1 — 5 özet kart */}
      <SummaryCards stats={stats} />

      {/* Row 2 — QT Score | Cumulative PnL | Daily Bar PnL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <QTScore trades={filtered} />
        <CumulativePnlChart data={cumulative} />
        <PnlChart trades={filtered} />
      </div>

      {/* Row 3 — Recent Trades | Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <RecentPositions trades={filtered} />
        <div className="lg:col-span-2">
          <CalendarGrid
            trades={filtered}
            onDayClick={(date, dayTrades) => { setModalDate(date); setModalTrades(dayTrades) }}
          />
        </div>
      </div>

      {/* Row 4 — Drawdown + Session Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DrawdownChart data={drawdown} />
        <SessionBreakdown trades={filtered} />
      </div>

      {/* Row 5 — Session Heatmap + Mistake Frequency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SessionHeatmap trades={filtered} />
        <MistakeFrequency trades={filtered} />
      </div>

      {/* Row 6 — Confirmation Effectiveness */}
      <ConfirmationEffectiveness trades={filtered} />

      {/* Row 7 — Best / Total / Worst */}
      <BestWorstCards trades={filtered} />

      <DayTradesModal
        date={modalDate}
        trades={modalTrades}
        onClose={() => setModalDate(null)}
      />
    </div>
  )
}
