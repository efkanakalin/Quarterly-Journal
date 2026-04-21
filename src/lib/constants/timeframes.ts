import type { Timeframe } from '@/types'

export const TIMEFRAMES: Timeframe[] = [
  '1M', '5M', '15M', '30M', '45M', '90M', '1H', '4H', '6H', '1D', '1W',
]

/** Büyük TF'den küçüğe sıralama indeksi (0 = en büyük = 1W) */
const TF_RANK: Record<Timeframe, number> = {
  '1W': 0, '1D': 1, '6H': 2, '4H': 3, '1H': 4,
  '90M': 5, '45M': 6, '30M': 7, '15M': 8, '5M': 9, '1M': 10,
}

/** Confluences'ı büyük TF'den küçüğe sıralar */
export function sortByTimeframe<T extends { timeframe: Timeframe }>(items: T[]): T[] {
  return [...items].sort((a, b) => (TF_RANK[a.timeframe] ?? 99) - (TF_RANK[b.timeframe] ?? 99))
}
