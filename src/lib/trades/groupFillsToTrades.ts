import type { TradovateFill, TradovateContract } from '@/lib/brokers/types'
import type { Trade } from '@/types'

/**
 * Tradovate'in raw fill listesini logical trade'lere çevirir.
 * Phase 2'de buildTradeFromPair shared util ile birlikte gerçek implementasyon eklenecek.
 */
export function groupFillsToTrades(
  _fills:     TradovateFill[],
  _contracts: TradovateContract[],
): Omit<Trade, 'id' | 'user_id' | 'created_at' | 'updated_at'>[] {
  return []
}
