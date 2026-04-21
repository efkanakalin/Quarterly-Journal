import { calculateQTScore } from '@/lib/metrics/qtScore'
import { useS } from '@/lib/i18n'
import type { TradeWithRelations } from '@/types'

interface Props { trades: TradeWithRelations[] }

function scoreColor(score: number) {
  if (score >= 60) return { text: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)' }
  if (score >= 35) return { text: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.25)' }
  return             { text: '#ef4444', bg: 'rgba(239,68,68,0.12)',    border: 'rgba(239,68,68,0.25)' }
}

function signColor(v: number) {
  return v > 0 ? '#10b981' : v < 0 ? '#ef4444' : '#9ca3af'
}

const CRITERIA = [
  { key: 'profitFactor',      labelEn: 'Profit Factor',      labelTr: 'Kar Faktörü',      max: 20 },
  { key: 'winRate',           labelEn: 'Win Rate',           labelTr: 'Kazanma Oranı',    max: 25 },
  { key: 'lossCount',         labelEn: 'Loss Count',         labelTr: 'Kayıp Sayısı',     max: 4.5 },
  { key: 'totalTrades',       labelEn: 'Trade Count',        labelTr: 'İşlem Sayısı',     max: 4 },
  { key: 'asiaSession',       labelEn: 'Asia Session',       labelTr: 'Asya Seansı',      max: 2 },
  { key: 'profitStability',   labelEn: 'Profit Stability',   labelTr: 'Kâr İstikrarı',   max: 5 },
  { key: 'bounceBack',        labelEn: 'Bounce Back',        labelTr: 'Bounce Back',      max: 5.7 },
  { key: 'journalDiscipline', labelEn: 'Journal Discipline', labelTr: 'Journal Disiplini', max: 999 },
]

export function QTScore({ trades }: Props) {
  const S = useS()
  const isTr = S.dashboard.qtScore === 'QT Skoru'
  const result = calculateQTScore(trades)
  const colors = scoreColor(result.total)
  const pct = Math.min(100, (result.total / 80) * 100)

  return (
    <div
      className="rounded-xl border p-5 space-y-4"
      style={{ background: colors.bg, borderColor: colors.border }}
    >
      {/* Başlık + tarih */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: colors.text }}>
          {S.dashboard.qtScore}
        </p>
        {result.tradeDate && (
          <span className="text-[10px] text-gray-400 dark:text-[#6b7280] font-mono">{result.tradeDate}</span>
        )}
      </div>

      {/* Büyük skor */}
      <div className="flex items-end gap-3">
        <span className="text-6xl font-black tabular-nums leading-none" style={{ color: colors.text }}>
          {result.total}
        </span>
        <div className="mb-1 space-y-1">
          <span className="text-sm text-gray-400 dark:text-[#9ca3af] font-medium">/ 100</span>
          <p className="text-[10px] text-gray-400 dark:text-[#9ca3af]">
            {result.total === 0 && trades.length === 0
              ? (isTr ? 'Veri yok' : 'No data')
              : result.total >= 60 ? (isTr ? '✓ İyi disiplin' : '✓ Good discipline')
              : result.total >= 35 ? (isTr ? '⚠ Gelişim gerekli' : '⚠ Needs improvement')
              : (isTr ? '✗ Disiplini gözden geçir' : '✗ Review discipline')}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: colors.text }}
        />
      </div>

      {/* Kriter listesi */}
      <div className="space-y-2 pt-1 border-t border-gray-100 dark:border-white/10">
        {CRITERIA.map(c => {
          const val = result.breakdown[c.key as keyof typeof result.breakdown]
          return (
            <div key={c.key} className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-gray-500 dark:text-[#9ca3af] truncate flex-1">
                {isTr ? c.labelTr : c.labelEn}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-16 h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                  {val !== 0 && (
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: c.max < 100
                          ? `${Math.min(100, (Math.abs(val) / c.max) * 100)}%`
                          : `${Math.min(100, val)}%`,
                        backgroundColor: val >= 0 ? '#10b981' : '#ef4444',
                      }}
                    />
                  )}
                </div>
                <span
                  className="text-[11px] font-mono font-semibold w-9 text-right"
                  style={{ color: signColor(val) }}
                >
                  {val > 0 ? `+${val}` : val}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
