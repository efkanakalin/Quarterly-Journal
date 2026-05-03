import type { ConfirmationType } from '@/types'

export interface ConfirmationDef {
  type:    ConfirmationType
  group:   'QT' | 'ICT' | 'INDICATOR' | 'VOLUME' | 'PATTERN' | 'STRUCTURE' | 'CUSTOM'
  /** Confluence'ın anlamlı bir TF'i var mı? CVD/RSI gibi indikatörler genellikle yok. */
  needsTimeframe: boolean
}

export const CONFIRMATIONS: ConfirmationDef[] = [
  // QT primitives
  { type: 'SSMT',          group: 'QT', needsTimeframe: true  },
  { type: 'ISSMT',         group: 'QT', needsTimeframe: true  },
  { type: 'HSSMT',         group: 'QT', needsTimeframe: true  },
  { type: 'PSP',           group: 'QT', needsTimeframe: true  },
  { type: 'PRC',           group: 'QT', needsTimeframe: true  },
  { type: 'SD',            group: 'QT', needsTimeframe: true  },
  { type: 'SMTF',          group: 'QT', needsTimeframe: true  },
  { type: 'PG',            group: 'QT', needsTimeframe: true  },
  { type: 'O/C',           group: 'QT', needsTimeframe: true  },
  { type: 'DFR',           group: 'QT', needsTimeframe: true  },
  { type: 'PO3',           group: 'QT', needsTimeframe: true  },
  { type: 'MMXM',          group: 'QT', needsTimeframe: true  },
  { type: 'CVD',           group: 'QT', needsTimeframe: false },
  { type: 'LIQ SWEEP',     group: 'QT', needsTimeframe: true  },
  { type: 'B2B',           group: 'QT', needsTimeframe: true  },
  { type: 'TPD',           group: 'QT', needsTimeframe: false },

  // ICT / SMC
  { type: 'BOS',           group: 'ICT', needsTimeframe: true  },
  { type: 'CHOCH',         group: 'ICT', needsTimeframe: true  },
  { type: 'MSS',           group: 'ICT', needsTimeframe: true  },
  { type: 'CISD',          group: 'ICT', needsTimeframe: true  },
  { type: 'OB',            group: 'ICT', needsTimeframe: true  },
  { type: 'BREAKER',       group: 'ICT', needsTimeframe: true  },
  { type: 'REJECTION BLOCK', group: 'ICT', needsTimeframe: true },
  { type: 'MITIGATION',    group: 'ICT', needsTimeframe: true  },
  { type: 'FVG',           group: 'ICT', needsTimeframe: true  },
  { type: 'IFVG',          group: 'ICT', needsTimeframe: true  },
  { type: 'BPR',           group: 'ICT', needsTimeframe: true  },
  { type: 'EQH',           group: 'ICT', needsTimeframe: true  },
  { type: 'EQL',           group: 'ICT', needsTimeframe: true  },
  { type: 'PREMIUM',       group: 'ICT', needsTimeframe: true  },
  { type: 'DISCOUNT',      group: 'ICT', needsTimeframe: true  },
  { type: 'PDA',           group: 'ICT', needsTimeframe: true  },
  { type: 'DOL',           group: 'ICT', needsTimeframe: false },
  { type: 'SMT',           group: 'ICT', needsTimeframe: true  },
  { type: 'OHLC',          group: 'ICT', needsTimeframe: true  },
  { type: 'OLHC',          group: 'ICT', needsTimeframe: true  },
  { type: 'KILLZONE',      group: 'ICT', needsTimeframe: false },
  { type: 'JUDAS SWING',   group: 'ICT', needsTimeframe: false },
  { type: 'SILVER BULLET', group: 'ICT', needsTimeframe: false },
  { type: 'TURTLE SOUP',   group: 'ICT', needsTimeframe: true  },

  // Indicators
  { type: 'RSI',           group: 'INDICATOR', needsTimeframe: false },
  { type: 'MACD',          group: 'INDICATOR', needsTimeframe: false },
  { type: 'EMA',           group: 'INDICATOR', needsTimeframe: true  },
  { type: 'SMA',           group: 'INDICATOR', needsTimeframe: true  },
  { type: 'VWAP',          group: 'INDICATOR', needsTimeframe: false },
  { type: 'BOLLINGER',     group: 'INDICATOR', needsTimeframe: false },
  { type: 'STOCH',         group: 'INDICATOR', needsTimeframe: false },
  { type: 'ADX',           group: 'INDICATOR', needsTimeframe: false },
  { type: 'ATR',           group: 'INDICATOR', needsTimeframe: false },
  { type: 'PIVOT',         group: 'INDICATOR', needsTimeframe: true  },

  // Volume / Order Flow
  { type: 'OBV',           group: 'VOLUME', needsTimeframe: false },
  { type: 'DELTA',         group: 'VOLUME', needsTimeframe: false },
  { type: 'FOOTPRINT',     group: 'VOLUME', needsTimeframe: true  },
  { type: 'OI',            group: 'VOLUME', needsTimeframe: false },
  { type: 'ABSORPTION',    group: 'VOLUME', needsTimeframe: true  },

  // Patterns
  { type: 'DOUBLE TOP',    group: 'PATTERN', needsTimeframe: true  },
  { type: 'DOUBLE BOTTOM', group: 'PATTERN', needsTimeframe: true  },
  { type: 'H&S',           group: 'PATTERN', needsTimeframe: true  },
  { type: 'TRIANGLE',      group: 'PATTERN', needsTimeframe: true  },
  { type: 'WEDGE',         group: 'PATTERN', needsTimeframe: true  },
  { type: 'FLAG',          group: 'PATTERN', needsTimeframe: true  },
  { type: 'PENNANT',       group: 'PATTERN', needsTimeframe: true  },
  { type: 'PINBAR',        group: 'PATTERN', needsTimeframe: true  },
  { type: 'ENGULFING',     group: 'PATTERN', needsTimeframe: true  },
  { type: 'DOJI',          group: 'PATTERN', needsTimeframe: true  },

  // Structure
  { type: 'TRENDLINE',     group: 'STRUCTURE', needsTimeframe: true  },
  { type: 'SUPPORT',       group: 'STRUCTURE', needsTimeframe: true  },
  { type: 'RESISTANCE',    group: 'STRUCTURE', needsTimeframe: true  },
  { type: 'FIBONACCI',     group: 'STRUCTURE', needsTimeframe: true  },
]

export const CONFIRMATION_GROUP_LABELS: Record<ConfirmationDef['group'], string> = {
  QT:        'Quarterly Theory',
  ICT:       'ICT / SMC',
  INDICATOR: 'Indicators',
  VOLUME:    'Volume / Order Flow',
  PATTERN:   'Patterns',
  STRUCTURE: 'Structure',
  CUSTOM:    'Custom',
}

export const CONFIRMATION_GROUP_LABELS_TR: Record<ConfirmationDef['group'], string> = {
  QT:        'Quarterly Theory',
  ICT:       'ICT / SMC',
  INDICATOR: 'İndikatörler',
  VOLUME:    'Hacim / Order Flow',
  PATTERN:   'Formasyonlar',
  STRUCTURE: 'Yapı',
  CUSTOM:    'Özel',
}

/** Default — all QT confluences enabled out of the box. */
export const DEFAULT_ENABLED_CONFIRMATIONS: ConfirmationType[] =
  CONFIRMATIONS.filter(c => c.group === 'QT').map(c => c.type)

export const CONFIRMATION_TYPES: ConfirmationType[] = CONFIRMATIONS.map(c => c.type)

/** Confluence rengi — yeni eklenenler için palet uzatıldı. */
export const CONFIRMATION_COLORS: Record<ConfirmationType, string> = {
  // QT
  'SSMT':            '#f59e0b',
  'PSP':             '#3b82f6',
  'PRC':             '#8b5cf6',
  'SD':              '#10b981',
  'SMTF':            '#f97316',
  'PG':              '#06b6d4',
  'O/C':             '#ec4899',
  'DFR':             '#84cc16',
  'PO3':             '#14b8a6',
  'MMXM':            '#ef4444',
  'CVD':             '#f43f5e',
  'LIQ SWEEP':       '#64748b',
  'ISSMT':           '#d97706',
  'HSSMT':           '#0ea5e9',
  'B2B':             '#fbbf24',
  'TPD':             '#a3e635',
  // ICT / SMC
  'BOS':             '#22d3ee',
  'CHOCH':           '#fb7185',
  'MSS':             '#f472b6',
  'CISD':            '#c084fc',
  'OB':              '#a78bfa',
  'BREAKER':         '#fb923c',
  'REJECTION BLOCK': '#ef4444',
  'MITIGATION':      '#facc15',
  'FVG':             '#a855f7',
  'IFVG':            '#bef264',
  'BPR':             '#fde68a',
  'EQH':             '#34d399',
  'EQL':             '#f87171',
  'PREMIUM':         '#c084fc',
  'DISCOUNT':        '#7dd3fc',
  'PDA':             '#fcd34d',
  'DOL':             '#fda4af',
  'SMT':             '#fb923c',
  'OHLC':            '#86efac',
  'OLHC':            '#fdba74',
  'KILLZONE':        '#fda4af',
  'JUDAS SWING':     '#facc15',
  'SILVER BULLET':   '#cbd5e1',
  'TURTLE SOUP':     '#86efac',
  // Indicators
  'RSI':             '#60a5fa',
  'MACD':            '#a3e635',
  'EMA':             '#fbbf24',
  'SMA':             '#fb923c',
  'VWAP':            '#94a3b8',
  'BOLLINGER':       '#c084fc',
  'STOCH':           '#22d3ee',
  'ADX':             '#fde047',
  'ATR':             '#94a3b8',
  'PIVOT':           '#67e8f9',
  // Volume
  'OBV':             '#a3e635',
  'DELTA':           '#fb7185',
  'FOOTPRINT':       '#818cf8',
  'OI':              '#fdba74',
  'ABSORPTION':      '#f472b6',
  // Patterns
  'DOUBLE TOP':      '#f87171',
  'DOUBLE BOTTOM':   '#34d399',
  'H&S':             '#fb923c',
  'TRIANGLE':        '#a78bfa',
  'WEDGE':           '#fbbf24',
  'FLAG':            '#60a5fa',
  'PENNANT':         '#94a3b8',
  'PINBAR':          '#22d3ee',
  'ENGULFING':       '#84cc16',
  'DOJI':            '#94a3b8',
  // Structure
  'TRENDLINE':       '#9ca3af',
  'SUPPORT':         '#34d399',
  'RESISTANCE':      '#f87171',
  'FIBONACCI':       '#fbbf24',
}

export const CONFIRMATION_NEEDS_TIMEFRAME: Record<ConfirmationType, boolean> =
  Object.fromEntries(CONFIRMATIONS.map(c => [c.type, c.needsTimeframe])) as Record<ConfirmationType, boolean>
