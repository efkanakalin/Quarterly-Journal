import type { Timeframe } from '@/types'

/** UI'da gösterim sırası — küçükten büyüğe (TradingView gibi). */
export const TIMEFRAMES: Timeframe[] = [
  '5S', '15S', '30S', '45S',
  '1M', '2M', '3M', '5M', '10M', '15M', '30M', '45M', '90M',
  '1H', '2H', '3H', '4H', '6H',
  '1D', '1W',
  '1Mo', '3Mo',
]

/** Sıralama indeksi — büyük TF sona (sortByTimeframe için).
 *  Confluence chip'leri büyükten küçüğe sıralanır. */
const TF_RANK: Record<Timeframe, number> = {
  '3Mo': 0,  '1Mo': 1,
  '1W':  2,  '1D':  3,
  '6H':  4,  '4H':  5,  '3H':  6,  '2H':  7,  '1H':  8,
  '90M': 9,  '45M': 10, '30M': 11, '15M': 12, '10M': 13,
  '5M':  14, '3M':  15, '2M':  16, '1M':  17,
  '45S': 18, '30S': 19, '15S': 20, '5S': 21,
}

/** Confluences'ı büyük TF'den küçüğe sıralar. TF yoksa sona koyar. */
export function sortByTimeframe<T extends { timeframe: Timeframe | null }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ra = a.timeframe ? TF_RANK[a.timeframe] ?? 99 : 100
    const rb = b.timeframe ? TF_RANK[b.timeframe] ?? 99 : 100
    return ra - rb
  })
}
