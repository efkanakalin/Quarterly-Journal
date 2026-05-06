import { supabase } from '@/lib/supabase'
import type { TradovateAccount } from './types'


const WORKER_URL = (import.meta.env.VITE_TRADOVATE_WORKER_URL as string | undefined)?.replace(/\/$/, '')

/**
 * Tradovate entegrasyonu için sadece tek bir env zorunlu: worker URL.
 * Client_id/secret yok — kullanıcı Tradovate'ten kendi access token'ını
 * alıp manuel olarak yapıştırıyor; worker bu token'ı sadece CORS için
 * proxy'liyor.
 */
export function isTradovateConfigured(): boolean {
  return Boolean(WORKER_URL)
}

function ensureWorker(): string {
  if (!WORKER_URL) throw new Error('tradovate_not_configured')
  return WORKER_URL
}

async function workerFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const workerUrl = ensureWorker()
  const { data } = await supabase.auth.getSession()
  const accessToken = data.session?.access_token
  if (!accessToken) throw new Error('Not authenticated')

  const res = await fetch(`${workerUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type':  'application/json',
      Authorization:   `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
  })

  if (!res.ok) {
    let errBody: { error?: string } = {}
    try { errBody = await res.json() } catch { /* keep empty */ }
    if (res.status === 429) throw new Error('rate_limited')
    if (res.status === 401) throw new Error('invalid_token')
    throw new Error(errBody.error ?? `Worker error ${res.status}`)
  }

  return res.json() as Promise<T>
}

/**
 * Mevcut Tradovate access token'ını yenileyerek yeni bir token döner.
 * Tradovate'te ayrı refresh token YOKTUR: /renewaccesstoken çağrısı
 * mevcut access token ile yapılır ve yeni access token döner. Bu nedenle
 * persist tarafında hem access_token hem refresh_token kolonu yenilenmiş
 * token olur.
 */
export async function refreshAccessToken(currentAccessToken: string) {
  return workerFetch<{ accessToken: string; expirationTime: string }>('/tradovate/refresh-token', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: currentAccessToken }),
  })
}

export async function listAccounts(accessToken: string): Promise<TradovateAccount[]> {
  return workerFetch<TradovateAccount[]>('/tradovate/accounts', {
    method: 'POST',
    body: JSON.stringify({ tradovate_access_token: accessToken }),
  })
}

export interface FetchFillsArgs {
  tradovateAccessToken: string
  accountId: string
  from: string
  to: string
}

export async function fetchFills(args: FetchFillsArgs) {
  return workerFetch<{ fills: import('./types').TradovateFill[]; contracts: import('./types').TradovateContract[] }>('/tradovate/fills', {
    method: 'POST',
    body: JSON.stringify({
      tradovate_access_token: args.tradovateAccessToken,
      account_id: args.accountId,
      from: args.from,
      to: args.to,
    }),
  })
}

/**
 * Tradovate ortamı için access token'ın geçerlilik süresi doğrudan
 * /renewaccesstoken sonucunda dönen `expirationTime` alanından alınır;
 * fallback olarak şimdiden 75 dakika sonrası kullanılır (Tradovate
 * access token ömrü ~80 dk; 5 dk buffer).
 */
export function defaultTokenExpiry(): string {
  return new Date(Date.now() + 75 * 60 * 1000).toISOString()
}
