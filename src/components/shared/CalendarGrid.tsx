import { useState } from 'react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, isSameMonth, isToday,
  addMonths, subMonths,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { TradeWithRelations } from '@/types'

interface Props {
  trades: TradeWithRelations[]
  onDayClick?: (date: Date, trades: TradeWithRelations[]) => void
}

const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

export function CalendarGrid({ trades, onDayClick }: Props) {
  const [month, setMonth] = useState(new Date())

  const dailyMap = buildDailyMap(trades)

  const monthStart = startOfMonth(month)
  const monthEnd   = endOfMonth(month)
  const gridStart  = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd    = endOfWeek(monthEnd,   { weekStartsOn: 1 })
  const days       = eachDayOfInterval({ start: gridStart, end: gridEnd })

  const weeks: Date[][] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

  const handleDayClick = (day: Date) => {
    if (!onDayClick || !isSameMonth(day, month)) return
    const key = format(day, 'yyyy-MM-dd')
    const dayTrades = dailyMap[key]?.trades ?? []
    if (dayTrades.length > 0) onDayClick(day, dayTrades)
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#1a1a1a] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
        <button
          onClick={() => setMonth(m => subMonths(m, 1))}
          className="rounded p-1.5 text-[#9ca3af] hover:text-white hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-white">
          {format(month, 'MMMM yyyy')}
        </span>
        <button
          onClick={() => setMonth(m => addMonths(m, 1))}
          className="rounded p-1.5 text-[#9ca3af] hover:text-white hover:bg-white/10 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-white/10">
        {WEEKDAYS.map(d => (
          <div key={d} className="py-2 text-center text-xs font-medium text-[#9ca3af]">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7">
          {week.map(day => {
            const key     = format(day, 'yyyy-MM-dd')
            const data    = dailyMap[key]
            const inMonth = isSameMonth(day, month)
            const today   = isToday(day)
            const pnl     = inMonth ? (data?.pnl ?? null) : null

            let bgColor = ''
            if (pnl !== null) {
              if (pnl > 0)      bgColor = 'rgba(16,185,129,0.12)'
              else if (pnl < 0) bgColor = 'rgba(239,68,68,0.12)'
              else              bgColor = 'rgba(156,163,175,0.08)'
            }

            const pnlColor = pnl === null
              ? ''
              : pnl > 0 ? '#10b981' : pnl < 0 ? '#ef4444' : '#9ca3af'

            return (
              <div
                key={key}
                onClick={() => handleDayClick(day)}
                className={[
                  'relative min-h-[88px] p-2 border-b border-r border-white/5',
                  'last:border-r-0 transition-colors',
                  inMonth && data ? 'cursor-pointer hover:brightness-110' : '',
                  today ? 'ring-inset ring-1 ring-blue-500/40' : '',
                ].join(' ')}
                style={{ background: bgColor }}
              >
                {/* Date number */}
                <span className={`text-xs font-medium ${
                  !inMonth
                    ? 'text-white/15'
                    : today
                    ? 'text-blue-400'
                    : 'text-[#9ca3af]'
                }`}>
                  {format(day, 'd')}
                </span>

                {/* PNL + trade count */}
                {pnl !== null && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 pointer-events-none">
                    <span
                      className="text-sm font-bold font-mono leading-none"
                      style={{ color: pnlColor }}
                    >
                      {pnl >= 0 ? '+' : ''}${Math.abs(pnl) >= 1000
                        ? `${(pnl / 1000).toFixed(1)}K`
                        : pnl.toFixed(0)}
                    </span>
                    <span className="text-[10px] text-[#9ca3af]">
                      {data!.count} trade
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function buildDailyMap(trades: TradeWithRelations[]) {
  const map: Record<string, { pnl: number; count: number; trades: TradeWithRelations[] }> = {}
  for (const t of trades) {
    if (!t.entry_time_et || t.pnl_usd === null) continue
    const key = format(new Date(t.entry_time_et), 'yyyy-MM-dd')
    if (!map[key]) map[key] = { pnl: 0, count: 0, trades: [] }
    map[key].pnl   += t.pnl_usd
    map[key].count += 1
    map[key].trades.push(t)
  }
  return map
}
