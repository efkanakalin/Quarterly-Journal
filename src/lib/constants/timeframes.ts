import type { Timeframe } from '@/types'

/** UI'da gösterim sırası — küçükten büyüğe (TradingView gibi). */
export const TIMEFRAMES: Timeframe[] = [
  '30S', '45S',
  '1M', '2M', '3M', '5M', '10M', '15M', '30M', '45M', '90M',
  '1H', '2H', '3H', '4H', '6H',
  '1D', '1W',
  '1Mo', '3Mo', '6Mo',
]

/** Sıralama indeksi — büyük TF sona (sortByTimeframe için).
 *  Confluence chip'leri büyükten küçüğe sıralanır. */
const TF_RANK: Record<Timeframe, number> = {
  '6Mo': 0,  '3Mo': 1,  '1Mo': 2,
  '1W':  3,  '1D':  4,
  '6H':  5,  '4H':  6,  '3H':  7,  '2H':  8,  '1H':  9,
  '90M': 10, '45M': 11, '30M': 12, '15M': 13, '10M': 14,
  '5M':  15, '3M':  16, '2M':  17, '1M':  18,
  '45S': 19, '30S': 20,
}

/** Confluences'ı büyük TF'den küçüğe sıralar. TF yoksa sona koyar. */
export function sortByTimeframe<T extends { timeframe: Timeframe | null }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ra = a.timeframe ? TF_RANK[a.timeframe] ?? 99 : 100
    const rb = b.timeframe ? TF_RANK[b.timeframe] ?? 99 : 100
    return ra - rb
  })
}
