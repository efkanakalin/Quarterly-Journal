import { format, startOfWeek, startOfMonth } from 'date-fns'
import type { TradeWithRelations } from '@/types'
import { getDateBounds, type DateRangeKey } from '@/stores/useDashboardStore'

export function filterByDateRange(trades: TradeWithRelations[], rangeKey: DateRangeKey): TradeWithRelations[] {
  const bounds = getDateBounds(rangeKey)
  if (!bounds) return trades
  return trades.filter(t => {
    if (!t.entry_time_et) return false
    const d = new Date(t.entry_time_et)
    return d >= bounds.start && d <= bounds.end
  })
}

export interface DailyStats {
  date: string  // 'yyyy-MM-dd'
  pnl: number
  count: number
}

export interface TradeStats {
  totalPnl: number
  tradeCount: number
  winCount: number
  lossCount: number
  profitFactor: number
  winRate: number
  dayWinRate: number
  avgWin: number
  avgLoss: number
}

export function calcStats(trades: TradeWithRelations[]): TradeStats {
  const pnlTrades = trades.filter(t => t.pnl_usd !== null)
  const wins   = pnlTrades.filter(t => t.outcome === 'win')
  const losses = pnlTrades.filter(t => t.outcome === 'loss')

  const totalPnl    = pnlTrades.reduce((s, t) => s + (t.pnl_usd ?? 0), 0)
  const grossProfit = wins.reduce((s, t) => s + (t.pnl_usd ?? 0), 0)
  const grossLoss   = Math.abs(losses.reduce((s, t) => s + (t.pnl_usd ?? 0), 0))
  const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? Infinity : 0) : grossProfit / grossLoss

  const ratedTrades = wins.length + losses.length
  const winRate     = ratedTrades === 0 ? 0 : (wins.length / ratedTrades) * 100

  const daily = calcDailyStats(pnlTrades)
  const positiveDays = daily.filter(d => d.pnl > 0).length
  const dayWinRate   = daily.length === 0 ? 0 : (positiveDays / daily.length) * 100

  const avgWin  = wins.length === 0   ? 0 : grossProfit / wins.length
  const avgLoss = losses.length === 0 ? 0 : grossLoss / losses.length

  return {
    totalPnl,
    tradeCount: pnlTrades.length,
    winCount:   wins.length,
    lossCount:  losses.length,
    profitFactor,
    winRate,
    dayWinRate,
    avgWin,
    avgLoss,
  }
}

export function calcDailyStats(trades: TradeWithRelations[]): DailyStats[] {
  const map: Record<string, { pnl: number; count: number }> = {}
  for (const t of trades) {
    if (!t.entry_time_et || t.pnl_usd === null) continue
    const key = format(new Date(t.entry_time_et), 'yyyy-MM-dd')
    if (!map[key]) map[key] = { pnl: 0, count: 0 }
    map[key].pnl   += t.pnl_usd
    map[key].count += 1
  }
  return Object.entries(map)
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export interface CumulativePoint {
  date: string
  pnl: number
  cumulative: number
}

export function calcCumulativePnl(trades: TradeWithRelations[]): CumulativePoint[] {
  const daily = calcDailyStats(trades)
  let running = 0
  return daily.map(d => {
    running += d.pnl
    return { date: d.date, pnl: d.pnl, cumulative: running }
  })
}

export interface DrawdownPoint {
  date: string
  drawdown: number
}

export function calcDrawdown(trades: TradeWithRelations[]): DrawdownPoint[] {
  const cumulative = calcCumulativePnl(trades)
  let peak = 0
  return cumulative.map(p => {
    if (p.cumulative > peak) peak = p.cumulative
    const drawdown = p.cumulative - peak
    return { date: p.date, drawdown }
  })
}

export interface PeriodPnl {
  label: string
  pnl: number
}

export function calcWeeklyPnl(trades: TradeWithRelations[]): PeriodPnl[] {
  const map: Record<string, number> = {}
  for (const t of trades) {
    if (!t.entry_time_et || t.pnl_usd === null) continue
    const key = format(startOfWeek(new Date(t.entry_time_et), { weekStartsOn: 1 }), 'MMM d')
    map[key] = (map[key] ?? 0) + t.pnl_usd
  }
  return Object.entries(map).map(([label, pnl]) => ({ label, pnl }))
}

export function calcMonthlyPnl(trades: TradeWithRelations[]): PeriodPnl[] {
  const map: Record<string, number> = {}
  for (const t of trades) {
    if (!t.entry_time_et || t.pnl_usd === null) continue
    const key = format(startOfMonth(new Date(t.entry_time_et)), 'MMM yyyy')
    map[key] = (map[key] ?? 0) + t.pnl_usd
  }
  return Object.entries(map).map(([label, pnl]) => ({ label, pnl }))
}
