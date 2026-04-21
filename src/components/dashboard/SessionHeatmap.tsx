import type { TradeWithRelations, Session, SessionQuarter } from '@/types'
import { SESSION_LABELS } from '@/lib/constants/colors'

const SESSIONS: Session[] = ['asia', 'london', 'ny_am', 'ny_pm']
const QUARTERS: SessionQuarter[] = ['Q1', 'Q2', 'Q3', 'Q4']

interface Props {
  trades: TradeWithRelations[]
}

function winRateColor(winRate: number | null): string {
  if (winRate === null) return 'transparent'
  if (winRate >= 70) return 'rgba(16,185,129,0.6)'
  if (winRate >= 55) return 'rgba(16,185,129,0.35)'
  if (winRate >= 45) return 'rgba(156,163,175,0.2)'
  if (winRate >= 30) return 'rgba(239,68,68,0.25)'
  return 'rgba(239,68,68,0.5)'
}

export function SessionHeatmap({ trades }: Props) {
  // Build 4×4 map: session → quarter → stats
  const map: Record<string, Record<string, { win: number; total: number }>> = {}
  for (const session of SESSIONS) {
    map[session] = {}
    for (const q of QUARTERS) map[session][q] = { win: 0, total: 0 }
  }

  for (const t of trades) {
    if (!t.session || !t.session_quarter || t.outcome === null) continue
    if (t.outcome === 'breakeven') continue
    const cell = map[t.session]?.[t.session_quarter]
    if (!cell) continue
    cell.total++
    if (t.outcome === 'win') cell.win++
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-5 space-y-4">
      <p className="text-xs font-medium text-[#9ca3af] uppercase tracking-wide">Session × Quarter Heatmap</p>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left text-[#9ca3af] pb-2 w-20">Session</th>
              {QUARTERS.map(q => (
                <th key={q} className="text-center text-[#9ca3af] pb-2 px-2">{q}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SESSIONS.map(session => (
              <tr key={session}>
                <td className="py-1 text-[#9ca3af] text-xs">{SESSION_LABELS[session]}</td>
                {QUARTERS.map(q => {
                  const cell = map[session][q]
                  const wr = cell.total === 0 ? null : (cell.win / cell.total) * 100
                  return (
                    <td key={q} className="px-2 py-1 text-center">
                      <div
                        className="rounded-md px-2 py-2 min-w-[48px] inline-block"
                        style={{ background: winRateColor(wr) }}
                      >
                        {wr !== null ? (
                          <span className="text-white font-medium">{wr.toFixed(0)}%</span>
                        ) : (
                          <span className="text-white/20">—</span>
                        )}
                        {cell.total > 0 && (
                          <p className="text-[9px] text-white/40 mt-0.5">{cell.total}</p>
                        )}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
