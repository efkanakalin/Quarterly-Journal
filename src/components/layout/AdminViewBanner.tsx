import { ShieldCheck, X } from 'lucide-react'
import { useViewerStore } from '@/stores/useViewerStore'
import { useTradesStore } from '@/stores/useTradesStore'
import { useS } from '@/lib/i18n'

/**
 * Admin başka bir kullanıcının journal'ını görüntülüyorsa ekran üstünde
 * sürekli görünen amber banner. "Çık" butonu görüntülemeyi sıfırlar ve
 * trades store'unu admin'in kendi user_id'sine göre yeniden yükler.
 */
export function AdminViewBanner() {
  const S = useS()
  const viewingUserId    = useViewerStore(s => s.viewingUserId)
  const viewingUserLabel = useViewerStore(s => s.viewingUserLabel)
  const clearViewing     = useViewerStore(s => s.clearViewing)
  const fetchTrades      = useTradesStore(s => s.fetchTrades)

  if (!viewingUserId) return null

  const handleExit = async () => {
    clearViewing()
    await fetchTrades()
  }

  return (
    <div className="sticky top-0 z-30 flex items-center gap-2 border-b border-amber-300/60 bg-amber-50 px-4 py-2 text-xs text-amber-900 shadow-sm dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">
      <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1 truncate">{S.admin.bannerViewing(viewingUserLabel ?? '—')}</span>
      <button
        onClick={handleExit}
        className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-white px-2 py-1 text-[11px] font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-400/40 dark:bg-transparent dark:text-amber-100 dark:hover:bg-amber-400/15"
      >
        <X className="h-3 w-3" />{S.admin.exitView}
      </button>
    </div>
  )
}
