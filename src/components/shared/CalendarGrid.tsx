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

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function CalendarGrid({ trades, onDayClick }: Props) {
  const [month, setMonth] = useState(new Date())
  const dailyMap = buildDailyMap(trades)

  const monthStart = startOfMonth(month)
  const monthEnd   = endOfMonth(month)
  const gridStart  = startOfWeek(monthStart, { weekStartsOn: 0 })
  const gridEnd    = endOfWeek(monthEnd,   { weekStartsOn: 0 })
  const days       = eachDayOfInterval({ start: gridStart, end: gridEnd })

  const weeks: Date[][] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

  // Aylık istatistik
  const monthlyPnl = Object.entries(dailyMap)
    .filter(([d]) => d.startsWith(format(month, 'yyyy-MM')))
    .reduce((s, [, v]) => s + v.pnl, 0)
  const tradingDays = Object.keys(dailyMap).filter(d => d.startsWith(format(month, 'yyyy-MM'))).length

  const handleDayClick = (day: Date) => {
    if (!onDayClick || !isSameMonth(day, month)) return
    const key = format(day, 'yyyy-MM-dd')
    const dt = dailyMap[key]?.trades ?? []
    if (dt.length > 0) onDayClick(day, dt)
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/10">
        <div className="flex items-center gap-2">
          <button onClick={() => setMonth(m => subMonths(m, 1))} className="rounded p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-bold text-gray-900 dark:text-white">{format(month, 'MMMM yyyy')}</span>
          <button onClick={() => setMonth(m => addMonths(m, 1))} className="rounded p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
          <button onClick={() => setMonth(new Date())} className="rounded-md px-2 py-0.5 text-xs border border-gray-200 dark:border-white/10 text-gray-500 dark:text-[#9ca3af] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ml-1">
            This month
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 dark:text-[#9ca3af]">Monthly stats:</span>
          <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md" style={{
            backgroundColor: monthlyPnl >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            color: monthlyPnl >= 0 ? '#10b981' : '#ef4444',
          }}>
            {monthlyPnl >= 0 ? '+' : ''}${Math.abs(monthlyPnl) >= 1000 ? `${(monthlyPnl / 1000).toFixed(1)}K` : monthlyPnl.toFixed(0)}
          </span>
          <span className="text-xs font-medium text-gray-500 dark:text-[#9ca3af]">{tradingDays} days</span>
        </div>
      </div>

      {/* Grid: 7 gün + 1 haftalık stats kolonu */}
      <div className="grid grid-cols-[repeat(7,1fr)_100px]">
        {/* Weekday headers */}
        {WEEKDAYS.map(d => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400 dark:text-[#9ca3af] border-b border-gray-100 dark:border-white/10">
            {d}
          </div>
        ))}
        <div className="py-2 text-center text-xs font-semibold text-gray-400 dark:text-[#9ca3af] border-b border-gray-100 dark:border-white/10 border-l border-l-gray-100 dark:border-l-white/10">
          Week
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => {
          // Haftalık stats
          const weekPnl = week
            .filter(d => isSameMonth(d, month))
            .reduce((s, d) => s + (dailyMap[format(d, 'yyyy-MM-dd')]?.pnl ?? 0), 0)
          const weekTradingDays = week
            .filter(d => isSameMonth(d, month) && dailyMap[format(d, 'yyyy-MM-dd')])
            .length

          return [
            // 7 gün hücreleri
            ...week.map(day => {
              const key     = format(day, 'yyyy-MM-dd')
              const data    = dailyMap[key]
              const inMonth = isSameMonth(day, month)
              const today   = isToday(day)
              const pnl     = inMonth ? (data?.pnl ?? null) : null

              // Renkler — referans görsele göre
              let bgStyle = ''
              if (!inMonth) {
                bgStyle = 'bg-gray-50 dark:bg-[#111]'
              } else if (pnl === null) {
                bgStyle = 'bg-white dark:bg-[#1e1e1e] border border-gray-150 dark:border-white/5'
              } else if (pnl > 0) {
                bgStyle = 'bg-emerald-600 dark:bg-emerald-700'
              } else if (pnl < 0) {
                bgStyle = 'bg-red-800 dark:bg-red-900'
              } else {
                bgStyle = 'bg-blue-800 dark:bg-blue-900'
              }

              return (
                <div
                  key={key}
                  onClick={() => handleDayClick(day)}
                  className={[
                    'relative min-h-[90px] border-b border-r border-gray-100 dark:border-white/5',
                    'transition-all',
                    inMonth && data ? 'cursor-pointer hover:opacity-90' : '',
                    today ? 'ring-2 ring-inset ring-blue-400' : '',
                    bgStyle,
                  ].join(' ')}
                >
                  {inMonth && (
                    <>
                      {/* Date — sağ üst */}
                      <span className={`absolute top-2 right-2 text-xs font-medium ${
                        today
                          ? 'text-blue-400'
                          : pnl !== null
                          ? 'text-white/80'
                          : 'text-gray-400 dark:text-[#9ca3af]'
                      }`}>
                        {format(day, 'd')}
                      </span>

                      {/* PNL + trade count — orta */}
                      {pnl !== null && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 pointer-events-none">
                          <span className="text-sm font-bold font-mono leading-none text-white">
                            {pnl < 0 ? '-' : ''}${Math.abs(pnl) >= 1000 ? `${(Math.abs(pnl) / 1000).toFixed(1)}K` : Math.abs(pnl).toFixed(0)}
                          </span>
                          <span className="text-[10px] text-white/70">
                            {data!.count} trade{data!.count !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            }),

            // Haftalık stats kolonu
            <div
              key={`week-${wi}`}
              className="min-h-[90px] border-b border-l border-gray-100 dark:border-white/5 flex flex-col items-center justify-center gap-1 px-1"
            >
              <span className="text-[10px] font-semibold text-gray-400 dark:text-[#9ca3af]">Week {wi + 1}</span>
              {weekPnl !== 0 || weekTradingDays > 0 ? (
                <>
                  <span
                    className="text-sm font-bold font-mono"
                    style={{ color: weekPnl > 0 ? '#10b981' : weekPnl < 0 ? '#ef4444' : '#9ca3af' }}
                  >
                    {weekPnl >= 0 ? '' : ''}{Math.abs(weekPnl) >= 1000 ? `$${(weekPnl / 1000).toFixed(1)}K` : `$${weekPnl.toFixed(0)}`}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-[#9ca3af]">{weekTradingDays} day{weekTradingDays !== 1 ? 's' : ''}</span>
                </>
              ) : (
                <span className="text-[10px] text-gray-300 dark:text-white/20">—</span>
              )}
            </div>,
          ]
        })}
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
