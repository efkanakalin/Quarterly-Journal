import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Trade, TradeWithRelations } from '@/types'

interface TradesState {
  trades: TradeWithRelations[]
  loading: boolean
  error: string | null
  fetchTrades: () => Promise<void>
  deleteTrade: (id: string) => Promise<void>
  updateTrade: (id: string, updates: Partial<Trade>) => Promise<void>
  addTrade: (trade: TradeWithRelations) => void
}

export const useTradesStore = create<TradesState>((set) => ({
  trades:  [],
  loading: false,
  error:   null,

  fetchTrades: async () => {
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('trades')
      .select(`
        *,
        trade_confirmations(*),
        trade_mistakes(*)
      `)
      .order('entry_time_et', { ascending: false })

    if (error) {
      set({ error: error.message, loading: false })
      return
    }

    set({ trades: (data ?? []) as TradeWithRelations[], loading: false })
  },

  deleteTrade: async (id: string) => {
    const { error } = await supabase.from('trades').delete().eq('id', id)
    if (error) throw error
    set(state => ({ trades: state.trades.filter(t => t.id !== id) }))
  },

  updateTrade: async (id: string, updates: Partial<Trade>) => {
    const { error } = await supabase
      .from('trades')
      .update(updates)
      .eq('id', id)

    if (error) throw error

    set(state => ({
      trades: state.trades.map(t =>
        t.id === id ? { ...t, ...updates } : t
      ),
    }))
  },

  addTrade: (trade: TradeWithRelations) => {
    set(state => ({ trades: [trade, ...state.trades] }))
  },
}))
