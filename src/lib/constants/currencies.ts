export interface CurrencyDef {
  code: string
  symbol: string
  precision: number
}

export const CURRENCIES: CurrencyDef[] = [
  { code: 'USD', symbol: '$',  precision: 2 },
  { code: 'EUR', symbol: '€',  precision: 2 },
  { code: 'GBP', symbol: '£',  precision: 2 },
  { code: 'BTC', symbol: '₿',  precision: 8 },
  { code: 'ETH', symbol: 'Ξ',  precision: 6 },
]

export const CURRENCY_MAP: Record<string, CurrencyDef> = Object.fromEntries(
  CURRENCIES.map(c => [c.code, c])
)

export function formatCurrency(amount: number, currencyCode = 'USD'): string {
  const def = CURRENCY_MAP[currencyCode] ?? CURRENCY_MAP['USD']
  const abs = Math.abs(amount)
  const formatted = abs >= 1000
    ? `${def.symbol}${(abs / 1000).toFixed(1)}K`
    : `${def.symbol}${abs.toFixed(def.precision)}`
  return amount < 0 ? `-${formatted}` : formatted
}
