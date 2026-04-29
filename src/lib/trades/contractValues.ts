/**
 * Tradovate contract sembolleri için "1 fiyat puanının USD değeri".
 * QT framework'ünde traderların ağırlıklı kullandığı index futures'lar burada;
 * eksik bir kontrat için default 1 USD/point döner (PnL yaklaşık olur).
 *
 * Sembol formatı: contract'ın "name" alanı (örn. "MNQM6") sondan 2 karakter
 * (expiry kodu) atılarak base sembole indirgenir.
 */
const POINT_VALUES: Record<string, number> = {
  // Index — Mini
  NQ:   20,
  ES:   50,
  YM:    5,
  RTY:  50,
  // Index — Micro
  MNQ:   2,
  MES:   5,
  MYM:   0.5,
  M2K:   5,
  // Metals
  GC:  100,
  MGC:  10,
  SI: 5000,
  SIL:  100,
  // Energy
  CL: 1000,
  MCL: 100,
  NG: 10000,
  // FX
  '6E': 125000,
  '6B':  62500,
  '6J':  12500000,
}

export function pointValueFor(symbol: string): number {
  return POINT_VALUES[symbol] ?? 1
}
