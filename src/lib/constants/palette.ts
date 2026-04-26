// Pastel, uyumlu badge paleti — light+dark className çiftleri.
// Yumuşak arka plan + koyu okunur metin. Grafiklerde ayrıca hex kullanılıyor;
// bu dosya yalnızca badge/chip görselleri içindir.

export type PaletteKey =
  | 'amber' | 'blue' | 'emerald' | 'orange' | 'violet' | 'pink'
  | 'cyan' | 'indigo' | 'slate' | 'red' | 'rose' | 'teal'
  | 'sky' | 'purple' | 'lime'

// Yumuşak pastel paleti — confluence chip'lerinde kullanılır.
// Daha düşük kontrastlı text (600 / 200) ve %8-10 arka plan ile neon hissinden uzak.
export const BADGE_CLASS: Record<PaletteKey, string> = {
  amber:   'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-200',
  blue:    'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-200',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-200',
  orange:  'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-200',
  violet:  'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-200',
  pink:    'bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-200',
  cyan:    'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-200',
  indigo:  'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-200',
  slate:   'bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-200',
  red:     'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-200',
  rose:    'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-200',
  teal:    'bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-200',
  sky:     'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-200',
  purple:  'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-200',
  lime:    'bg-lime-50 text-lime-600 dark:bg-lime-500/10 dark:text-lime-200',
}

export const SYMBOL_PALETTE: Record<string, PaletteKey> = {
  // Index futures
  MNQ:     'amber',
  MES:     'blue',
  MYM:     'emerald',
  M2K:     'amber',
  NQ:      'orange',
  ES:      'violet',
  YM:      'pink',
  RTY:     'purple',
  // Commodities
  CL:      'amber',
  GC:      'amber',
  SI:      'slate',
  HG:      'orange',
  NG:      'cyan',
  MGC:     'amber',
  MCL:     'amber',
  // Bonds
  ZN:      'slate',
  ZB:      'slate',
  // Forex
  EURUSD:  'cyan',
  GBPUSD:  'indigo',
  USDJPY:  'rose',
  AUDUSD:  'emerald',
  NZDUSD:  'lime',
  USDCAD:  'orange',
  USDCHF:  'slate',
  EURJPY:  'purple',
  GBPJPY:  'amber',
  EURGBP:  'cyan',
  XAUUSD:  'amber',
  // Crypto
  BTCUSD:  'amber',
  ETHUSD:  'slate',
  SOLUSD:  'purple',
  XRPUSD:  'cyan',
  ADAUSD:  'blue',
  DOGEUSD: 'amber',
  // Index CFDs
  SPX500:  'violet',
  NAS100:  'orange',
  DE40:    'amber',
  UK100:   'rose',
  JP225:   'red',
}

export const OUTCOME_PALETTE = {
  win:       'emerald',
  loss:      'rose',
  breakeven: 'blue',
} as const

export const SESSION_PALETTE = {
  asia:   'slate',
  london: 'indigo',
  ny_am:  'emerald',
  ny_pm:  'blue',
} as const

export const CONFIRMATION_PALETTE: Record<string, PaletteKey> = {
  // QT
  'SSMT':            'amber',
  'PSP':             'blue',
  'PRC':             'violet',
  'SD':              'emerald',
  'SMTF':            'orange',
  'PG':              'cyan',
  'O/C':             'pink',
  'DFR':             'lime',
  'PO3':             'teal',
  'MMXM':            'red',
  'CVD':             'rose',
  'LIQ SWEEP':       'slate',
  'ISSMT':           'amber',
  'HSSMT':           'sky',
  'B2B':             'amber',
  'TPD':             'lime',
  // ICT / SMC
  'BOS':             'cyan',
  'CHOCH':           'rose',
  'MSS':             'pink',
  'CISD':            'purple',
  'OB':              'violet',
  'BREAKER':         'orange',
  'REJECTION BLOCK': 'red',
  'MITIGATION':      'amber',
  'FVG':             'purple',
  'IFVG':            'lime',
  'BPR':             'amber',
  'EQH':             'emerald',
  'EQL':             'red',
  'PREMIUM':         'purple',
  'DISCOUNT':        'sky',
  'PDA':             'amber',
  'DOL':             'pink',
  'SMT':             'orange',
  'OHLC':            'emerald',
  'OLHC':            'orange',
  'KILLZONE':        'pink',
  'JUDAS SWING':     'amber',
  'SILVER BULLET':   'slate',
  'TURTLE SOUP':     'emerald',
  // Indicators
  'RSI':           'blue',
  'MACD':          'lime',
  'EMA':           'amber',
  'SMA':           'orange',
  'VWAP':          'slate',
  'BOLLINGER':     'purple',
  'STOCH':         'cyan',
  'ADX':           'amber',
  'ATR':           'slate',
  'PIVOT':         'sky',
  // Volume
  'OBV':           'lime',
  'DELTA':         'rose',
  'FOOTPRINT':     'indigo',
  'OI':            'orange',
  'ABSORPTION':    'pink',
  // Patterns
  'DOUBLE TOP':    'red',
  'DOUBLE BOTTOM': 'emerald',
  'H&S':           'orange',
  'TRIANGLE':      'violet',
  'WEDGE':         'amber',
  'FLAG':          'blue',
  'PENNANT':       'slate',
  'PINBAR':        'cyan',
  'ENGULFING':     'lime',
  'DOJI':          'slate',
  // Structure
  'TRENDLINE':     'slate',
  'SUPPORT':       'emerald',
  'RESISTANCE':    'red',
  'FIBONACCI':     'amber',
}
