export type Sentiment = 'positive' | 'negative' | 'neutral'

export type SymbolFilter =
  | 'all' | 'nq' | 'es' | 'ym' | 'dxy' | 'gold' | 'oil' | 'fx' | 'crypto' | 'fed'

export interface NewsItem {
  id:         string          // stable hash of (published_at + title)
  title:      string
  source:     string          // "Financial Juice"
  link:       string | null
  publishedAt: string         // ISO
  sentiment:  Sentiment
  symbols:    SymbolFilter[]  // matched filters (excluding 'all')
  important:  boolean         // başlıktan türetilmiş yüksek-etki sinyali
}

export type Impact = 'high' | 'medium' | 'low' | 'holiday'

export interface CalendarEvent {
  id:       string
  time:     string | null     // ISO; null = "All day"
  currency: string            // "USD", "EUR", ...
  title:    string            // "Core CPI m/m"
  impact:   Impact
  forecast: string | null
  previous: string | null
  actual:   string | null
}

export interface EconRelease {
  id:              string
  title:           string             // e.g. "Core CPI m/m"
  country:         string             // ISO like "US"
  actual:          number | null
  previous:        number | null
  forecast:        number | null
  unit:            string
  referenceDate:   string             // ISO
  releasedAt:      string             // ISO — actual publish time
  impact:          'high' | 'medium' | 'low'
  beatExpectation: 'beat' | 'miss' | 'inline' | 'unknown'
  changePct:       number | null
}

export interface AlarmPrefs {
  soundEnabled:   boolean
  sound:          'chime' | 'ping' | 'bell'
  volume:         number              // 0..1
  desktopEnabled: boolean
  notifyHighImpactMinutes: number     // default 5
}
