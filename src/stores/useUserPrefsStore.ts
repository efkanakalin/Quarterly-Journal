import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ConfirmationType, Timeframe } from '@/types'
import { DEFAULT_ENABLED_CONFIRMATIONS } from '@/lib/constants/confirmations'
import { DEFAULT_ENABLED_SYMBOLS } from '@/lib/constants/symbols'
import { TIMEFRAMES } from '@/lib/constants/timeframes'

interface UserPrefsState {
  enabledSymbols:       string[]
  enabledConfirmations: ConfirmationType[]
  enabledTimeframes:    Timeframe[]

  setEnabledSymbols:       (v: string[]) => void
  setEnabledConfirmations: (v: ConfirmationType[]) => void
  setEnabledTimeframes:    (v: Timeframe[]) => void

  toggleSymbol:       (s: string) => void
  toggleConfirmation: (c: ConfirmationType) => void
  toggleTimeframe:    (t: Timeframe) => void

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

      setEnabledSymbols:       (v) => set({ enabledSymbols: v }),
      setEnabledConfirmations: (v) => set({ enabledConfirmations: v }),
      setEnabledTimeframes:    (v) => set({ enabledTimeframes: v }),

      toggleSymbol:       (s) => set(st => ({ enabledSymbols:       arrayToggle(st.enabledSymbols, s) })),
      toggleConfirmation: (c) => set(st => ({ enabledConfirmations: arrayToggle(st.enabledConfirmations, c) })),
      toggleTimeframe:    (t) => set(st => ({ enabledTimeframes:    arrayToggle(st.enabledTimeframes, t) })),

      resetDefaults: () => set({
        enabledSymbols:       DEFAULT_ENABLED_SYMBOLS,
        enabledConfirmations: DEFAULT_ENABLED_CONFIRMATIONS,
        enabledTimeframes:    [...TIMEFRAMES],
      }),
    }),
    { name: 'qt-user-prefs' },
  ),
)
