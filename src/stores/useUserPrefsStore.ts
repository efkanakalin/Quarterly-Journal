import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ConfirmationType, Timeframe } from '@/types'
import { DEFAULT_ENABLED_CONFIRMATIONS } from '@/lib/constants/confirmations'
import { DEFAULT_ENABLED_SYMBOLS } from '@/lib/constants/symbols'
import { TIMEFRAMES } from '@/lib/constants/timeframes'
import { DEFAULT_ENABLED_COLUMNS, type JournalColumnId } from '@/lib/constants/journalColumns'

interface UserPrefsState {
  enabledSymbols:       string[]
  enabledConfirmations: ConfirmationType[]
  enabledTimeframes:    Timeframe[]
  enabledColumns:       JournalColumnId[]

  /** Kullanıcının kendi eklediği custom entry/confluence label'ları. Built-in
   *  CONFIRMATIONS listesine ek olarak Add Trade ekranında gösterilirler. */
  customConfirmations:  string[]

  /** Kullanıcının kendi eklediği custom pair/symbol kodları. Built-in
   *  SYMBOLS_LIST'e ek olarak Add Trade ekranında gösterilirler. */
  customSymbols:        string[]

  setEnabledSymbols:       (v: string[]) => void
  setEnabledConfirmations: (v: ConfirmationType[]) => void
  setEnabledTimeframes:    (v: Timeframe[]) => void
  setEnabledColumns:       (v: JournalColumnId[]) => void

  toggleSymbol:       (s: string) => void
  toggleConfirmation: (c: ConfirmationType) => void
  toggleTimeframe:    (t: Timeframe) => void
  toggleColumn:       (c: JournalColumnId) => void

  addCustomConfirmation: (label: string) => void
  addCustomSymbol:       (code: string) => void

  resetDefaults: () => void
}

const arrayToggle = <T,>(arr: T[], item: T): T[] =>
  arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]

export const useUserPrefsStore = create<UserPrefsState>()(
  persist(
    (set) => ({
      enabledSymbols:       DEFAULT_ENABLED_SYMBOLS,
      enabledConfirmations: DEFAULT_ENABLED_CONFIRMATIONS,
      enabledTimeframes:    [...TIMEFRAMES],
      enabledColumns:       [...DEFAULT_ENABLED_COLUMNS],
      customConfirmations:  [],
      customSymbols:        [],

      setEnabledSymbols:       (v) => set({ enabledSymbols: v }),
      setEnabledConfirmations: (v) => set({ enabledConfirmations: v }),
      setEnabledTimeframes:    (v) => set({ enabledTimeframes: v }),
      setEnabledColumns:       (v) => set({ enabledColumns: v }),

      toggleSymbol:       (s) => set(st => ({ enabledSymbols:       arrayToggle(st.enabledSymbols, s) })),
      toggleConfirmation: (c) => set(st => ({ enabledConfirmations: arrayToggle(st.enabledConfirmations, c) })),
      toggleTimeframe:    (t) => set(st => ({ enabledTimeframes:    arrayToggle(st.enabledTimeframes, t) })),
      toggleColumn:       (c) => set(st => ({ enabledColumns:       arrayToggle(st.enabledColumns, c) })),

      addCustomConfirmation: (label) => set(st => {
        const trimmed = label.trim().slice(0, 24)
        if (!trimmed) return st
        if (st.customConfirmations.includes(trimmed)) return st
        return { customConfirmations: [...st.customConfirmations, trimmed] }
      }),
      addCustomSymbol: (code) => set(st => {
        const trimmed = code.trim().toUpperCase().slice(0, 16)
        if (!trimmed) return st
        if (st.customSymbols.includes(trimmed)) return st
        return { customSymbols: [...st.customSymbols, trimmed] }
      }),

      resetDefaults: () => set({
        enabledSymbols:       DEFAULT_ENABLED_SYMBOLS,
        enabledConfirmations: DEFAULT_ENABLED_CONFIRMATIONS,
        enabledTimeframes:    [...TIMEFRAMES],
        enabledColumns:       [...DEFAULT_ENABLED_COLUMNS],
        customConfirmations:  [],
        customSymbols:        [],
      }),
    }),
    { name: 'qt-user-prefs' },
  ),
)
