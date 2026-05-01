/**
 * Tradovate API ile haberleşmeyi sarmalayan ince katman.
 * Tüm CORS engelini Worker'da bypass ediyoruz; client_secret burada kalır,
 * frontend'e asla görünmez.
 *
 * Endpoints we hit (Tradovate v1):
 *   POST /auth/oauthtoken          — exchange OAuth code for access_token
 *   POST /auth/renewaccesstoken    — renew before 80-min expiry
 *   GET  /account/list             — list user accounts
 *   GET  /fill/list                — list fills (no date filter on server,
 *                                    we filter client-side after fetch)
 *   GET  /contract/items?ids=...   — bulk contract metadata for symbol resolution
 */

export interface Env {
  TRADOVATE_API_BASE:      string
  TRADOVATE_DEMO_API_BASE: string
  SUPABASE_JWT_SECRET:     string
  ALLOWED_ORIGIN:          string
}

interface TradovateError {
  errorText?: string
  'p-ticket'?: string
  'p-time'?: number
  'p-captcha'?: boolean
}

async function tradovateFetch<T>(
  base: string,
  path: string,
  init: RequestInit & { accessToken?: string } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...((init.headers as Record<string, string>) ?? {}),
  }
  if (init.accessToken) {
    headers.Authorization = `Bearer ${init.accessToken}`
  }

  const res = await fetch(`${base}${path}`, {
    ...init,
    headers,
  })

  const text = await res.text()
  let body: unknown = null
  try { body = text ? JSON.parse(text) : null } catch { body = text }

  if (!res.ok) {
    const errBody = (body ?? {}) as TradovateError
    const msg = errBody.errorText ?? text ?? `HTTP ${res.status}`
    const err = new Error(`Tradovate ${res.status}: ${msg}`) as Error & { status?: number }
    err.status = res.status
    throw err
  }
  return body as T
}

export interface TradovateTokenResponse {
  accessToken:    string
  expirationTime: string
  passwordExpirationTime?: string
  userStatus?: string
  userId?: number
  name?: string
  hasLive?: boolean
  hasFunded?: boolean
}

/**
 * Tradovate'in renew akışı: mevcut access token ile `/auth/renewaccesstoken`
 * çağrılır, yeni access token döner. "Refresh token" diye ayrı bir token
 * yok — frontend tarafında "refresh_token" kolonu, renew için kullanılan
 * token'ı saklar (ki Tradovate için bu access_token'ın kendisidir).
 */
export async function renewAccessToken(
  env: Env,
  currentAccessToken: string,
): Promise<TradovateTokenResponse> {
  return tradovateFetch<TradovateTokenResponse>(env.TRADOVATE_API_BASE, '/auth/renewaccesstoken', {
    method:      'GET',
    accessToken: currentAccessToken,
  })
}

export interface TradovateAccount {
  id:          number
  name:        string
  accountType: string
  active:      boolean
  archived:    boolean
  legalStatus: string
  nickname?:   string | null
}

export async function listAccounts(env: Env, accessToken: string): Promise<TradovateAccount[]> {
  return tradovateFetch<TradovateAccount[]>(env.TRADOVATE_API_BASE, '/account/list', {
    method: 'GET',
    accessToken,
  })
}

export interface TradovateFill {
  id: number
  orderId: number
  contractId: number
  timestamp: string
  tradeDate?: { year: number; month: number; day: number }
  action: 'Buy' | 'Sell'
  qty: number
  price: number
  active?: boolean
  accountId?: number
}

export interface TradovateContract {
  id: number
  name: string
  contractMaturityId?: number
  productId?: number
}

/**
 * Tradovate'in `/fill/list` endpoint'i tüm fill'leri döner; tarihe göre
 * client-side filter uygularız. Account_id ile de filter ederiz.
 */
export async function listFills(
  env: Env,
  accessToken: string,
  accountId: number,
  fromIso: string,
  toIso: string,
): Promise<{ fills: TradovateFill[]; contracts: TradovateContract[] }> {
  const all = await tradovateFetch<TradovateFill[]>(env.TRADOVATE_API_BASE, '/fill/list', {
    method: 'GET',
    accessToken,
  })

  const fromMs = new Date(fromIso).getTime()
  const toMs   = new Date(toIso).getTime()

  const fills = all.filter(f => {
    if (f.accountId !== undefined && f.accountId !== accountId) return false
    const ts = new Date(f.timestamp).getTime()
    return ts >= fromMs && ts <= toMs
  })

  const contractIds = Array.from(new Set(fills.map(f => f.contractId)))
  let contracts: TradovateContract[] = []
  if (contractIds.length > 0) {
    contracts = await tradovateFetch<TradovateContract[]>(
      env.TRADOVATE_API_BASE,
      `/contract/items?ids=${contractIds.join(',')}`,
      { method: 'GET', accessToken },
    )
  }

  return { fills, contracts }
}
