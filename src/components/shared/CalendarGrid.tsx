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
const WEEKDAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export function CalendarGrid({ trades, onDayClick }: Props) {
  const [month, setMonth] = useState(new Date())
  const dailyMap = buildDailyMap(trades)

  const monthStart = startOfMonth(month)
  const monthEnd   = endOfMonth(month)
  const gridStart  = startOfWeek(monthStart, { weekStartsOn: 0 })
  const gridEnd    = endOfWeek(monthEnd,     { weekStartsOn: 0 })
  const days       = eachDayOfInterval({ start: gridStart, end: gridEnd })

  const weeks: Date[][] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

  // Aylık stats
  const monthlyPnl = Object.entries(dailyMap)
    .filter(([d]) => d.startsWith(format(month, 'yyyy-MM')))
    .reduce((s, [, v]) => s + v.pnl, 0)
  const tradingDays = Object.keys(dailyMap)
    .filter(d => d.startsWith(format(month, 'yyyy-MM'))).length

  const handleDayClick = (day: Date) => {
    if (!onDayClick || !isSameMonth(day, month)) return
    const dt = dailyMap[format(day, 'yyyy-MM-dd')]?.trades ?? []
    if (dt.length > 0) onDayClick(day, dt)
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 px-3 sm:px-4 py-3 border-b border-gray-100 dark:border-white/10">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={() => setMonth(m => subMonths(m, 1))} className="rounded p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">{format(month, 'MMMM yyyy')}</span>
          <button onClick={() => setMonth(m => addMonths(m, 1))} className="rounded p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setMonth(new Date())}
            className="ml-1 rounded-md px-2 py-0.5 text-xs border border-gray-200 dark:border-white/10 text-gray-500 dark:text-[#9ca3af] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors hidden sm:inline-flex"
          >
            This month
          </button>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-xs text-gray-500 dark:text-[#9ca3af] hidden sm:inline">Monthly stats:</span>
          <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md" style={{
            backgroundColor: monthlyPnl >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            color: monthlyPnl >= 0 ? '#10b981' : '#ef4444',
          }}>
            {monthlyPnl < 0 ? '-' : ''}${Math.abs(monthlyPnl) >= 1000 ? `${(Math.abs(monthlyPnl) / 1000).toFixed(1)}K` : Math.abs(monthlyPnl).toFixed(0)}
          </span>
          <span className="text-xs font-medium text-gray-500 dark:text-[#9ca3af]">{tradingDays}d</span>
        </div>
      </div>

      {/* Weekday başlıkları */}
      <div className="grid grid-cols-[repeat(7,1fr)] sm:grid-cols-[repeat(7,1fr)_88px] px-2 sm:px-3 pt-3 pb-1 gap-1 sm:gap-1.5">
        {WEEKDAYS.map((d, i) => (
          <div key={d} className="text-center text-xs font-semibold text-gray-400 dark:text-[#9ca3af] py-1">
            <span className="sm:hidden">{WEEKDAYS_SHORT[i]}</span>
            <span className="hidden sm:inline">{d}</span>
          </div>
        ))}
        <div className="text-center text-xs font-semibold text-gray-400 dark:text-[#9ca3af] py-1 hidden sm:block">
          Week
        </div>
      </div>

      {/* Haftalar — her hücre kendi yuvarlak kutusu */}
      <div className="px-2 sm:px-3 pb-3 space-y-1 sm:space-y-1.5">
        {weeks.map((week, wi) => {
          const weekPnl = week
            .filter(d => isSameMonth(d, month))
            .reduce((s, d) => s + (dailyMap[format(d, 'yyyy-MM-dd')]?.pnl ?? 0), 0)
          const weekTradingDays = week
            .filter(d => isSameMonth(d, month) && !!dailyMap[format(d, 'yyyy-MM-dd')])
            .length

          return (
            <div key={wi} className="grid grid-cols-[repeat(7,1fr)] sm:grid-cols-[repeat(7,1fr)_88px] gap-1 sm:gap-1.5">
              {week.map(day => {
                const key     = format(day, 'yyyy-MM-dd')
                const data    = dailyMap[key]
                const inMonth = isSameMonth(day, month)
                const today   = isToday(day)
                const pnl     = inMonth ? (data?.pnl ?? null) : null

                // Hücre arka plan rengi
                let cellStyle: React.CSSProperties = {}
                let cellClass = 'rounded-lg sm:rounded-xl border transition-all min-h-[56px] sm:min-h-[90px] relative '

                if (!inMonth) {
                  cellClass += 'bg-gray-50 dark:bg-white/3 border-gray-100 dark:border-white/5 opacity-40'
                } else if (pnl === null) {
                  // Boş gün — gri kenarlıklı kutu
                  cellClass += 'bg-white dark:bg-[#222] border-gray-200 dark:border-white/10'
                } else if (pnl > 0) {
                  // Site geneliyle uyumlu emerald (#10b981)
                  cellClass += 'border-transparent'
                  cellStyle = { backgroundColor: '#10b981' }
                } else if (pnl < 0) {
                  // Site geneliyle uyumlu red (#ef4444)
                  cellClass += 'border-transparent'
                  cellStyle = { backgroundColor: '#ef4444' }
                } else {
                  cellClass += 'border-transparent'
                  cellStyle = { backgroundColor: '#3b82f6' }
                }

                if (today) cellClass += ' ring-2 ring-blue-400 ring-offset-1 ring-offset-white dark:ring-offset-[#1a1a1a]'
                if (inMonth && data) cellClass += ' cursor-pointer hover:opacity-85'

                return (
                  <div
                    key={key}
                    onClick={() => handleDayClick(day)}
                    className={cellClass}
                    style={cellStyle}
                  >
                    {inMonth && (
                      <>
                        {/* Tarih — sağ üst */}
                        <span className={`absolute top-1 right-1.5 sm:top-2 sm:right-2.5 text-[10px] sm:text-xs font-medium ${
                          today ? 'text-blue-400' : pnl !== null ? 'text-white/80' : 'text-gray-400 dark:text-[#9ca3af]'
                        }`}>
                          {format(day, 'd')}
                        </span>

                        {/* PNL + trade sayısı — orta */}
                        {pnl !== null && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 pointer-events-none px-1">
                            <span className="text-[11px] sm:text-sm font-bold font-mono leading-none text-white truncate max-w-full">
                              {pnl < 0 ? '-' : ''}${Math.abs(pnl) >= 1000
                                ? `${(Math.abs(pnl) / 1000).toFixed(1)}K`
                                : Math.abs(pnl).toFixed(0)}
                            </span>
                            <span className="text-[9px] sm:text-[10px] text-white/70 hidden sm:inline">
                              {data!.count} trade{data!.count !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}

              {/* Haftalık stats kutusu — sadece desktop */}
              <div className="hidden sm:flex rounded-xl border border-gray-100 dark:border-white/8 bg-gray-50 dark:bg-white/3 min-h-[90px] flex-col items-center justify-center gap-1 px-1">
                <span className="text-[10px] font-semibold text-gray-400 dark:text-[#9ca3af]">Week {wi + 1}</span>
                {weekTradingDays > 0 ? (
                  <>
                    <span
                      className="text-sm font-bold font-mono"
                      style={{ color: weekPnl > 0 ? '#10b981' : weekPnl < 0 ? '#ef4444' : '#9ca3af' }}
                    >
                      {weekPnl < 0 ? '-' : ''}${Math.abs(weekPnl) >= 1000
                        ? `${(Math.abs(weekPnl) / 1000).toFixed(1)}K`
                        : Math.abs(weekPnl).toFixed(0)}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-[#9ca3af]">
                      {weekTradingDays} day{weekTradingDays !== 1 ? 's' : ''}
                    </span>
                  </>
                ) : (
                  <span className="text-[10px] text-gray-300 dark:text-white/20">—</span>
                )}
              </div>
            </div>
          )
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
