import { create } from 'zustand'

interface ViewerState {
  /**
   * Admin başka bir kullanıcının journal'ını görüntülüyorsa o kullanıcının
   * id'si; aksi halde null (kendi journal'ım). Bu değer salt-okuma modunu
   * tetikler ve trades fetch'ini hedef kullanıcıya yönlendirir.
   */
  viewingUserId: string | null
  viewingUserLabel: string | null
  setViewing: (userId: string, label: string) => void
  clearViewing: () => void
}

export const useViewerStore = create<ViewerState>((set) => ({
  viewingUserId:    null,
  viewingUserLabel: null,
  setViewing: (userId, label) => set({ viewingUserId: userId, viewingUserLabel: label }),
  clearViewing:     () => set({ viewingUserId: null, viewingUserLabel: null }),
}))

/**
 * UI komponentleri için ortak readOnly kontrolü.
 * Edit/delete/import butonları admin başka birinin journal'ına bakarken
 * gizlenmeli/disabled olmalı.
 */
export function useIsReadOnly(): boolean {
  return useViewerStore(s => s.viewingUserId !== null)
}
