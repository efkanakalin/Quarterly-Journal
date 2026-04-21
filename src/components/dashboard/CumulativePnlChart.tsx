import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { CumulativePoint } from '@/lib/stats'
import { S } from '@/lib/constants/strings'

interface Props { data: CumulativePoint[] }

export function CumulativePnlChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-5 h-48 flex items-center justify-center">
        <p className="text-xs text-gray-400 dark:text-[#9ca3af]">{S.dashboard.noData}</p>
      </div>
    )
  }
  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-5 space-y-3">
      <p className="text-xs font-medium text-gray-500 dark:text-[#9ca3af]">{S.dashboard.cumulativePnl}</p>
      <ResponsiveContainer width="100%" height={130}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" className="dark:[stroke:rgba(255,255,255,0.05)]" />
          <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 10 }} tickFormatter={d => d.slice(5)} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} width={50} />
          <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} labelStyle={{ color: '#9ca3af', fontSize: 11 }} itemStyle={{ color: '#10b981', fontSize: 12 }} formatter={v => [`$${(v as number).toFixed(2)}`, 'Kümülatif']} />
          <Area type="monotone" dataKey="cumulative" stroke="#10b981" strokeWidth={2} fill="url(#greenGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
