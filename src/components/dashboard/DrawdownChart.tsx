import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useS } from '@/lib/i18n'
import type { DrawdownPoint } from '@/lib/stats'

interface Props { data: DrawdownPoint[] }

export function DrawdownChart({ data }: Props) {
  const S = useS()

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-5 h-48 flex items-center justify-center">
        <p className="text-xs text-gray-400 dark:text-[#9ca3af]">{S.dashboard.noData}</p>
      </div>
    )
  }

  const maxDrawdown = Math.min(...data.map(d => d.drawdown))

  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500 dark:text-[#9ca3af]">{S.dashboard.drawdown}</p>
        <span className="text-xs text-red-500 font-mono">Max: ${maxDrawdown.toFixed(2)}</span>
      </div>
      <ResponsiveContainer width="100%" height={150}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 10 }} tickFormatter={d => d.slice(5)} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} width={50} />
          <ReferenceLine y={maxDrawdown} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.5} />
          <Tooltip
            contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
            labelStyle={{ color: '#9ca3af', fontSize: 11 }}
            itemStyle={{ color: '#ef4444', fontSize: 12 }}
            formatter={v => [`$${(v as number).toFixed(2)}`, S.dashboard.drawdown]}
          />
          <Area type="monotone" dataKey="drawdown" stroke="#ef4444" strokeWidth={2} fill="url(#ddGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
