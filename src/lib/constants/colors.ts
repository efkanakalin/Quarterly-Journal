export const OUTCOME_COLORS = {
  win:        '#10b981',
  loss:       '#ef4444',
  breakeven:  '#3b82f6',
} as const

export const SYMBOL_COLORS: Record<string, string> = {
  // Index futures
  MNQ:     '#f59e0b',
  MES:     '#3b82f6',
  MYM:     '#10b981',
  M2K:     '#fbbf24',
  NQ:      '#f97316',
  ES:      '#8b5cf6',
  YM:      '#ec4899',
  RTY:     '#a855f7',
  // Commodities
  CL:      '#facc15',
  GC:      '#fde047',
  SI:      '#cbd5e1',
  HG:      '#fb923c',
  NG:      '#22d3ee',
  MGC:     '#fde047',
  MCL:     '#facc15',
  // Bonds
  ZN:      '#94a3b8',
  ZB:      '#64748b',
  // Forex
  EURUSD:  '#06b6d4',
  GBPUSD:  '#6366f1',
  USDJPY:  '#fb7185',
  AUDUSD:  '#34d399',
  NZDUSD:  '#84cc16',
  USDCAD:  '#fb923c',
  USDCHF:  '#a3a3a3',
  EURJPY:  '#a855f7',
  GBPJPY:  '#fbbf24',
  EURGBP:  '#22d3ee',
  XAUUSD:  '#facc15',
  // Crypto
  BTCUSD:  '#f59e0b',
  ETHUSD:  '#64748b',
  SOLUSD:  '#a855f7',
  XRPUSD:  '#22d3ee',
  ADAUSD:  '#3b82f6',
  DOGEUSD: '#fbbf24',
  // Index CFDs
  SPX500:  '#8b5cf6',
  NAS100:  '#f97316',
  DE40:    '#fbbf24',
  UK100:   '#fb7185',
  JP225:   '#ef4444',
}

export const SESSION_COLORS = {
  asia:    '#64748b',
  london:  '#6366f1',
  ny_am:   '#10b981',
  ny_pm:   '#3b82f6',
} as const

export const SESSION_LABELS = {
  asia:   'Asia',
  london: 'London',
  ny_am:  'NY AM',
  ny_pm:  'NY PM',
} as const
