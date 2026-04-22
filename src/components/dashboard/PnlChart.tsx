import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useS } from '@/lib/i18n'
import { useThemeStore } from '@/stores/useThemeStore'
import { calcDailyStats, calcWeeklyPnl } from '@/lib/stats'
import type { TradeWithRelations } from '@/types'

interface Props { trades: TradeWithRelations[] }

type View = 'daily' | 'weekly'

const fmt = (v: number) => `$${v >= 0 ? '' : '-'}${Math.abs(v).toLocaleString('en-US', { maximumFractionDigits: 0 })}`

export function PnlChart({ trades }: Props) {
  const [view, setView] = useState<View>('daily')
  const S = useS()
  const isDark = useThemeStore(s => s.theme === 'dark')

  const tooltipBg     = isDark ? '#1a1a1a' : '#ffffff'
  const tooltipBorder = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'
  const tooltipText   = isDark ? '#ffffff' : '#111827'
  const tooltipLabel  = isDark ? '#9ca3af' : '#6b7280'

  const daily  = calcDailyStats(trades).map(d => ({ label: d.date.slice(5), pnl: d.pnl }))
  const weekly = calcWeeklyPnl(trades)
  const data   = view === 'daily' ? daily : weekly

  const isEmpty = data.length === 0
  const totalPnl = data.reduce((s, d) => s + d.pnl, 0)

  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-5 flex flex-col aspect-square">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-gray-700 dark:text-white">
          {view === 'daily' ? S.dashboard.netDailyPnl : S.dashboard.netWeeklyPnl}
        </p>
        <div className="flex items-center gap-2">
          {!isEmpty && (
            <span
              className="text-sm font-bold font-mono"
              style={{ color: totalPnl >= 0 ? '#10b981' : '#ef4444' }}
            >
              {fmt(totalPnl)}
            </span>
          )}
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
      </div>

      {isEmpty ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-400 dark:text-[#9ca3af]">{S.dashboard.noData}</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, bottom: 8, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" className="dark:stroke-white/5" />
              <XAxis
                dataKey="label"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                minTickGap={20}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={fmt}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  background: tooltipBg,
                  border: `1px solid ${tooltipBorder}`,
                  borderRadius: 8,
                  fontSize: 13,
                  color: tooltipText,
                  boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.08)',
                }}
                labelStyle={{ color: tooltipLabel, fontSize: 12, fontWeight: 500 }}
                itemStyle={{ fontSize: 13, fontWeight: 600 }}
                formatter={v => [fmt(v as number), 'PnL']}
                cursor={{ fill: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
              />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {data.map((entry, i) => <Cell key={i} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
