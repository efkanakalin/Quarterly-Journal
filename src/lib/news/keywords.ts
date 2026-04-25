import type { SymbolFilter } from '@/types/news'

/**
 * Sentiment keyword tables.
 * To tweak: add/remove words below. Lowercase, word-boundary matched.
 */
export const POSITIVE_WORDS: string[] = [
  'beat', 'beats', 'surged', 'surge', 'rose', 'rises', 'rising',
  'rallies', 'rally', 'jumped', 'jumps', 'climbed', 'climbs',
  'gains', 'gained', 'higher', 'upgrade', 'upgraded', 'upbeat',
  'strong', 'strength', 'expands', 'expansion', 'accelerate', 'accelerates',
  'outperform', 'outperformed', 'boosted', 'boost', 'record high',
  'better than expected', 'tops estimates', 'hawkish',
]

export const NEGATIVE_WORDS: string[] = [
  'miss', 'missed', 'misses', 'fell', 'falls', 'falling', 'dropped',
  'drops', 'declined', 'declines', 'tumble', 'tumbled', 'slump',
  'slumped', 'plunge', 'plunged', 'sank', 'weaker', 'weakness',
  'downgrade', 'downgraded', 'contracts', 'contraction', 'shrinks',
  'recession', 'concerns', 'warning', 'warn', 'fears', 'fear',
  'worse than expected', 'below estimates', 'dovish',
  'crash', 'crashed', 'collapse', 'collapsed',
]

/**
 * Symbol filter → keyword groups.
 * A headline matches a filter if ANY group intersects.
 * Keep lowercase; matcher is case-insensitive and uses word boundaries.
 */
export const SYMBOL_KEYWORDS: Record<Exclude<SymbolFilter, 'all'>, string[]> = {
  nq:     ['nasdaq', 'ndx', 'nq', 'tech stocks', 'qqq', 'big tech'],
  es:     ['s&p', 'sp500', 's&p 500', 'spx', 'es futures', 'spy'],
  ym:     ['dow', 'djia', 'dow jones', 'ym futures'],
  dxy:    ['dxy', 'dollar index', 'us dollar', 'greenback'],
  gold:   ['gold', 'xauusd', 'xau/usd', 'bullion', 'precious metals'],
  oil:    ['oil', 'crude', 'wti', 'brent', 'opec'],
  fx:     ['eurusd', 'eur/usd', 'gbpusd', 'gbp/usd', 'usdjpy', 'usd/jpy',
           'audusd', 'aud/usd', 'usdcad', 'usd/cad', 'forex', 'currency pair'],
  crypto: ['bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'coinbase', 'binance'],
  fed:    ['fed', 'fomc', 'powell', 'jerome powell', 'federal reserve',
           'rate hike', 'rate cut', 'interest rate', 'hawkish', 'dovish',
           'basis points', 'bps'],
}

export const SYMBOL_LABELS: Record<SymbolFilter, string> = {
  all: 'All', nq: 'NQ', es: 'ES', ym: 'YM', dxy: 'DXY',
  gold: 'Gold', oil: 'Oil', fx: 'FX', crypto: 'Crypto', fed: 'FED',
}
