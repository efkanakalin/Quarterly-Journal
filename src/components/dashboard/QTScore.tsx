import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts'
import { calculateQTScore } from '@/lib/metrics/qtScore'
import { useS } from '@/lib/i18n'
import { useThemeStore } from '@/stores/useThemeStore'
import type { TradeWithRelations } from '@/types'

interface Props { trades: TradeWithRelations[] }

function scoreColor(score: number): string {
  if (score >= 60) return '#10b981'
  if (score >= 35) return '#f59e0b'
  return '#ef4444'
}

export function QTScore({ trades }: Props) {
  const S = useS()
  const theme = useThemeStore(s => s.theme)
  const isDark = theme === 'dark'
  const result = calculateQTScore(trades)
  const color  = scoreColor(result.total)

  // Tema uyumlu renkler
  const gridStroke    = isDark ? 'rgba(99,130,255,0.2)'  : 'rgba(59,89,200,0.18)'
  const axisLabelColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(55,65,81,0.7)'
  const axisValueColor = isDark ? 'rgba(255,255,255,0.95)' : 'rgba(17,24,39,0.95)'
  const radarStroke   = isDark ? '#7aa3ff' : '#3b5fe8'
  const radarFill     = isDark ? '#3b5fe8' : '#7aa3ff'
  const dotFill       = isDark ? '#a8c2ff' : '#3b5fe8'
  const dotStroke     = isDark ? '#dce8ff' : '#1e40af'
  const tooltipBg     = isDark ? '#1a1a1a' : '#ffffff'
  const tooltipBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
  const tooltipColor  = isDark ? '#fff' : '#111'

  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-5 flex flex-col gap-4 aspect-square">
      {/* Başlık + tarih */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-[#9ca3af]">
          {S.dashboard.qtScore}
        </p>
        {result.tradeDate && (
          <span className="text-[10px] text-gray-400 dark:text-[#6b7280] font-mono">{result.tradeDate}</span>
        )}
      </div>

      {/* Büyük skor */}
      <div className="flex items-end gap-2">
        <span className="text-5xl font-black tabular-nums leading-none" style={{ color }}>
          {result.total}
        </span>
        <p className="mb-1 text-[10px] text-gray-400 dark:text-[#9ca3af]">
          {result.total === 0 && trades.length === 0
            ? S.dashboard.noData
            : result.total >= 60 ? '✓ Good'
            : result.total >= 35 ? '⚠ Improve'
            : '✗ Review'}
        </p>
      </div>

      {/* Radar — kalan alanı doldursun */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={result.radar} margin={{ top: 14, right: 24, bottom: 14, left: 24 }}>
            <PolarGrid stroke={gridStroke} gridType="polygon" />
            <PolarAngleAxis
              dataKey="axis"
              tick={({ x, y, payload }) => {
                const val = result.radar.find(r => r.axis === payload.value)?.value ?? 0
                return (
                  <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={9}>
                    <tspan x={x} dy="-4" fill={axisLabelColor}>{payload.value}</tspan>
                    <tspan x={x} dy="12" fill={axisValueColor} fontWeight="bold">({val})</tspan>
                  </text>
                )
              }}
            />
            <Radar
              dataKey="value"
              stroke={radarStroke}
              strokeWidth={2}
              fill={radarFill}
              fillOpacity={0.35}
              dot={{ r: 3.5, fill: dotFill, stroke: dotStroke, strokeWidth: 1.2 }}
            />
            <Tooltip
              contentStyle={{
                background: tooltipBg,
                border: `1px solid ${tooltipBorder}`,
                borderRadius: 8,
                fontSize: 12,
                color: tooltipColor,
              }}
              formatter={(v) => [`${v}`, '']}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
