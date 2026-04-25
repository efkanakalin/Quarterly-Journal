import { format } from 'date-fns'
import type { TradeWithRelations } from '@/types'

// QT JOURNAL — Günlük Disiplin Skoru v1.0
// Taban puan yok, 0'dan başlar. Günlük değerlendirilir.

export interface QTScoreBreakdown {
  profitFactor:      number   // 0 / 15 / 20 / 25 / 35
  winRate:           number   // 0-25 (WR% * 0.25)
  lossCount:         number   // +5 / -1 / -5
  totalTrades:       number   // +6.2 / -3
  asiaSession:       number   // +5 / -2
  profitStability:   number   // +5.1 / -3
  bounceBack:        number   // +5.7 / 0
  journalDiscipline: number   // filled * 2.6
}

export interface QTScoreResult {
  total: number
  breakdown: QTScoreBreakdown
  radar: QTRadarPoint[]
  tradeDate: string | null
}

export interface QTRadarPoint {
  axis: string
  value: number  // 0-100
}

/** 8 kriteri 5 radar eksenine normalize eder (0-100) */
export function buildRadarScores(b: QTScoreBreakdown): QTRadarPoint[] {
  // 1. Win % — direkt (max 25 puan → 100)
  const winPct = Math.min(100, (b.winRate / 25) * 100)

  // 2. Profit Factor — max 35 puan → 100
  const pfPct = (b.profitFactor / 35) * 100

  // 3. Profit Stability — +5.1 → 100, 0 → 50, -3 → 0
  const stabilityPct =
    b.profitStability >= 5 ? 100 : b.profitStability < 0 ? 0 : 50

  // 4. Recovery (Bounce Back) — +5.7 → 100, 0 → 50
  const recoveryPct = b.bounceBack > 0 ? 100 : 50

  // 5. Consistency — 4 alt-metriğin ortalaması
  const lossCtrl    = b.lossCount === 5 ? 100 : b.lossCount === -1 ? 50 : 0
  const tradeCtrl   = b.totalTrades > 0 ? 100 : 0
  const asiaCtrl    = b.asiaSession > 0 ? 100 : 0
  const journalCtrl = Math.min(100, (b.journalDiscipline / 26) * 100) // 10 satır ~ 100
  const consistencyPct = (lossCtrl + tradeCtrl + asiaCtrl + journalCtrl) / 4

  return [
    { axis: 'Win %',           value: Math.round(winPct) },
    { axis: 'Profit Factor',   value: Math.round(pfPct) },
    { axis: 'Avg Win/Loss',    value: Math.round(stabilityPct) },
    { axis: 'Recovery Factor', value: Math.round(recoveryPct) },
    { axis: 'Consistency',     value: Math.round(consistencyPct) },
  ]
}

export function calculateQTScore(trades: TradeWithRelations[]): QTScoreResult {
  const empty: QTScoreResult = {
    total: 0,
    breakdown: { profitFactor: 0, winRate: 0, lossCount: 0, totalTrades: 0, asiaSession: 0, profitStability: 0, bounceBack: 0, journalDiscipline: 0 },
    radar: [
      { axis: 'Win %',           value: 0 },
      { axis: 'Profit Factor',   value: 0 },
      { axis: 'Avg Win/Loss',    value: 0 },
      { axis: 'Recovery Factor', value: 0 },
      { axis: 'Consistency',     value: 0 },
    ],
    tradeDate: null,
  }

  const validTrades = trades.filter(t => t.entry_time_et && t.pnl_usd !== null)
  if (validTrades.length === 0) return empty

  // Günlere göre grupla
  const dailyMap: Record<string, TradeWithRelations[]> = {}
  for (const t of validTrades) {
    const day = format(new Date(t.entry_time_et!), 'yyyy-MM-dd')
    if (!dailyMap[day]) dailyMap[day] = []
    dailyMap[day].push(t)
  }

  const days = Object.keys(dailyMap).sort().reverse()
  const today = days[0]
  const yesterday = days[1] ?? null

  const todayTrades = dailyMap[today]
  const prevTrades  = yesterday ? dailyMap[yesterday] : []

  const result = scoreDailyTrades(todayTrades, prevTrades)
  return { ...result, radar: buildRadarScores(result.breakdown), tradeDate: today }
}

function scoreDailyTrades(
  day: TradeWithRelations[],
  prev: TradeWithRelations[]
): Omit<QTScoreResult, 'tradeDate' | 'radar'> {
  let score = 0

  const wins   = day.filter(t => t.outcome === 'win')
  const losses = day.filter(t => t.outcome === 'loss')
  const grossProfit = wins.reduce((s, t) => s + (t.pnl_usd ?? 0), 0)
  const grossLoss   = Math.abs(losses.reduce((s, t) => s + (t.pnl_usd ?? 0), 0))
  const rated = wins.length + losses.length

  // 1. Profit Factor
  const pf = grossLoss === 0 ? (grossProfit > 0 ? 99 : 0) : grossProfit / grossLoss
  let pfScore = 0
  if      (pf >= 5.0) pfScore = 35
  else if (pf >= 2.0) pfScore = 25
  else if (pf >= 1.0) pfScore = 20
  else if (pf >= 0.5) pfScore = 15
  else                pfScore = 0
  score += pfScore

  // 2. Win Rate — maks 25 puan (WR% * 0.25)
  const winRate = rated === 0 ? 0 : (wins.length / rated) * 100
  const wrScore = winRate * 0.25
  score += wrScore

  // 3. Loss Count
  let lossScore = 0
  if      (losses.length <= 2)                        lossScore =  5
  else if (losses.length >= 3 && losses.length <= 4)  lossScore = -1
  else /* >= 5 */                                     lossScore = -5
  score += lossScore

  // 4. Toplam İşlem Sayısı (Overtrading)
  const tradeScore = day.length <= 10 ? 6.2 : -3
  score += tradeScore

  // 5. Asya Seansı (disiplin)
  const hasAsia   = day.some(t => t.session === 'asia')
  const asiaScore = hasAsia ? -2 : 5
  score += asiaScore

  // 6. Kâr İstikrarı (en iyi trade'in toplam kâra oranı)
  let stabilityScore = 0
  if (grossProfit > 0) {
    const bestPnl = Math.max(...day.map(t => t.pnl_usd ?? 0))
    const bestPct = (bestPnl / grossProfit) * 100
    stabilityScore = bestPct <= 70 ? 5.1 : -3
  }
  score += stabilityScore

  // 7. Bounce Back — dün kırmızı + bugün WR > %50
  let bounceScore = 0
  if (prev.length > 0) {
    const prevPnl = prev.reduce((s, t) => s + (t.pnl_usd ?? 0), 0)
    if (prevPnl < 0 && winRate > 50) bounceScore = 5.7
  }
  score += bounceScore

  // 8. Journal Disiplini — eksiksiz her satır başına +2.6
  const filled = day.filter(t => t.is_complete).length
  const journalScore = filled * 2.6
  score += journalScore

  return {
    total: Math.max(0, parseFloat(score.toFixed(2))),
    breakdown: {
      profitFactor:      pfScore,
      winRate:           parseFloat(wrScore.toFixed(2)),
      lossCount:         lossScore,
      totalTrades:       tradeScore,
      asiaSession:       asiaScore,
      profitStability:   stabilityScore,
      bounceBack:        bounceScore,
      journalDiscipline: parseFloat(journalScore.toFixed(2)),
    },
  }
}
