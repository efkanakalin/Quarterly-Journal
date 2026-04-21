import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { MISTAKE_TYPES } from '@/lib/constants/mistakes'
import type { TradeWithRelations } from '@/types'

interface Props {
  trades: TradeWithRelations[]
}

export function MistakeFrequency({ trades }: Props) {
  const countMap: Record<string, number> = {}
  for (const t of trades) {
    for (const m of t.trade_mistakes ?? []) {
      countMap[m.mistake_type] = (countMap[m.mistake_type] ?? 0) + 1
    }
  }

  const data = MISTAKE_TYPES.map((m, i) => ({
    label: m,
    shortLabel: mistakeShort(m),
    count: countMap[m] ?? 0,
    index: i,
  })).filter(d => d.count > 0)

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-5">
        <p className="text-xs font-medium text-[#9ca3af] uppercase tracking-wide mb-3">Hata Frekansı</p>
        <p className="text-xs text-[#9ca3af]">Kayıtlı hata yok.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-5 space-y-3">
      <p className="text-xs font-medium text-[#9ca3af] uppercase tracking-wide">Hata Frekansı</p>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
          <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="shortLabel"
            tick={{ fill: '#9ca3af', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={90}
          />
          <Tooltip
            contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ''}
            formatter={(v) => [v, 'Adet']}
            labelStyle={{ color: '#9ca3af', fontSize: 11 }}
            itemStyle={{ color: '#ef4444', fontSize: 12 }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill="#ef4444" fillOpacity={0.7 + i * 0.05} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function mistakeShort(m: string): string {
  const shorts: Record<string, string> = {
    'Bias/Narrative Tersi İşlem': 'Bias Tersi',
    'Dar Stop Mesafesi':           'Dar Stop',
    'Yetersiz Konfirme':           'Yts. Konfirme',
    'FOMO':                        'FOMO',
    'İntikam İşlemi':              'İntikam',
  }
  return shorts[m] ?? m
}
