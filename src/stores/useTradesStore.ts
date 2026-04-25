import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { deriveOutcome } from '@/lib/derivations/outcome'
import type { Trade, TradeWithRelations, TradeConfirmation, TradeMistake } from '@/types'

interface TradesState {
  trades: TradeWithRelations[]
  loading: boolean
  error: string | null
  fetchTrades: () => Promise<void>
  deleteTrade: (id: string) => Promise<void>
  /** Syncs local store only — callers are responsible for persisting to Supabase. */
  updateTrade: (
    id: string,
    updates: Partial<Trade>,
    confirmations?: TradeConfirmation[],
    mistakes?: TradeMistake[]
  ) => void
  addTrade: (trade: TradeWithRelations) => void
}

export const useTradesStore = create<TradesState>((set) => ({
  trades: [],
  loading: false,
  error: null,

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

    // CSV trade'lerinde outcome'u güncel eşikle yeniden türet (0-5$ breakeven kuralı).
    // Manuel trade'ler kullanıcının seçtiği outcome'u korur.
    const normalised = (data ?? []).map(t => {
      if (t.source === 'csv' && typeof t.pnl_usd === 'number') {
        return { ...t, outcome: deriveOutcome(t.pnl_usd) }
      }
      return t
    }) as TradeWithRelations[]
    normalised.sort(byEntryTimeDesc)
    set({ trades: normalised, loading: false })
  },

  deleteTrade: async (id: string) => {
    const { error } = await supabase.from('trades').delete().eq('id', id)
    if (error) throw error
    set(state => ({ trades: state.trades.filter(t => t.id !== id) }))
  },

  updateTrade: (id, updates, confirmations, mistakes) => {
    set(state => {
      const next = state.trades.map(t => {
        if (t.id !== id) return t
        return {
          ...t,
          ...updates,
          ...(confirmations !== undefined ? { trade_confirmations: confirmations } : {}),
          ...(mistakes !== undefined ? { trade_mistakes: mistakes } : {}),
        }
      })
      // Re-sort if entry_time_et changed
      if (updates && 'entry_time_et' in updates) next.sort(byEntryTimeDesc)
      return { trades: next }
    })
  },

  addTrade: (trade: TradeWithRelations) => {
    set(state => ({
      trades: [trade, ...state.trades].sort(byEntryTimeDesc),
    }))
  },
}))

function byEntryTimeDesc(a: TradeWithRelations, b: TradeWithRelations): number {
  const ta = a.entry_time_et ? new Date(a.entry_time_et).getTime() : 0
  const tb = b.entry_time_et ? new Date(b.entry_time_et).getTime() : 0
  return tb - ta
}
