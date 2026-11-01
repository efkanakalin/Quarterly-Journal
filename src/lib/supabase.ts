import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { localClient } from './localClient'

/**
 * Supabase is optional. Without VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY the
 * app runs in local mode: every trade stays in this browser's localStorage and
 * no account, API key or server is needed.
 */
const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const LOCAL_MODE = !supabaseUrl || !supabaseKey

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

export const supabase: SupabaseClient = LOCAL_MODE
  ? (localClient as unknown as SupabaseClient)
  : createClient(supabaseUrl!, supabaseKey!, {
      auth: {
        storage:          rememberAwareStorage,
        persistSession:   true,
        autoRefreshToken: true,
      },
    })
