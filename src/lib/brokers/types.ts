import type { BrokerSlug } from '@/types'

export interface BrokerCatalogEntry {
  slug: BrokerSlug
  name: string
  logo: string
  available: boolean
}

export const BROKER_CATALOG: readonly BrokerCatalogEntry[] = [
  { slug: 'tradovate', name: 'Tradovate',           logo: '/brokers/tradovate.svg', available: true  },
  { slug: 'mt4',       name: 'MetaTrader 4/5',      logo: '/brokers/mt4.jpeg',      available: false },
  { slug: 'binance',   name: 'Binance',             logo: '/brokers/binance.png',   available: false },
  { slug: 'ibkr',      name: 'Interactive Brokers', logo: '/brokers/ibkr.png',      available: false },
] as const

export interface TradovateAccount {
  id: number | string
  name: string
  accountType?: string
  active?: boolean
  archived?: boolean
  legalStatus?: string
  nickname?: string | null
}

export interface TradovateTokenResponse {
  accessToken: string
  expirationTime: string  // ISO timestamp from Tradovate
  passwordExpirationTime?: string
  userStatus?: string
  userId?: number
  name?: string
  hasLive?: boolean
  outdatedTaC?: boolean
  hasFunded?: boolean
  hasMarketData?: boolean
  outdatedLiquidationPolicy?: boolean
}

/**
 * Tradovate'in `/fill/list` endpoint response item'ı.
 * Bağımsız bir buy ya da sell execution event'idir; trade'e dönüştürmek için
 * eşleştirilmesi gerekir.
 */
export interface TradovateFill {
  id: number
  orderId: number
  contractId: number
  timestamp: string  // ISO 8601 UTC, örn. "2026-04-20T20:32:08.123Z"
  tradeDate?: { year: number; month: number; day: number }
  action: 'Buy' | 'Sell'
  qty: number
  price: number
  active?: boolean
  accountId?: number
}

/**
 * Tradovate `/contract/item?id=...` cevabından gerekli alt küme.
 * Sembol stringini elde etmek için kullanırız.
 */
export interface TradovateContract {
  id: number
  name: string                  // örn. "MNQM6"
  contractMaturityId?: number
  productId?: number
}
