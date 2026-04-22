import { format } from 'date-fns'
import type { TradeWithRelations } from '@/types'

export interface QTScoreBreakdown {
  profitFactor:      number   // max +20
  winRate:           number   // max +25
  lossCount:         number   // +4.5 / -4.5 / -6.5
  totalTrades:       number   // +4 / -4
  asiaSession:       number   // +2 / -2
  profitStability:   number   // +5 / -6.5
  bounceBack:        number   // +5.7 / 0
  journalDiscipline: number   // filledRows * 3
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
  // 1. Win % — direkt
  const winPct = Math.min(100, (b.winRate / 25) * 100)

  // 2. Profit Factor — pfScore maks 20
  const pfPct = (b.profitFactor / 20) * 100

  // 3. Avg Win/Loss (profit stability) — +5→100, 0→50, -6.5→0
  const stabilityPct = b.profitStability === 5 ? 100 : b.profitStability < 0 ? 0 : 50

  // 4. Recovery Factor — bounce back
  const recoveryPct = b.bounceBack > 0 ? 100 : 50

  // 5. Consistency — loss control + trade count + asia + journal
  const lossCtrl   = b.lossCount === 4.5 ? 100 : b.lossCount === -4.5 ? 30 : 0
  const tradeCtrl  = b.totalTrades > 0 ? 100 : 0
  const asiaCtrl   = b.asiaSession > 0 ? 100 : 0
  const journalCtrl = Math.min(100, b.journalDiscipline * 10)
  const consistencyPct = (lossCtrl + tradeCtrl + asiaCtrl + journalCtrl) / 4

  return [
    { axis: 'Win %',           value: Math.round(winPct) },
    { axis: 'Profit Factor',   value: Math.round(pfPct) },
    { axis: 'Avg Win/Loss',    value: Math.round(stabilityPct) },
    { axis: 'Recovery Factor', value: Math.round(recoveryPct) },
    { axis: 'Consistency',     value: Math.round(consistencyPct) },
  ]
}

/**
 * Günlük Disiplin Skoru — en son işlem gününe göre hesaplanır.
 * Formül: QT Journal calculation.txt v1.0
 */
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

  // En son işlem günü
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
  if      (pf >= 5.0) pfScore = 20
  else if (pf >= 2.0) pfScore = 15
  else if (pf >= 1.0) pfScore = 10
  else if (pf >= 0.5) pfScore = 5
  score += pfScore

  // 2. Win Rate (maks 25 puan)
  const winRate = rated === 0 ? 0 : (wins.length / rated) * 100
  const wrScore = winRate * 0.25
  score += wrScore

  // 3. Loss Count
  let lossScore = 0
  if      (losses.length <= 2)                    lossScore =  4.5
  else if (losses.length >= 3 && losses.length < 5) lossScore = -4.5
  else if (losses.length >= 5)                    lossScore = -6.5
  score += lossScore

  // 4. Toplam İşlem Sayısı
  const tradeScore = day.length <= 10 ? 4 : -4
  score += tradeScore

  // 5. Asya Seansı
  const hasAsia  = day.some(t => t.session === 'asia')
  const asiaScore = hasAsia ? -2 : 2
  score += asiaScore

  // 6. Kâr İstikrarı (en iyi işlem / toplam kazanç %)
  let stabilityScore = 0
  if (grossProfit > 0) {
    const bestPnl = Math.max(...day.map(t => t.pnl_usd ?? 0))
    const bestPct = (bestPnl / grossProfit) * 100
    stabilityScore = bestPct <= 70 ? 5 : -6.5
  }
  score += stabilityScore

  // 7. Bounce Back (dün kırmızı ve bugün WR > %50)
  let bounceScore = 0
  if (prev.length > 0) {
    const prevPnl = prev.reduce((s, t) => s + (t.pnl_usd ?? 0), 0)
    if (prevPnl < 0 && winRate > 50) bounceScore = 5.7
  }
  score += bounceScore

  // 8. Journal Disiplini (eksiksiz doldurulmuş satır başına +3)
  const filled = day.filter(t => t.is_complete).length
  const journalScore = filled * 3
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
      journalDiscipline: journalScore,
    },
  }
}
