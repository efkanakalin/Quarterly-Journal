import { SESSION_LABELS } from '@/lib/constants/colors'
import { useS } from '@/lib/i18n'
import type { TradeWithRelations, Session, SessionQuarter } from '@/types'

const SESSIONS: Session[] = ['asia', 'london', 'ny_am', 'ny_pm']
const QUARTERS: SessionQuarter[] = ['Q1', 'Q2', 'Q3', 'Q4']

interface Props { trades: TradeWithRelations[] }

function wrColor(wr: number | null): string {
  if (wr === null) return 'transparent'
  if (wr >= 70) return 'rgba(16,185,129,0.55)'
  if (wr >= 55) return 'rgba(16,185,129,0.30)'
  if (wr >= 45) return 'rgba(156,163,175,0.18)'
  if (wr >= 30) return 'rgba(239,68,68,0.22)'
  return 'rgba(239,68,68,0.45)'
}

export function SessionHeatmap({
  trades }: Props) {
  const S = useS()
  const map: Record<string, Record<string, { win: number; total: number }>> = {}
  for (const s of SESSIONS) {
    map[s] = {}
    for (const q of QUARTERS) map[s][q] = { win: 0, total: 0 }
  }
  for (const t of trades) {
    if (!t.session || !t.session_quarter || t.outcome === null || t.outcome === 'breakeven') continue
    const cell = map[t.session]?.[t.session_quarter]
    if (!cell) continue
    cell.total++
    if (t.outcome === 'win') cell.win++
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-5 space-y-4">
      <p className="text-xs font-medium text-gray-500 dark:text-[#9ca3af]">{S.dashboard.sessionHeatmap}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left text-gray-400 dark:text-[#9ca3af] pb-2 w-20">Seans</th>
              {QUARTERS.map(q => <th key={q} className="text-center text-gray-400 dark:text-[#9ca3af] pb-2 px-2">{q}</th>)}
            </tr>
          </thead>
          <tbody>
            {SESSIONS.map(session => (
              <tr key={session}>
                <td className="py-1 text-gray-500 dark:text-[#9ca3af] text-xs">{SESSION_LABELS[session]}</td>
                {QUARTERS.map(q => {
                  const cell = map[session][q]
                  const wr = cell.total === 0 ? null : (cell.win / cell.total) * 100
                  return (
                    <td key={q} className="px-2 py-1 text-center">
                      <div className="rounded-md px-2 py-2 min-w-[48px] inline-block" style={{ background: wrColor(wr) }}>
                        {wr !== null
                          ? <span className="text-gray-900 dark:text-white font-medium">{wr.toFixed(0)}%</span>
                          : <span className="text-gray-300 dark:text-white/20">—</span>}
                        {cell.total > 0 && <p className="text-[9px] text-gray-400 dark:text-white/40 mt-0.5">{cell.total}</p>}
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
