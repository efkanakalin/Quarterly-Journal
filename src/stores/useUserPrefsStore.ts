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

  setEnabledSymbols:       (v: string[]) => void
  setEnabledConfirmations: (v: ConfirmationType[]) => void
  setEnabledTimeframes:    (v: Timeframe[]) => void
  setEnabledColumns:       (v: JournalColumnId[]) => void

  toggleSymbol:       (s: string) => void
  toggleConfirmation: (c: ConfirmationType) => void
  toggleTimeframe:    (t: Timeframe) => void
  toggleColumn:       (c: JournalColumnId) => void

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

      setEnabledSymbols:       (v) => set({ enabledSymbols: v }),
      setEnabledConfirmations: (v) => set({ enabledConfirmations: v }),
      setEnabledTimeframes:    (v) => set({ enabledTimeframes: v }),
      setEnabledColumns:       (v) => set({ enabledColumns: v }),

      toggleSymbol:       (s) => set(st => ({ enabledSymbols:       arrayToggle(st.enabledSymbols, s) })),
      toggleConfirmation: (c) => set(st => ({ enabledConfirmations: arrayToggle(st.enabledConfirmations, c) })),
      toggleTimeframe:    (t) => set(st => ({ enabledTimeframes:    arrayToggle(st.enabledTimeframes, t) })),
      toggleColumn:       (c) => set(st => ({ enabledColumns:       arrayToggle(st.enabledColumns, c) })),

      resetDefaults: () => set({
        enabledSymbols:       DEFAULT_ENABLED_SYMBOLS,
        enabledConfirmations: DEFAULT_ENABLED_CONFIRMATIONS,
        enabledTimeframes:    [...TIMEFRAMES],
        enabledColumns:       [...DEFAULT_ENABLED_COLUMNS],
      }),
    }),
    { name: 'qt-user-prefs' },
  ),
)
