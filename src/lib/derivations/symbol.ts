import type { ContractClass } from '@/types'
import { SYMBOL_CLASS_MAP } from '@/lib/constants/symbols'

// Futures expiry: month letter (FGHJKMNQUVXZ) + 1-2 digit year. Strip only if matches.
const FUTURES_EXPIRY_RE = /[FGHJKMNQUVXZ]\d{1,2}$/

export function cleanSymbol(raw: string): string {
  // "MNQM6" → "MNQ", but leave "EURUSD" / "BTCUSD" untouched
  return FUTURES_EXPIRY_RE.test(raw) ? raw.replace(FUTURES_EXPIRY_RE, '') : raw
}

export function getContractClass(symbol: string): ContractClass | null {
  return SYMBOL_CLASS_MAP[symbol] ?? null
}
