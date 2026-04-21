import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import { calculateQTScore } from '@/lib/metrics/qtScore'
import { S } from '@/lib/constants/strings'
import type { TradeWithRelations } from '@/types'

interface Props { trades: TradeWithRelations[] }

function scoreColor(score: number): string {
  if (score >= 67) return '#10b981'
  if (score >= 34) return '#f59e0b'
  return '#ef4444'
}

const AXES = [
  { key: 'confirmationDensity', label: 'Konfirmasyon' },
  { key: 'sessionDiscipline',   label: 'Seans' },
  { key: 'executionCleanliness', label: 'Disiplin' },
  { key: 'rEfficiency',         label: 'R Verimi' },
]

export function QTScore({ trades }: Props) {
  const score = calculateQTScore(trades)
  const color = scoreColor(score.total)

  const radarData = AXES.map(a => ({
    axis: a.label,
    value: score[a.key as keyof typeof score],
  }))

  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-5 space-y-4">
      <p className="text-xs font-medium text-gray-500 dark:text-[#9ca3af]">{S.dashboard.qtScore}</p>

      <div className="flex items-center gap-6">
        {/* Radar */}
        <div className="flex-1">
          <ResponsiveContainer width="100%" height={160}>
            <RadarChart data={radarData} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
              <PolarGrid stroke="rgba(156,163,175,0.3)" />
              <PolarAngleAxis dataKey="axis" tick={{ fill: '#9ca3af', fontSize: 10 }} />
              <Radar
                dataKey="value"
                stroke={color}
                fill={color}
                fillOpacity={0.25}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Score + bar */}
        <div className="flex flex-col items-center gap-3 w-28">
          <div className="text-center">
            <span className="text-4xl font-bold" style={{ color }}>{score.total}</span>
            <span className="text-sm text-gray-400 dark:text-[#9ca3af]"> / 100</span>
          </div>

          {/* Gradient bar */}
          <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${score.total}%`, backgroundColor: color }}
            />
          </div>

          {/* Axis scores */}
          <div className="w-full space-y-1">
            {AXES.map(a => (
              <div key={a.key} className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400 dark:text-[#9ca3af]">{a.label}</span>
                <span className="text-[10px] font-medium text-gray-700 dark:text-white">
                  {score[a.key as keyof typeof score]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
