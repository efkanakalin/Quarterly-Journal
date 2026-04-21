import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { MISTAKE_TYPES } from '@/lib/constants/mistakes'
import { S } from '@/lib/constants/strings'
import type { TradeWithRelations } from '@/types'

interface Props { trades: TradeWithRelations[] }

const SHORT: Record<string, string> = {
  'Bias/Narrative Tersi İşlem': 'Bias Tersi',
  'Dar Stop Mesafesi':          'Dar Stop',
  'Yetersiz Konfirme':          'Yts. Konfirme',
  'FOMO':                       'FOMO',
  'İntikam İşlemi':             'İntikam',
}

export function MistakeFrequency({ trades }: Props) {
  const counts: Record<string, number> = {}
  for (const t of trades)
    for (const m of t.trade_mistakes ?? [])
      counts[m.mistake_type] = (counts[m.mistake_type] ?? 0) + 1

  const data = MISTAKE_TYPES
    .map(m => ({ label: m, shortLabel: SHORT[m] ?? m, count: counts[m] ?? 0 }))
    .filter(d => d.count > 0)

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-5">
        <p className="text-xs font-medium text-gray-500 dark:text-[#9ca3af] mb-3">{S.dashboard.mistakeFrequency}</p>
        <p className="text-xs text-gray-400 dark:text-[#9ca3af]">Kayıtlı hata yok.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-5 space-y-3">
      <p className="text-xs font-medium text-gray-500 dark:text-[#9ca3af]">{S.dashboard.mistakeFrequency}</p>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" horizontal={false} />
          <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="shortLabel" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} width={90} />
          <Tooltip
            contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
            labelFormatter={(_, p) => p?.[0]?.payload?.label ?? ''}
            formatter={v => [v, 'Adet']}
            labelStyle={{ color: '#9ca3af', fontSize: 11 }}
            itemStyle={{ color: '#ef4444', fontSize: 12 }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => <Cell key={i} fill="#ef4444" fillOpacity={0.65 + i * 0.07} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
