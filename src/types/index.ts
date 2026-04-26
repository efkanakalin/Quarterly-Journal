export type Outcome = 'win' | 'loss' | 'breakeven'
export type Session = 'asia' | 'london' | 'ny_am' | 'ny_pm'
export type SessionQuarter = 'Q1' | 'Q2' | 'Q3' | 'Q4'
export type Direction = 'long' | 'short'
export type ContractClass = 'micro' | 'mini'
export type Source = 'csv' | 'manual'
export type Timeframe = '1M' | '5M' | '15M' | '30M' | '45M' | '90M' | '1H' | '4H' | '6H' | '1D' | '1W'

export type ConfirmationType =
  // QT primitives
  | 'SSMT' | 'PSP' | 'PRC' | 'SD' | 'SMTF' | 'PG'
  | 'O/C' | 'DFR' | 'FVG' | 'PO3' | 'MMXM' | 'CVD'
  | 'LIQ SWEEP' | 'ISSMT' | 'HSSMT'
  // ICT / SMC
  | 'BOS' | 'CHOCH' | 'OB' | 'BREAKER' | 'MITIGATION'
  | 'EQH' | 'EQL' | 'PREMIUM' | 'DISCOUNT' | 'KILLZONE'
  | 'IFVG' | 'BPR' | 'TURTLE SOUP'
  // Indicators
  | 'RSI' | 'MACD' | 'EMA' | 'SMA' | 'VWAP'
  | 'BOLLINGER' | 'STOCH' | 'ADX' | 'ATR' | 'PIVOT'
  // Volume / Order Flow
  | 'OBV' | 'DELTA' | 'FOOTPRINT' | 'OI' | 'ABSORPTION'
  // Patterns
  | 'DOUBLE TOP' | 'DOUBLE BOTTOM' | 'H&S' | 'TRIANGLE'
  | 'WEDGE' | 'FLAG' | 'PENNANT' | 'PINBAR' | 'ENGULFING' | 'DOJI'
  // Structure
  | 'TRENDLINE' | 'SUPPORT' | 'RESISTANCE' | 'FIBONACCI'

export type MistakeType =
  | 'Bias/Narrative Tersi İşlem'
  | 'Dar Stop Mesafesi'
  | 'Yetersiz Konfirme'
  | 'FOMO'
  | 'İntikam İşlemi'

export interface Trade {
  id: string
  user_id: string

  // CSV fields
  symbol_raw: string | null
  symbol: string | null
  contract_class: ContractClass | null
  direction: Direction | null
  qty: number | null
  entry_price: number | null
  exit_price: number | null
  entry_time_et: string | null
  exit_time_et: string | null
  pnl_usd: number | null
  duration_sec: number | null

  // Derived
  session: Session | null
  day_of_week: number | null
  session_quarter: SessionQuarter | null
  micro_quarter_90m: SessionQuarter | null
  week_of_year: number | null
  month_quarter: string | null
  year_quarter: string | null
  outcome: Outcome | null

  // Manual fields
  r_multiple: number | null
  chart_link: string | null
  notes: string | null

  // Meta
  currency: string
  source: Source
  is_complete: boolean
  csv_fingerprint: string | null
  created_at: string
  updated_at: string
}

export interface TradeConfirmation {
  id: string
  trade_id: string
  confirmation_type: ConfirmationType
  timeframe: Timeframe | null
  created_at: string
}

export interface TradeMistake {
  id: string
  trade_id: string
  mistake_type: MistakeType
  created_at: string
}

export interface TradeWithRelations extends Trade {
  trade_confirmations: TradeConfirmation[]
  trade_mistakes: TradeMistake[]
}

export interface CsvRow {
  symbol: string
  _priceFormat: string
  _priceFormatType: string
  _tickSize: string
  buyFillId: string
  sellFillId: string
  qty: string
  buyPrice: string
  sellPrice: string
  pnl: string
  boughtTimestamp: string
  soldTimestamp: string
  duration: string
}

export interface ImportResult {
  imported: number
  skipped: number
}
