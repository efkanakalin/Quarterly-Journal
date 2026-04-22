import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { CumulativePoint } from '@/lib/stats'
import { useS } from '@/lib/i18n'
import { useThemeStore } from '@/stores/useThemeStore'

interface Props { data: CumulativePoint[] }

const fmt = (v: number) => `$${v >= 0 ? '' : '-'}${Math.abs(v).toLocaleString('en-US', { maximumFractionDigits: 0 })}`

export function CumulativePnlChart({ data }: Props) {
  const S = useS()
  const isDark = useThemeStore(s => s.theme === 'dark')

  const tooltipBg     = isDark ? '#1a1a1a' : '#ffffff'
  const tooltipBorder = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'
  const tooltipText   = isDark ? '#ffffff' : '#111827'
  const tooltipLabel  = isDark ? '#9ca3af' : '#6b7280'

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-5 flex items-center justify-center aspect-square">
        <p className="text-sm text-gray-400 dark:text-[#9ca3af]">{S.dashboard.noData}</p>
      </div>
    )
  }

  const lastValue = data[data.length - 1].cumulative

  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-5 flex flex-col aspect-square">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-gray-700 dark:text-white">{S.dashboard.cumulativePnl}</p>
        <span
          className="text-sm font-bold font-mono"
          style={{ color: lastValue >= 0 ? '#10b981' : '#ef4444' }}
        >
          {fmt(lastValue)}
        </span>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 8, left: 4 }}>
            <defs>
              <linearGradient id="pnlAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" className="dark:stroke-white/5" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickFormatter={d => d.slice(5)}
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
              itemStyle={{ color: '#10b981', fontSize: 13, fontWeight: 600 }}
              formatter={v => [fmt(v as number), S.dashboard.cumulativePnl]}
            />
            <Area type="monotone" dataKey="cumulative" stroke="#10b981" strokeWidth={2.5} fill="url(#pnlAreaGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
