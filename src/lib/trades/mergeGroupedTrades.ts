import type { TradeConfirmation, TradeMistake, TradeWithRelations } from '@/types'
import { deriveOutcome } from '@/lib/derivations/outcome'
import { groupNearbyTrades, type TradeGroup } from './groupNearbyTrades'

/**
 * Bir trade grubunu tek logical trade'e dönüştürür. Scaling-in/out partial'lar
 * tek "işlem" gibi davranır: PnL toplanır, qty toplanır, fiyatlar miktar-ağırlıklı
 * ortalama olur, süre ilk giriş -> son çıkışa uzar. id primary'den gelir, böylece
 * React listelerinde key olarak kullanılabilir.
 */
export function mergeGroupTrades(group: TradeGroup): TradeWithRelations {
  const primary = group.primary
  if (group.count === 1) return primary

  const trades = group.trades
  const allHavePnl = trades.every(t => t.pnl_usd !== null)
  const totalPnl = allHavePnl
    ? trades.reduce((s, t) => s + (t.pnl_usd ?? 0), 0)
    : null

  const totalQty = trades.reduce((s, t) => s + (t.qty ?? 0), 0) || null

  const weightedPrice = (key: 'entry_price' | 'exit_price'): number | null => {
    let totalQ = 0
    let totalNotional = 0
    for (const t of trades) {
      const price = t[key]
      const qty = t.qty
      if (price == null || qty == null) continue
      totalNotional += price * qty
      totalQ += qty
    }
    return totalQ > 0 ? totalNotional / totalQ : null
  }

  const entryTimes = trades
    .map(t => t.entry_time_et)
    .filter((v): v is string => !!v)
  const exitTimes = trades
    .map(t => t.exit_time_et)
    .filter((v): v is string => !!v)
  const earliestEntry = entryTimes.length
    ? entryTimes.reduce((a, b) => (a < b ? a : b))
    : primary.entry_time_et
  const latestExit = exitTimes.length
    ? exitTimes.reduce((a, b) => (a > b ? a : b))
    : primary.exit_time_et

  const durationSec =
    earliestEntry && latestExit
      ? Math.max(0, Math.round(
          (new Date(latestExit).getTime() - new Date(earliestEntry).getTime()) / 1000,
        ))
      : primary.duration_sec

  const confirmations: TradeConfirmation[] = []
  const seenConfKey = new Set<string>()
  for (const t of trades) {
    for (const c of t.trade_confirmations ?? []) {
      const key = `${c.confirmation_type}|${c.timeframe ?? ''}`
      if (seenConfKey.has(key)) continue
      seenConfKey.add(key)
      confirmations.push(c)
    }
  }

  const mistakes: TradeMistake[] = []
  const seenMistakeKey = new Set<string>()
  for (const t of trades) {
    for (const m of t.trade_mistakes ?? []) {
      if (seenMistakeKey.has(m.mistake_type)) continue
      seenMistakeKey.add(m.mistake_type)
      mistakes.push(m)
    }
  }

  return {
    ...primary,
    pnl_usd:        totalPnl,
    qty:            totalQty,
    entry_price:    weightedPrice('entry_price'),
    exit_price:     weightedPrice('exit_price'),
    entry_time_et:  earliestEntry ?? null,
    exit_time_et:   latestExit ?? null,
    duration_sec:   durationSec,
    outcome:        totalPnl != null ? deriveOutcome(totalPnl) : primary.outcome,
    trade_confirmations: confirmations,
    trade_mistakes:      mistakes,
  }
}

/**
 * Verilen trade listesinden, scaling-in partial'ları birleştirilmiş "logical
 * trade" listesi üretir. Sıralama girdiyle aynı (gruplama içeride zamana göre
 * yapıldığı için en güncel önce kalır).
 */
export function mergeIntoLogicalTrades(
  trades: TradeWithRelations[],
  windowMs?: number,
): TradeWithRelations[] {
  const groups = groupNearbyTrades(trades, windowMs)
  return groups.map(mergeGroupTrades)
}
