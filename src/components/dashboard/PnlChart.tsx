import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useS } from '@/lib/i18n'
import { calcDailyStats, calcWeeklyPnl } from '@/lib/stats'
import type { TradeWithRelations } from '@/types'

interface Props { trades: TradeWithRelations[] }

type View = 'daily' | 'weekly'

export function PnlChart({ trades }: Props) {
  const [view, setView] = useState<View>('daily')
  const S = useS()

  const daily  = calcDailyStats(trades).map(d => ({ label: d.date.slice(5), pnl: d.pnl }))
  const weekly = calcWeeklyPnl(trades)
  const data   = view === 'daily' ? daily : weekly

  const isEmpty = data.length === 0

  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500 dark:text-[#9ca3af]">
          {view === 'daily' ? S.dashboard.cumulativePnl : S.dashboard.weeklyMonthly}
        </p>
        <div className="flex gap-1 rounded-md border border-gray-200 dark:border-white/10 p-0.5">
          {(['daily', 'weekly'] as View[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                view === v
                  ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-[#9ca3af]'
              }`}
            >
              {v === 'daily' ? S.dashboard.daily : S.dashboard.weekly}
            </button>
          ))}
        </div>
      </div>

      {isEmpty ? (
        <div className="h-40 flex items-center justify-center">
          <p className="text-xs text-gray-400 dark:text-[#9ca3af]">{S.dashboard.noData}</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} width={50} />
            <Tooltip
              contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
              labelStyle={{ color: '#9ca3af', fontSize: 11 }}
              formatter={v => [`$${(v as number).toFixed(2)}`, 'PnL']}
            />
            <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
              {data.map((entry, i) => <Cell key={i} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
