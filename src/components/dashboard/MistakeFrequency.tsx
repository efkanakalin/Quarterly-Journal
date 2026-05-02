import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { MISTAKE_TYPES } from '@/lib/constants/mistakes'
import { useS } from '@/lib/i18n'
import { useThemeStore } from '@/stores/useThemeStore'
import type { TradeWithRelations } from '@/types'

interface Props { trades: TradeWithRelations[] }

const SHORT: Record<string, string> = {
  'Bias/Narrative Tersi İşlem': 'Bias Tersi',
  'Dar Stop Mesafesi':          'Dar Stop',
  'Yetersiz Konfirme':          'Yts. Konfirme',
  'FOMO':                       'FOMO',
  'İntikam İşlemi':             'İntikam',
}

export function MistakeFrequency({
  trades }: Props) {
  const S = useS()
  const isDark = useThemeStore(s => s.theme === 'dark')
  const tooltipBg     = isDark ? '#1a1a1a' : '#ffffff'
  const tooltipBorder = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'
  const tooltipText   = isDark ? '#ffffff' : '#111827'
  const tooltipLabel  = isDark ? '#9ca3af' : '#6b7280'

  const counts: Record<string, number> = {}
  for (const t of trades)
    for (const m of t.trade_mistakes ?? [])
      counts[m.mistake_type] = (counts[m.mistake_type] ?? 0) + 1

  const data = MISTAKE_TYPES
    .map(m => ({ label: m, shortLabel: SHORT[m] ?? m, count: counts[m] ?? 0 }))
    .filter(d => d.count > 0)

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-5 flex flex-col h-full">
        <p className="text-xs font-medium text-gray-500 dark:text-[#9ca3af] mb-3">{S.dashboard.mistakeFrequency}</p>
        <p className="text-xs text-gray-400 dark:text-[#9ca3af]">Kayıtlı hata yok.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-5 flex flex-col h-full">
      <p className="text-xs font-medium text-gray-500 dark:text-[#9ca3af] mb-3">{S.dashboard.mistakeFrequency}</p>
      <div className="flex-1 min-h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 0 }} barCategoryGap="15%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="shortLabel" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} width={90} />
            <Tooltip
              contentStyle={{
                background: tooltipBg,
                border: `1px solid ${tooltipBorder}`,
                borderRadius: 8,
                fontSize: 13,
                color: tooltipText,
                boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.08)',
              }}
              labelFormatter={(_, p) => p?.[0]?.payload?.label ?? ''}
              formatter={v => [v, S.stats.count]}
              labelStyle={{ color: tooltipLabel, fontSize: 12, fontWeight: 500 }}
              itemStyle={{ color: '#ef4444', fontSize: 13, fontWeight: 600 }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {data.map((_, i) => <Cell key={i} fill="#ef4444" fillOpacity={0.65 + i * 0.07} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
