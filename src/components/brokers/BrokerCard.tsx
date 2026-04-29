import { toast } from 'sonner'
import { useS } from '@/lib/i18n'
import type { BrokerCatalogEntry } from '@/lib/brokers/types'

interface Props {
  broker: BrokerCatalogEntry
  onConnect?: (slug: BrokerCatalogEntry['slug']) => void
  busy?: boolean
}

export function BrokerCard({ broker, onConnect, busy = false }: Props) {
  const S = useS()

  const handleClick = () => {
    if (busy) return
    if (!broker.available) {
      toast.message(broker.name, { description: S.brokers.comingSoonToast })
      return
    }
    onConnect?.(broker.slug)
  }

  const muted = !broker.available

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className={`group flex w-full flex-col items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${
        muted
          ? 'border-gray-200 bg-white opacity-60 hover:opacity-80 dark:border-white/10 dark:bg-[#141414]'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-white/10 dark:bg-[#1a1a1a] dark:hover:border-white/20 dark:hover:bg-white/5'
      } ${busy ? 'cursor-wait' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg">
          <img src={broker.logo} alt={broker.name} className="h-full w-full object-cover" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{broker.name}</p>
          <span
            className={`mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
              broker.available
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300'
                : 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-[#9ca3af]'
            }`}
          >
            {broker.available ? S.brokers.statusAvailable : S.brokers.statusComingSoon}
          </span>
        </div>
      </div>
    </button>
  )
}
