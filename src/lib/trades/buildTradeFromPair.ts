import { buildFingerprint } from '@/lib/csv/fingerprint'
import { cleanSymbol, getContractClass } from '@/lib/derivations/symbol'
import { deriveOutcome } from '@/lib/derivations/outcome'
import {
  deriveSession, deriveSessionQuarter, deriveMicroQuarter90m,
} from '@/lib/derivations/session'
import {
  deriveWeekOfYear, deriveMonthQuarter, deriveYearQuarter, deriveDayOfWeek,
} from '@/lib/derivations/quarter'
import type { Source, Trade } from '@/types'

/**
 * Eşleştirilmiş bir buy + sell fill çiftinden, türetilmiş tüm alanlar
 * doldurulmuş bir Trade insert payload üretir. Hem CSV import hem de
 * Tradovate API senkronu bu fonksiyonu kullanır — böylece outcome,
 * session, quarter, vs. mantığı tek bir yerde yaşar.
 *
 * Kurallar:
 *  - timestamp'ler UTC ISO olarak gelir.
 *  - direction: bought < sold → long, aksi short.
 *  - duration: caller verirse onu kullan; yoksa timestamp farkı.
 *  - fingerprint: `${buyFillId}_${sellFillId}` (sessiz duplikasyon koruması).
 */
export interface PairedFillInput {
  symbolRaw:        string
  qty:              number
  buyPrice:         number | null
  sellPrice:        number | null
  pnlUsd:           number
  boughtUtcIso:     string
  soldUtcIso:       string
  durationSec?:     number | null
  buyFillId:        string
  sellFillId:       string
  source:           Source
  currency?:        string
}

export type TradeInsertPayload = Omit<Trade, 'id' | 'user_id' | 'created_at' | 'updated_at'>

export function buildTradeFromPair(input: PairedFillInput): TradeInsertPayload {
  const symbol        = cleanSymbol(input.symbolRaw)
  const contractClass = getContractClass(symbol)

  const entryUtc = new Date(input.boughtUtcIso)
  const exitUtc  = new Date(input.soldUtcIso)
  if (isNaN(entryUtc.getTime())) throw new Error(`Invalid bought timestamp: ${input.boughtUtcIso}`)
  if (isNaN(exitUtc.getTime()))  throw new Error(`Invalid sold timestamp: ${input.soldUtcIso}`)

  const direction = entryUtc.getTime() < exitUtc.getTime() ? 'long' : 'short'

  const durationSec = input.durationSec ?? Math.round(Math.abs(exitUtc.getTime() - entryUtc.getTime()) / 1000)

  const session        = deriveSession(entryUtc)
  const sessionQuarter = deriveSessionQuarter(entryUtc, session)
  const microQuarter   = deriveMicroQuarter90m(entryUtc, session)
  const weekOfYear     = deriveWeekOfYear(entryUtc)
  const monthQuarter   = deriveMonthQuarter(entryUtc)
  const yearQuarter    = deriveYearQuarter(entryUtc)
  const dayOfWeek      = deriveDayOfWeek(entryUtc)

  return {
    symbol_raw:        input.symbolRaw,
    symbol,
    contract_class:    contractClass,
    direction,
    qty:               input.qty,
    entry_price:       input.buyPrice,
    exit_price:        input.sellPrice,
    entry_time_et:     entryUtc.toISOString(),
    exit_time_et:      exitUtc.toISOString(),
    pnl_usd:           input.pnlUsd,
    duration_sec:      durationSec,
    session,
    day_of_week:       dayOfWeek,
    session_quarter:   sessionQuarter,
    micro_quarter_90m: microQuarter,
    week_of_year:      weekOfYear,
    month_quarter:     monthQuarter,
    year_quarter:      yearQuarter,
    outcome:           deriveOutcome(input.pnlUsd),
    r_multiple:        null,
    chart_link:        null,
    notes:             null,
    currency:          input.currency ?? 'USD',
    source:            input.source,
    is_complete:       false,
    csv_fingerprint:   buildFingerprint(input.buyFillId, input.sellFillId),
  }
}
