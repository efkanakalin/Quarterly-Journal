import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export type UserRole = 'user' | 'admin'

interface AuthState {
  user: User | null
  session: Session | null
  role: UserRole | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string, meta?: { firstName: string; lastName: string; username: string }) => Promise<{ needsConfirmation: boolean }>
  resetPassword: (email: string) => Promise<void>
  signOut: () => Promise<void>
  setSession: (session: Session | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user:    null,
  session: null,
  role:    null,
  loading: true,

  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
    if (error) throw error
  },

  signInWithEmail: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  },

  signUpWithEmail: async (email, password, meta?: { firstName: string; lastName: string; username: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: meta ? {
          first_name:   meta.firstName,
          last_name:    meta.lastName,
          username:     meta.username.toLowerCase(),
          display_name: `${meta.firstName.trim()} ${meta.lastName.trim()}`,
        } : undefined,
      },
    })
    if (error) throw error

    // If session returned immediately (email confirmation disabled), create profile now.
    if (data.session && data.user && meta) {
      await supabase.from('profiles').upsert({
        id:           data.user.id,
        username:     meta.username.toLowerCase(),
        display_name: `${meta.firstName.trim()} ${meta.lastName.trim()}`,
      })
    }

    return { needsConfirmation: !data.session }
  },

  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/dashboard`,
    })
    if (error) throw error
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null, role: null })
  },

  setSession: (session) => {
    const user = session?.user ?? null
    set({ session, user, loading: false })

    // Profile.role'ü arka planda çek; null oturumda role'ü temizle.
    if (!user) { set({ role: null }); return }
    void supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        const r = data?.role
        set({ role: r === 'admin' ? 'admin' : 'user' })
      })
  },
}))
