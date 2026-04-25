import { NEGATIVE_WORDS, POSITIVE_WORDS, SYMBOL_KEYWORDS } from './keywords'
import type { Sentiment, SymbolFilter } from '@/types/news'

const escapeRe = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const buildMatcher = (words: string[]) =>
  new RegExp(`(?:^|\\W)(?:${words.map(escapeRe).join('|')})(?:$|\\W)`, 'i')

const POS_RE = buildMatcher(POSITIVE_WORDS)
const NEG_RE = buildMatcher(NEGATIVE_WORDS)

export function scoreSentiment(text: string): Sentiment {
  const t = text.toLowerCase()
  const pos = POS_RE.test(t)
  const neg = NEG_RE.test(t)
  if (pos && !neg) return 'positive'
  if (neg && !pos) return 'negative'
  return 'neutral'
}

const SYMBOL_MATCHERS: Record<Exclude<SymbolFilter, 'all'>, RegExp> =
  Object.fromEntries(
    (Object.entries(SYMBOL_KEYWORDS) as [Exclude<SymbolFilter, 'all'>, string[]][])
      .map(([k, words]) => [k, buildMatcher(words)]),
  ) as Record<Exclude<SymbolFilter, 'all'>, RegExp>

export function matchSymbols(text: string): SymbolFilter[] {
  const hits: SymbolFilter[] = []
  for (const [key, re] of Object.entries(SYMBOL_MATCHERS)) {
    if (re.test(text)) hits.push(key as SymbolFilter)
  }
  return hits
}

export function matchesFilter(
  symbols: SymbolFilter[],
  active: SymbolFilter,
): boolean {
  if (active === 'all') return true
  return symbols.includes(active)
}
