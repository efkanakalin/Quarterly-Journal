import type { ContractClass } from '@/types'

const MICRO_SYMBOLS = ['MNQ', 'MES', 'MYM']
const MINI_SYMBOLS  = ['NQ', 'ES', 'YM']

export function cleanSymbol(raw: string): string {
  // "MNQM6" → "MNQ" (remove last 2 chars which are expiry code)
  return raw.slice(0, -2)
}

export function getContractClass(symbol: string): ContractClass | null {
  if (MICRO_SYMBOLS.includes(symbol)) return 'micro'
  if (MINI_SYMBOLS.includes(symbol))  return 'mini'
  return null
}
