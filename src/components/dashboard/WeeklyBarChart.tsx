import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { PeriodPnl } from '@/lib/stats'
import { S } from '@/lib/constants/strings'

interface Props { weekly: PeriodPnl[]; monthly: PeriodPnl[] }

export function WeeklyBarChart({ weekly, monthly }: Props) {
  const [view, setView] = useState<'weekly' | 'monthly'>('weekly')
  const data = view === 'weekly' ? weekly : monthly

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-5 h-48 flex items-center justify-center">
        <p className="text-xs text-gray-400 dark:text-[#9ca3af]">{S.dashboard.noData}</p>
      </div>
    )
  }
  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500 dark:text-[#9ca3af]">{S.dashboard.weeklyMonthly}</p>
        <div className="flex gap-1 rounded-md border border-gray-200 dark:border-white/10 p-0.5">
          {(['weekly', 'monthly'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} className={`rounded px-2 py-1 text-xs transition-colors ${view === v ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-[#9ca3af]'}`}>
              {v === 'weekly' ? S.dashboard.weekly : S.dashboard.monthly}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={130}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} width={50} />
          <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} labelStyle={{ color: '#9ca3af', fontSize: 11 }} itemStyle={{ fontSize: 12 }} formatter={v => [`$${(v as number).toFixed(2)}`, 'K/Z']} />
          <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => <Cell key={i} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
