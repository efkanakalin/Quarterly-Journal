export type ContractClass = 'micro' | 'mini' | 'forex' | 'crypto'

export interface SymbolDef {
  code: string
  name: string
  class: ContractClass
  category: 'futures' | 'forex' | 'crypto'
}

export const SYMBOLS_LIST: SymbolDef[] = [
  { code: 'MNQ',    name: 'Micro Nasdaq',  class: 'micro',  category: 'futures' },
  { code: 'MES',    name: 'Micro S&P',     class: 'micro',  category: 'futures' },
  { code: 'MYM',    name: 'Micro Dow',     class: 'micro',  category: 'futures' },
  { code: 'NQ',     name: 'Nasdaq',        class: 'mini',   category: 'futures' },
  { code: 'ES',     name: 'S&P',           class: 'mini',   category: 'futures' },
  { code: 'YM',     name: 'Dow',           class: 'mini',   category: 'futures' },
  { code: 'EURUSD', name: 'EUR/USD',       class: 'forex',  category: 'forex'   },
  { code: 'GBPUSD', name: 'GBP/USD',       class: 'forex',  category: 'forex'   },
  { code: 'BTCUSD', name: 'BTC/USD',       class: 'crypto', category: 'crypto'  },
  { code: 'ETHUSD', name: 'ETH/USD',       class: 'crypto', category: 'crypto'  },
]

export const SYMBOL_CLASS_MAP: Record<string, ContractClass> = Object.fromEntries(
  SYMBOLS_LIST.map(s => [s.code, s.class])
)

/** Outcome eşiği — forex/crypto mini gibi davranır (±$2) */
export function getOutcomeThreshold(cls: ContractClass): number {
  return cls === 'micro' ? 1 : 2
}
