import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts'
import { calculateQTScore } from '@/lib/metrics/qtScore'
import { useS } from '@/lib/i18n'
import type { TradeWithRelations } from '@/types'

interface Props { trades: TradeWithRelations[] }

function scoreColor(score: number): string {
  if (score >= 60) return '#10b981'
  if (score >= 35) return '#f59e0b'
  return '#ef4444'
}

export function QTScore({ trades }: Props) {
  const S = useS()
  const result = calculateQTScore(trades)
  const color  = scoreColor(result.total)

  return (
    <div className="rounded-xl border border-white/10 bg-[#0f1629] p-5 space-y-4">
      {/* Başlık + tarih */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">
          {S.dashboard.qtScore}
        </p>
        {result.tradeDate && (
          <span className="text-[10px] text-white/30 font-mono">{result.tradeDate}</span>
        )}
      </div>

      {/* Büyük skor — "/ 100" YOK */}
      <div className="flex items-end gap-2">
        <span className="text-5xl font-black tabular-nums leading-none" style={{ color }}>
          {result.total}
        </span>
        <p className="mb-1 text-[10px] text-white/40">
          {result.total === 0 && trades.length === 0
            ? (S.dashboard.noData)
            : result.total >= 60 ? '✓ Good'
            : result.total >= 35 ? '⚠ Improve'
            : '✗ Review'}
        </p>
      </div>

      {/* Radar chart — referans görsel */}
      {result.radar.length > 0 && (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={result.radar} margin={{ top: 16, right: 24, bottom: 16, left: 24 }}>
              <PolarGrid
                stroke="rgba(99,130,255,0.2)"
                gridType="polygon"
              />
              <PolarAngleAxis
                dataKey="axis"
                tick={({ x, y, payload }) => {
                  const val = result.radar.find(r => r.axis === payload.value)?.value ?? 0
                  return (
                    <text
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="rgba(255,255,255,0.6)"
                      fontSize={10}
                    >
                      <tspan x={x} dy="-6">{payload.value}</tspan>
                      <tspan x={x} dy="14" fill="rgba(255,255,255,0.9)" fontWeight="bold">
                        ({val}.0)
                      </tspan>
                    </text>
                  )
                }}
              />
              <Radar
                dataKey="value"
                stroke="#4f7cf7"
                strokeWidth={2}
                fill="#3b5fe8"
                fillOpacity={0.45}
                dot={{ r: 4, fill: '#7aa3ff', stroke: '#c0d4ff', strokeWidth: 1.5 }}
              />
              <Tooltip
                contentStyle={{
                  background: '#0f1629',
                  border: '1px solid rgba(99,130,255,0.3)',
                  borderRadius: 8,
                  fontSize: 12,
                  color: '#fff',
                }}
                formatter={(v) => [`${v}`, '']}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
