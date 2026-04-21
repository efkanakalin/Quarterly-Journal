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

// Sunday first — matches reference screenshot
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function CalendarGrid({ trades, onDayClick }: Props) {
  const [month, setMonth] = useState(new Date())
  const dailyMap = buildDailyMap(trades)

  const monthStart = startOfMonth(month)
  const monthEnd   = endOfMonth(month)
  const gridStart  = startOfWeek(monthStart, { weekStartsOn: 0 }) // 0 = Sunday
  const gridEnd    = endOfWeek(monthEnd,   { weekStartsOn: 0 })
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
    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-white/10">
        <button
          onClick={() => setMonth(m => subMonths(m, 1))}
          className="rounded-md p-1.5 text-gray-400 dark:text-[#9ca3af] hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {format(month, 'MMMM yyyy')}
        </span>
        <button
          onClick={() => setMonth(m => addMonths(m, 1))}
          className="rounded-md p-1.5 text-gray-400 dark:text-[#9ca3af] hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 px-3 pt-2 pb-1">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 dark:text-[#9ca3af] py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid with gap */}
      <div className="px-3 pb-3 space-y-1.5">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1.5">
            {week.map(day => {
              const key     = format(day, 'yyyy-MM-dd')
              const data    = dailyMap[key]
              const inMonth = isSameMonth(day, month)
              const today   = isToday(day)
              const pnl     = inMonth ? (data?.pnl ?? null) : null

              let bgClass = ''
              if (pnl !== null) {
                if (pnl > 0)      bgClass = 'bg-emerald-50 dark:bg-emerald-900/25 border-emerald-100 dark:border-emerald-800/30'
                else if (pnl < 0) bgClass = 'bg-red-50 dark:bg-red-900/25 border-red-100 dark:border-red-800/30'
                else              bgClass = 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5'
              } else {
                bgClass = 'bg-transparent border-transparent'
              }

              const pnlColor = pnl === null ? '' : pnl > 0 ? '#10b981' : pnl < 0 ? '#ef4444' : '#9ca3af'

              return (
                <div
                  key={key}
                  onClick={() => handleDayClick(day)}
                  className={[
                    'relative rounded-xl border transition-all min-h-[80px] p-2',
                    bgClass,
                    inMonth && data ? 'cursor-pointer hover:brightness-95 dark:hover:brightness-110' : '',
                    today ? 'ring-2 ring-blue-400 ring-offset-1' : '',
                    !inMonth ? 'opacity-0 pointer-events-none' : '',
                  ].join(' ')}
                >
                  {/* Date number — top left */}
                  <span className={`text-xs font-medium ${
                    today ? 'text-blue-500' : 'text-gray-400 dark:text-[#9ca3af]'
                  }`}>
                    {inMonth ? format(day, 'd') : ''}
                  </span>

                  {/* PNL + count — centered */}
                  {pnl !== null && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 pointer-events-none">
                      <span
                        className="text-sm font-bold font-mono leading-none"
                        style={{ color: pnlColor }}
                      >
                        {pnl >= 0 ? '+' : ''}
                        {Math.abs(pnl) >= 1000
                          ? `$${(pnl / 1000).toFixed(1)}K`
                          : `$${pnl.toFixed(0)}`}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-[#9ca3af]">
                        {data!.count} trade{data!.count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
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
