import { buildTradeFromPair, type TradeInsertPayload } from './buildTradeFromPair'
import { pointValueFor } from './contractValues'
import { cleanSymbol } from '@/lib/derivations/symbol'
import type { TradovateFill, TradovateContract } from '@/lib/brokers/types'

/**
 * Tradovate'in raw `fill` event listesini logical "trade" (round-trip) listesine çevirir.
 *
 * Strateji:
 *  - Fill'ler `contractId` bazında gruplanır.
 *  - Her grup içinde timestamp'e göre sıralı yürünür; running position track edilir.
 *  - Position 0'a döndüğünde bir round-trip kapanır → bir Trade emit edilir.
 *  - Birden çok partial fill bir round-trip'i oluşturuyorsa qty'ler toplanır,
 *    fiyatlar miktar ağırlıklı ortalama (VWAP) ile birleştirilir.
 *  - PnL = (sellAvg - buyAvg) × qty × pointValue.  Bilinmeyen sembollerde
 *    pointValue=1 (kullanıcı manuel düzeltebilir).
 *  - Fingerprint: ilk buy fill id + ilk sell fill id — sessiz duplikasyon önler.
 */
export function groupFillsToTrades(
  fills:     TradovateFill[],
  contracts: TradovateContract[],
): TradeInsertPayload[] {
  if (!fills.length) return []

  const contractById = new Map<number, TradovateContract>()
  for (const c of contracts) contractById.set(c.id, c)

  const byContract = new Map<number, TradovateFill[]>()
  for (const f of fills) {
    if (!f.active && f.active !== undefined) continue
    const arr = byContract.get(f.contractId) ?? []
    arr.push(f)
    byContract.set(f.contractId, arr)
  }

  const trades: TradeInsertPayload[] = []

  for (const [contractId, group] of byContract) {
    const contract = contractById.get(contractId)
    const symbolRaw = contract?.name ?? `UNKNOWN-${contractId}`
    const baseSymbol = symbolRaw.length > 2 ? cleanSymbol(symbolRaw) : symbolRaw
    const pointValue = pointValueFor(baseSymbol)

    const sorted = [...group].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    let position = 0
    let buyQtySum  = 0
    let sellQtySum = 0
    let buyNotional  = 0
    let sellNotional = 0
    let firstBuyFillId:  string | null = null
    let firstSellFillId: string | null = null
    let firstBuyTs:  string | null = null
    let lastSellTs:  string | null = null
    let firstSellTs: string | null = null
    let lastBuyTs:   string | null = null

    const reset = () => {
      buyQtySum = sellQtySum = buyNotional = sellNotional = 0
      firstBuyFillId = firstSellFillId = null
      firstBuyTs = lastSellTs = firstSellTs = lastBuyTs = null
    }

    for (const f of sorted) {
      const signedQty = f.action === 'Buy' ? f.qty : -f.qty
      const prevPosition = position
      position += signedQty

      if (f.action === 'Buy') {
        buyQtySum    += f.qty
        buyNotional  += f.price * f.qty
        if (firstBuyFillId === null) { firstBuyFillId = String(f.id); firstBuyTs = f.timestamp }
        lastBuyTs = f.timestamp
      } else {
        sellQtySum   += f.qty
        sellNotional += f.price * f.qty
        if (firstSellFillId === null) { firstSellFillId = String(f.id); firstSellTs = f.timestamp }
        lastSellTs = f.timestamp
      }

      // Round-trip kapandı (position 0'a döndü) — trade emit et.
      if (position === 0 && prevPosition !== 0) {
        if (buyQtySum > 0 && sellQtySum > 0 && firstBuyFillId && firstSellFillId) {
          const qty       = Math.min(buyQtySum, sellQtySum)
          const buyAvg    = buyNotional  / buyQtySum
          const sellAvg   = sellNotional / sellQtySum

          // bought < sold → long; aksi short.
          const isLong    = (firstBuyTs ?? '') < (firstSellTs ?? '')
          const pnl       = (sellAvg - buyAvg) * qty * pointValue * (isLong ? 1 : 1)
          // Not: hem long hem short için (sellAvg - buyAvg) * qty doğru sonuç verir,
          // çünkü short'ta sellAvg buyAvg'den önce gelir ve PnL işareti otomatik döner.

          const boughtUtcIso = (isLong ? firstBuyTs : lastBuyTs) ?? firstBuyTs!
          const soldUtcIso   = (isLong ? lastSellTs : firstSellTs) ?? firstSellTs!

          trades.push(buildTradeFromPair({
            symbolRaw,
            qty,
            buyPrice:     buyAvg,
            sellPrice:    sellAvg,
            pnlUsd:       round2(pnl),
            boughtUtcIso,
            soldUtcIso,
            buyFillId:    firstBuyFillId,
            sellFillId:   firstSellFillId,
            source:       'tradovate_api',
          }))
        }
        reset()
      }
    }
  }

  return trades
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
