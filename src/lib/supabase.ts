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

/**
 * Remember me storage adapter:
 *  - localStorage'da `qt-remember` flag'i okunur (default: 'true')
 *  - 'true' → session localStorage'da kalır (tarayıcı kapansa bile devam)
 *  - 'false' → session sessionStorage'da kalır (sekme kapanınca silinir)
 * Auth.tsx'teki "Remember me" checkbox bu flag'i set eder.
 */
const REMEMBER_KEY = 'qt-remember'
const isRemembering = (): boolean => {
  if (typeof localStorage === 'undefined') return true
  return localStorage.getItem(REMEMBER_KEY) !== 'false'
}

const rememberAwareStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null
    return isRemembering()
      ? window.localStorage.getItem(key)
      : window.sessionStorage.getItem(key)
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return
    // Önce diğer storage'tan temizle ki çakışma olmasın
    if (isRemembering()) {
      window.sessionStorage.removeItem(key)
      window.localStorage.setItem(key, value)
    } else {
      window.localStorage.removeItem(key)
      window.sessionStorage.setItem(key, value)
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(key)
    window.sessionStorage.removeItem(key)
  },
}

// Eksikse fake client kur — hiç çağrılmasa da uygulama mount olabilsin.
// main.tsx zaten bu durumda app'i mount etmek yerine error page basacak.
export const supabase = MISSING_SUPABASE_ENV
  ? createClient('https://placeholder.supabase.co', 'placeholder-anon-key')
  : createClient(supabaseUrl!, supabaseKey!, {
      auth: {
        storage:          rememberAwareStorage,
        persistSession:   true,
        autoRefreshToken: true,
      },
    })
