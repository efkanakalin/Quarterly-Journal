import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { BrokerConnection } from '@/types'

interface BrokerConnectionsState {
  connections: BrokerConnection[]
  loading: boolean
  error: string | null
  fetchConnections: () => Promise<void>
  upsertConnection: (conn: BrokerConnection) => void
  removeConnection: (id: string) => Promise<void>
  patchConnection: (id: string, patch: Partial<BrokerConnection>) => void
}

export const useBrokerConnectionsStore = create<BrokerConnectionsState>((set) => ({
  connections: [],
  loading: false,
  error: null,

  fetchConnections: async () => {
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('broker_connections')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      set({ error: error.message, loading: false })
      return
    }
    set({ connections: (data ?? []) as BrokerConnection[], loading: false })
  },

  upsertConnection: (conn) => {
    set(state => {
      const idx = state.connections.findIndex(c => c.id === conn.id)
      if (idx === -1) return { connections: [...state.connections, conn] }
      const next = [...state.connections]
      next[idx] = conn
      return { connections: next }
    })
  },

  removeConnection: async (id) => {
    const { error } = await supabase.from('broker_connections').delete().eq('id', id)
    if (error) throw error
    set(state => ({ connections: state.connections.filter(c => c.id !== id) }))
  },

  patchConnection: (id, patch) => {
    set(state => ({
      connections: state.connections.map(c => c.id === id ? { ...c, ...patch } : c),
    }))
  },
}))
