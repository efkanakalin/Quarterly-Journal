import { calculateQTScore } from '@/lib/metrics/qtScore'
import { useS } from '@/lib/i18n'
import type { TradeWithRelations } from '@/types'

interface Props { trades: TradeWithRelations[] }

interface CriterionRow {
  label: string
  value: number
  max: number
  description: string
}

function scoreColor(score: number): string {
  if (score >= 60) return '#10b981'
  if (score >= 35) return '#f59e0b'
  return '#ef4444'
}

function signColor(v: number): string {
  if (v > 0) return '#10b981'
  if (v < 0) return '#ef4444'
  return '#9ca3af'
}

export function QTScore({ trades }: Props) {
  const S = useS()
  const result = calculateQTScore(trades)
  const color  = scoreColor(result.total)
  const b      = result.breakdown

  const pct = Math.min(100, (result.total / 80) * 100) // 80 = practical max for bar

  const rows: CriterionRow[] = [
    { label: 'Kar Faktörü',      value: b.profitFactor,      max: 20,  description: '≥5→+20 / ≥2→+15 / ≥1→+10' },
    { label: 'Kazanma Oranı',    value: b.winRate,           max: 25,  description: 'WR% × 0.25' },
    { label: 'Kayıp Sayısı',     value: b.lossCount,         max: 4.5, description: '≤2→+4.5 / 3-4→−4.5 / ≥5→−6.5' },
    { label: 'İşlem Sayısı',     value: b.totalTrades,       max: 4,   description: '≤10→+4 / >10→−4' },
    { label: 'Asya Seansı',      value: b.asiaSession,       max: 2,   description: 'İşlem yok→+2 / var→−2' },
    { label: 'Kâr İstikrarı',    value: b.profitStability,   max: 5,   description: 'En iyi trade ≤%70→+5 / >%70→−6.5' },
    { label: 'Bounce Back',      value: b.bounceBack,        max: 5.7, description: 'Dün kırmızı+bugün WR>%50→+5.7' },
    { label: 'Journal Disiplini',value: b.journalDiscipline, max: 999, description: 'Eksiksiz satır × +3' },
  ]

  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-5 space-y-4">
      {/* Başlık + tarih */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500 dark:text-[#9ca3af]">{S.dashboard.qtScore}</p>
        {result.tradeDate && (
          <span className="text-[10px] text-gray-400 dark:text-[#6b7280] font-mono">{result.tradeDate}</span>
        )}
      </div>

      {/* Skor + bar */}
      <div className="flex items-center gap-4">
        <div className="text-center">
          <span className="text-5xl font-bold tabular-nums" style={{ color }}>{result.total}</span>
          <p className="text-xs text-gray-400 dark:text-[#9ca3af] mt-0.5">/ 100</p>
        </div>
        <div className="flex-1 space-y-1">
          <div className="h-3 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, backgroundColor: color }}
            />
          </div>
          <p className="text-[10px] text-gray-400 dark:text-[#9ca3af]">
            {result.total === 0 && trades.length === 0
              ? 'Veri yok'
              : result.total >= 60 ? '✓ İyi disiplin'
              : result.total >= 35 ? '⚠ Gelişim gerekli'
              : '✗ Disiplini gözden geçir'}
          </p>
        </div>
      </div>

      {/* Kriter tablosu */}
      <div className="space-y-1.5 pt-1 border-t border-gray-100 dark:border-white/10">
        {rows.map(row => (
          <div key={row.label} className="flex items-center justify-between group">
            <div className="flex-1 min-w-0">
              <span className="text-xs text-gray-600 dark:text-[#9ca3af] truncate block">{row.label}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {/* Mini bar */}
              <div className="w-20 h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                {row.value !== 0 && (
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: row.max < 100 ? `${Math.min(100, (Math.abs(row.value) / row.max) * 100)}%` : `${Math.min(100, row.value)}%`,
                      backgroundColor: row.value >= 0 ? '#10b981' : '#ef4444',
                    }}
                  />
                )}
              </div>
              <span
                className="text-xs font-mono font-semibold w-10 text-right"
                style={{ color: signColor(row.value) }}
              >
                {row.value > 0 ? `+${row.value}` : row.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
