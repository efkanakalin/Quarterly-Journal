/**
 * Supabase JWT doğrulama. Sadece HS256 destekler (Supabase'in default'u).
 *
 * SUPABASE_JWT_SECRET production'da Worker secret olarak verilir
 * (Supabase project Settings → API → JWT Secret).
 */
export interface SupabaseJwtPayload {
  sub: string             // user id
  email?: string
  role?: string
  aud?: string
  iss?: string
  exp: number
  iat?: number
}

export async function verifySupabaseJwt(
  token: string,
  secret: string,
): Promise<SupabaseJwtPayload> {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Invalid JWT structure')

  const [headerB64, payloadB64, sigB64] = parts
  const header = JSON.parse(b64UrlDecode(headerB64))
  if (header.alg !== 'HS256') {
    throw new Error(`Unsupported JWT alg: ${header.alg}`)
  }

  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`)
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  )
  const sig = base64UrlToUint8Array(sigB64)
  const valid = await crypto.subtle.verify('HMAC', key, sig, data)
  if (!valid) throw new Error('JWT signature mismatch')

  const payload = JSON.parse(b64UrlDecode(payloadB64)) as SupabaseJwtPayload
  if (typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now()) {
    throw new Error('JWT expired')
  }
  if (!payload.sub) throw new Error('JWT missing sub')
  return payload
}

function b64UrlDecode(b64url: string): string {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(b64url.length / 4) * 4, '=')
  return atob(b64)
}

function base64UrlToUint8Array(b64url: string): Uint8Array {
  const bin = b64UrlDecode(b64url)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return arr
}
