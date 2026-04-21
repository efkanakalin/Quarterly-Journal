export const OUTCOME_COLORS = {
  win:        '#10b981',
  loss:       '#ef4444',
  breakeven:  '#3b82f6',
} as const

export const SYMBOL_COLORS: Record<string, string> = {
  MNQ:    '#f59e0b',
  MES:    '#3b82f6',
  MYM:    '#10b981',
  NQ:     '#f97316',
  ES:     '#8b5cf6',
  YM:     '#ec4899',
  EURUSD: '#06b6d4',
  GBPUSD: '#6366f1',
  BTCUSD: '#f59e0b',
  ETHUSD: '#64748b',
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
