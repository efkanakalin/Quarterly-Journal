export type ContractClass = 'micro' | 'mini' | 'forex' | 'crypto'

export interface SymbolDef {
  code: string
  name: string
  class: ContractClass
  category: 'futures' | 'forex' | 'crypto' | 'commodity' | 'index'
}

export const SYMBOLS_LIST: SymbolDef[] = [
  // Index futures
  { code: 'MNQ',    name: 'Micro Nasdaq',  class: 'micro',  category: 'futures'   },
  { code: 'MES',    name: 'Micro S&P',     class: 'micro',  category: 'futures'   },
  { code: 'MYM',    name: 'Micro Dow',     class: 'micro',  category: 'futures'   },
  { code: 'M2K',    name: 'Micro Russell', class: 'micro',  category: 'futures'   },
  { code: 'NQ',     name: 'Nasdaq',        class: 'mini',   category: 'futures'   },
  { code: 'ES',     name: 'S&P',           class: 'mini',   category: 'futures'   },
  { code: 'YM',     name: 'Dow',           class: 'mini',   category: 'futures'   },
  { code: 'RTY',    name: 'Russell 2000',  class: 'mini',   category: 'futures'   },

  // Commodity futures
  { code: 'CL',     name: 'Crude Oil',     class: 'mini',   category: 'commodity' },
  { code: 'GC',     name: 'Gold',          class: 'mini',   category: 'commodity' },
  { code: 'SI',     name: 'Silver',        class: 'mini',   category: 'commodity' },
  { code: 'HG',     name: 'Copper',        class: 'mini',   category: 'commodity' },
  { code: 'NG',     name: 'Natural Gas',   class: 'mini',   category: 'commodity' },
  { code: 'MGC',    name: 'Micro Gold',    class: 'micro',  category: 'commodity' },
  { code: 'MCL',    name: 'Micro Crude',   class: 'micro',  category: 'commodity' },

  // Bonds
  { code: 'ZN',     name: '10Y Note',      class: 'mini',   category: 'futures'   },
  { code: 'ZB',     name: '30Y Bond',      class: 'mini',   category: 'futures'   },

  // Forex
  { code: 'EURUSD', name: 'EUR/USD',       class: 'forex',  category: 'forex'     },
  { code: 'GBPUSD', name: 'GBP/USD',       class: 'forex',  category: 'forex'     },
  { code: 'USDJPY', name: 'USD/JPY',       class: 'forex',  category: 'forex'     },
  { code: 'AUDUSD', name: 'AUD/USD',       class: 'forex',  category: 'forex'     },
  { code: 'NZDUSD', name: 'NZD/USD',       class: 'forex',  category: 'forex'     },
  { code: 'USDCAD', name: 'USD/CAD',       class: 'forex',  category: 'forex'     },
  { code: 'USDCHF', name: 'USD/CHF',       class: 'forex',  category: 'forex'     },
  { code: 'EURJPY', name: 'EUR/JPY',       class: 'forex',  category: 'forex'     },
  { code: 'GBPJPY', name: 'GBP/JPY',       class: 'forex',  category: 'forex'     },
  { code: 'EURGBP', name: 'EUR/GBP',       class: 'forex',  category: 'forex'     },
  { code: 'XAUUSD', name: 'Gold (spot)',   class: 'forex',  category: 'forex'     },

  // Crypto
  { code: 'BTCUSD', name: 'BTC/USD',       class: 'crypto', category: 'crypto'    },
  { code: 'ETHUSD', name: 'ETH/USD',       class: 'crypto', category: 'crypto'    },
  { code: 'SOLUSD', name: 'SOL/USD',       class: 'crypto', category: 'crypto'    },
  { code: 'XRPUSD', name: 'XRP/USD',       class: 'crypto', category: 'crypto'    },
  { code: 'ADAUSD', name: 'ADA/USD',       class: 'crypto', category: 'crypto'    },
  { code: 'DOGEUSD',name: 'DOGE/USD',      class: 'crypto', category: 'crypto'    },

  // Index CFDs
  { code: 'SPX500', name: 'S&P 500 CFD',   class: 'mini',   category: 'index'     },
  { code: 'NAS100', name: 'Nasdaq 100 CFD',class: 'mini',   category: 'index'     },
  { code: 'DE40',   name: 'DAX 40',        class: 'mini',   category: 'index'     },
  { code: 'UK100',  name: 'FTSE 100',      class: 'mini',   category: 'index'     },
  { code: 'JP225',  name: 'Nikkei 225',    class: 'mini',   category: 'index'     },
]

export const SYMBOL_CLASS_MAP: Record<string, ContractClass> = Object.fromEntries(
  SYMBOLS_LIST.map(s => [s.code, s.class])
)

/** Outcome eşiği — forex/crypto mini gibi davranır (±$2) */
export function getOutcomeThreshold(cls: ContractClass): number {
  return cls === 'micro' ? 1 : 2
}

export const SYMBOL_CATEGORY_LABELS: Record<SymbolDef['category'], string> = {
  futures:   'Index Futures',
  commodity: 'Commodities',
  forex:     'Forex',
  crypto:    'Crypto',
  index:     'Index CFDs',
}

/** Default — common QT setup symbols enabled out of the box. */
export const DEFAULT_ENABLED_SYMBOLS: string[] = ['MNQ', 'MES', 'NQ', 'ES']
