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

  // Build day cells padded to full weeks (Mon start)
  const monthStart = startOfMonth(month)
  const monthEnd   = endOfMonth(month)
  const gridStart  = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd    = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days       = eachDayOfInterval({ start: gridStart, end: gridEnd })

  // Weekly summaries
  const weeks: Date[][] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

  const weeklyPnl = weeks.map(week =>
    week
      .filter(d => isSameMonth(d, month))
      .reduce((sum, d) => sum + (dailyMap[format(d, 'yyyy-MM-dd')]?.pnl ?? 0), 0)
  )

  const handleDayClick = (day: Date) => {
    if (!onDayClick || !isSameMonth(day, month)) return
    const key = format(day, 'yyyy-MM-dd')
    const dayTrades = dailyMap[key]?.trades ?? []
    if (dayTrades.length > 0) onDayClick(day, dayTrades)
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#1a1a1a] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <button
          onClick={() => setMonth(m => subMonths(m, 1))}
          className="rounded p-1 text-[#9ca3af] hover:text-white transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-white">
          {format(month, 'MMMM yyyy')}
        </span>
        <button
          onClick={() => setMonth(m => addMonths(m, 1))}
          className="rounded p-1 text-[#9ca3af] hover:text-white transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekday labels + "Hafta" header */}
      <div className="grid grid-cols-[repeat(7,1fr)_80px] border-b border-white/10">
        {WEEKDAYS.map(d => (
          <div key={d} className="px-2 py-2 text-center text-xs text-[#9ca3af]">{d}</div>
        ))}
        <div className="px-2 py-2 text-center text-xs text-[#9ca3af]">Hafta</div>
      </div>

      {/* Weeks */}
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-[repeat(7,1fr)_80px] border-b border-white/5 last:border-0">
          {week.map(day => {
            const key    = format(day, 'yyyy-MM-dd')
            const data   = dailyMap[key]
            const inMonth = isSameMonth(day, month)
            const today  = isToday(day)
            const pnl    = data?.pnl ?? null

            let bgColor = ''
            if (inMonth && pnl !== null) {
              if (pnl > 0)       bgColor = 'rgba(16,185,129,0.1)'
              else if (pnl < 0)  bgColor = 'rgba(239,68,68,0.1)'
              else               bgColor = 'rgba(156,163,175,0.1)'
            }

            return (
              <div
                key={key}
                onClick={() => handleDayClick(day)}
                className={`min-h-[72px] p-2 border-r border-white/5 last:border-0 transition-colors ${
                  inMonth && data ? 'cursor-pointer hover:brightness-125' : ''
                } ${today ? 'ring-inset ring-1 ring-blue-500/50' : ''}`}
                style={{ background: bgColor }}
              >
                <span
                  className={`text-xs font-medium ${
                    inMonth
                      ? today ? 'text-blue-400' : 'text-white'
                      : 'text-white/20'
                  }`}
                >
                  {format(day, 'd')}
                </span>
                {inMonth && pnl !== null && (
                  <div className="mt-1 space-y-0.5">
                    <p
                      className="text-xs font-mono font-medium leading-tight"
                      style={{ color: pnl > 0 ? '#10b981' : pnl < 0 ? '#ef4444' : '#9ca3af' }}
                    >
                      {pnl >= 0 ? '+' : ''}${pnl.toFixed(0)}
                    </p>
                    <p className="text-[10px] text-[#9ca3af]">{data!.count} trade</p>
                  </div>
                )}
              </div>
            )
          })}

          {/* Weekly summary */}
          <div className="min-h-[72px] p-2 flex flex-col justify-center items-center">
            {weeklyPnl[wi] !== 0 && (
              <span
                className="text-xs font-mono font-medium"
                style={{ color: weeklyPnl[wi] > 0 ? '#10b981' : '#ef4444' }}
              >
                {weeklyPnl[wi] >= 0 ? '+' : ''}${weeklyPnl[wi].toFixed(0)}
              </span>
            )}
          </div>
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
