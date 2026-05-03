import { supabase } from '@/lib/supabase'

/**
 * Migration 010 ile broker_connections.access_token / refresh_token
 * 'enc:<base64>' formatında at-rest şifreli saklanıyor. Token'ı kullanmadan
 * hemen önce bu helper ile çözüyoruz; düz halini hafızada tutmuyoruz.
 *
 * Geriye dönük uyumluluk: 'enc:' prefix'i yoksa zaten plaintext (eski kayıt) →
 * olduğu gibi döner.
 */
export async function decryptToken(token: string | null | undefined): Promise<string | null> {
  if (!token) return null
  if (!token.startsWith('enc:')) return token
  const { data, error } = await supabase.rpc('decrypt_token', { cipher: token })
  if (error) throw new Error(`Token decrypt failed: ${error.message}`)
  return (data as string | null) ?? null
}
