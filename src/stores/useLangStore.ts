import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Lang = 'en' | 'tr'

interface LangState {
  lang: Lang
  setLang: (l: Lang) => void
  toggle: () => void
}

export const useLangStore = create<LangState>()(
  persist(
    (set) => ({
      lang: 'en',
      setLang: (l) => set({ lang: l }),
      toggle: () => set(s => ({ lang: s.lang === 'en' ? 'tr' : 'en' })),
    }),
    { name: 'qt-lang' }
  )
)
