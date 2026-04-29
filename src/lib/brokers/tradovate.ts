import { supabase } from '@/lib/supabase'
import type { TradovateAccount, TradovateTokenResponse } from './types'

const WORKER_URL  = (import.meta.env.VITE_TRADOVATE_WORKER_URL as string | undefined)?.replace(/\/$/, '')
const CLIENT_ID   = import.meta.env.VITE_TRADOVATE_CLIENT_ID as string | undefined
const REDIRECT_URI = `${window.location.origin}/brokers/tradovate/callback`
const STATE_KEY   = 'qt-tradovate-oauth-state'

export const TRADOVATE_OAUTH_STATE_KEY = STATE_KEY

/**
 * Frontend deploy'unda Tradovate entegrasyonu için gerekli env'lerin
 * (worker URL + client id) tanımlanıp tanımlanmadığını döner. UI bu
 * bayrağa bakarak Connect butonunu disable edebilir ya da kullanıcıya
 * "henüz yapılandırılmadı" mesajı gösterebilir.
 */
export function isTradovateConfigured(): boolean {
  return Boolean(WORKER_URL && CLIENT_ID)
}

function ensureEnv(): { workerUrl: string; clientId: string } {
  if (!WORKER_URL || !CLIENT_ID) {
    throw new Error('tradovate_not_configured')
  }
  return { workerUrl: WORKER_URL, clientId: CLIENT_ID }
}

/**
 * OAuth code flow başlatır: state üret → localStorage'a yaz → Tradovate
 * authorization sayfasına full-page redirect.
 */
export async function startTradovateConnect(): Promise<void> {
  const { clientId } = ensureEnv()
  const state = crypto.randomUUID()
  window.localStorage.setItem(STATE_KEY, state)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id:     clientId,
    redirect_uri:  REDIRECT_URI,
    state,
  })

  // Tradovate'in resmi authorization endpoint'i.
  window.location.assign(`https://trader.tradovate.com/oauth?${params.toString()}`)
}

async function workerFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { workerUrl } = ensureEnv()
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
    throw new Error(errBody.error ?? `Worker error ${res.status}`)
  }

  return res.json() as Promise<T>
}

export interface ExchangeCodeArgs {
  code: string
}

export async function exchangeCode(args: ExchangeCodeArgs): Promise<TradovateTokenResponse> {
  return workerFetch<TradovateTokenResponse>('/tradovate/exchange-code', {
    method: 'POST',
    body: JSON.stringify({
      grant_type:   'authorization_code',
      code:         args.code,
      redirect_uri: REDIRECT_URI,
    }),
  })
}

export async function refreshAccessToken(refreshToken: string): Promise<TradovateTokenResponse> {
  return workerFetch<TradovateTokenResponse>('/tradovate/refresh-token', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
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
