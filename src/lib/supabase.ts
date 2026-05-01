import { createClient } from '@supabase/supabase-js'

/**
 * Env değişkenleri yoksa modül seviyesinde EXCEPTION fırlatmıyoruz —
 * bu, build başarılı olup deploy edildikten sonra env eksikse
 * tarayıcıyı sessiz beyaz ekrana götürürdü. Bunun yerine bayrağı
 * `MISSING_SUPABASE_ENV` olarak set edip ana giriş noktasında (main.tsx)
 * kullanıcı dostu bir hata sayfası gösteriyoruz.
 */
const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const MISSING_SUPABASE_ENV = !supabaseUrl || !supabaseKey

// Eksikse fake client kur — hiç çağrılmasa da uygulama mount olabilsin.
// main.tsx zaten bu durumda app'i mount etmek yerine error page basacak.
export const supabase = MISSING_SUPABASE_ENV
  ? createClient('https://placeholder.supabase.co', 'placeholder-anon-key')
  : createClient(supabaseUrl!, supabaseKey!)
