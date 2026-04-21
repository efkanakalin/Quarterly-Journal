import type { TradeWithRelations } from '@/types'
import { SESSION_COLORS, SESSION_LABELS } from '@/lib/constants/colors'
import type { Session } from '@/types'

const SESSIONS: Session[] = ['asia', 'london', 'ny_am', 'ny_pm']

interface Props {
  trades: TradeWithRelations[]
}

export function SessionBreakdown({ trades }: Props) {
  const stats = SESSIONS.map(session => {
    const sessionTrades = trades.filter(t => t.session === session && t.pnl_usd !== null)
    const wins   = sessionTrades.filter(t => t.outcome === 'win')
    const losses = sessionTrades.filter(t => t.outcome === 'loss')
    const rated  = wins.length + losses.length
    const winRate = rated === 0 ? null : (wins.length / rated) * 100

    const rTrades = sessionTrades.filter(t => t.r_multiple !== null)
    const avgR = rTrades.length === 0
      ? null
      : rTrades.reduce((s, t) => s + (t.r_multiple ?? 0), 0) / rTrades.length

    return { session, count: sessionTrades.length, winRate, avgR }
  })

  return (
    <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-5 space-y-4">
      <p className="text-xs font-medium text-[#9ca3af] uppercase tracking-wide">Session Performansı</p>
      <div className="grid grid-cols-4 gap-3">
        {stats.map(s => {
          const color = SESSION_COLORS[s.session]
          return (
            <div
              key={s.session}
              className="rounded-lg border border-white/10 p-3 space-y-2"
              style={{ borderColor: `${color}33` }}
            >
              <p className="text-xs font-semibold" style={{ color }}>
                {SESSION_LABELS[s.session]}
              </p>
              <div className="space-y-1">
                <p className="text-lg font-bold text-white">{s.count}</p>
                <p className="text-xs text-[#9ca3af]">trade</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-[#9ca3af]">
                  WR:{' '}
                  <span className="text-white font-medium">
                    {s.winRate !== null ? `${s.winRate.toFixed(0)}%` : '—'}
                  </span>
                </p>
                <p className="text-xs text-[#9ca3af]">
                  Avg R:{' '}
                  <span className="text-white font-medium">
                    {s.avgR !== null ? s.avgR.toFixed(2) : '—'}
                  </span>
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
