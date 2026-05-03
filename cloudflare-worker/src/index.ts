/**
 * QT Journal — Tradovate proxy.
 *
 * Tradovate API tarayıcıdan CORS izni vermez; tüm Tradovate çağrıları
 * bu Worker üzerinden geçer.  Frontend her isteğe Supabase JWT'sini
 * Authorization: Bearer ... header'ı olarak ekler; Worker token'ı
 * doğrular ve sadece geçerli kullanıcılar için Tradovate'e proxy yapar.
 *
 * Routes:
 *   POST /tradovate/refresh-token   { refresh_token }                   → token
 *   POST /tradovate/accounts        { tradovate_access_token }          → Account[]
 *   POST /tradovate/fills           { tradovate_access_token,
 *                                     account_id, from, to }            → { fills, contracts }
 *
 * Tüm endpointler POST'tur — bu, JWT'nin yanlışlıkla URL/log'a sızmasını
 * azaltır ve gizli body alanlarına izin verir.
 *
 * NOT: OAuth client_id/secret artık kullanılmıyor. Kullanıcı Tradovate'ten
 * kendi access token'ını manuel olarak alıp UI'ya yapıştırıyor; worker
 * sadece CORS proxy görevi görüyor.
 */
import { verifySupabaseJwt } from './jwt'
import {
  renewAccessToken,
  listAccounts,
  listFills,
  type Env,
} from './tradovate'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    // CORS preflight.
    if (request.method === 'OPTIONS') {
      return corsResponse(env, null, 204)
    }

    if (request.method !== 'POST') {
      return corsResponse(env, { error: 'Method not allowed' }, 405)
    }

    // Auth.
    let userId: string
    try {
      const authHeader = request.headers.get('Authorization') ?? ''
      const match = authHeader.match(/^Bearer (.+)$/i)
      if (!match) throw new Error('Missing bearer token')
      const claims = await verifySupabaseJwt(match[1], env.SUPABASE_JWT_SECRET)
      userId = claims.sub
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unauthorized'
      return corsResponse(env, { error: msg }, 401)
    }

    // Body size limit (10 KB) — DoS / büyük payload koruması
    const contentLength = parseInt(request.headers.get('Content-Length') ?? '0', 10)
    if (contentLength > 10_000) {
      return corsResponse(env, { error: 'Payload too large' }, 413)
    }

    let body: Record<string, unknown> = {}
    try {
      const text = await request.text()
      if (text.length > 10_000) {
        return corsResponse(env, { error: 'Payload too large' }, 413)
      }
      body = text ? JSON.parse(text) : {}
    } catch {
      return corsResponse(env, { error: 'Invalid JSON body' }, 400)
    }

    try {
      switch (url.pathname) {
        case '/tradovate/refresh-token': {
          const refreshToken = requireString(body, 'refresh_token')
          const tk = await renewAccessToken(env, refreshToken)
          return corsResponse(env, tk, 200)
        }

        case '/tradovate/accounts': {
          const at = requireString(body, 'tradovate_access_token')
          const accounts = await listAccounts(env, at)
          return corsResponse(env, accounts, 200)
        }

        case '/tradovate/fills': {
          const at        = requireString(body, 'tradovate_access_token')
          const accountId = parseInt(requireString(body, 'account_id'), 10)
          if (Number.isNaN(accountId)) throw new Error('account_id must be a number')
          const from = requireString(body, 'from')
          const to   = requireString(body, 'to')
          const result = await listFills(env, at, accountId, from, to)
          return corsResponse(env, result, 200)
        }

        case '/health':
          return corsResponse(env, { ok: true, user: userId }, 200)

        default:
          return corsResponse(env, { error: 'Not found' }, 404)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      const status = (err as { status?: number })?.status ?? 502
      return corsResponse(env, { error: msg }, status === 429 ? 429 : 502)
    }
  },
} satisfies ExportedHandler<Env>

function requireString(body: Record<string, unknown>, key: string): string {
  const v = body[key]
  if (typeof v !== 'string' || v.length === 0) {
    throw new Error(`Missing field: ${key}`)
  }
  return v
}

function corsResponse(env: Env, body: unknown, status: number): Response {
  // Fail-closed: ALLOWED_ORIGIN production'da MUTLAKA set edilmiş olmalı.
  // Wildcard fallback yok — yanlış konfigürasyon sessiz CORS-bypass yaratmasın.
  const allowedOrigin = env.ALLOWED_ORIGIN
  if (!allowedOrigin || allowedOrigin === '*') {
    return new Response(
      JSON.stringify({ error: 'Server misconfiguration: ALLOWED_ORIGIN must be set to a concrete origin' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const headers = new Headers({
    'Access-Control-Allow-Origin':  allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age':       '86400',
    Vary: 'Origin',
    // Defense-in-depth: response header'larında da güvenlik
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy':        'strict-origin-when-cross-origin',
  })
  if (body !== null) {
    headers.set('Content-Type', 'application/json')
    return new Response(JSON.stringify(body), { status, headers })
  }
  return new Response(null, { status, headers })
}
